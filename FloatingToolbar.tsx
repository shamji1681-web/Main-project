import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

const FloatingToolbar: React.FC = () => {
  const { canvas, saveToHistory } = useEditorStore();
  const [visible, setVisible]         = useState(false);
  const [pos, setPos]                 = useState({ x: 0, y: 0 });
  const [activeObj, setActiveObj]     = useState<any>(null);
  const [showPosition, setShowPosition] = useState(false);
  const [showAI, setShowAI]           = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<any>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) { setVisible(false); setActiveObj(null); return; }
    setActiveObj(obj);

    const el   = canvas.getElement();
    const rect = el.getBoundingClientRect();
    // The canvas element is scaled by CSS (zoom), but getBoundingRect() returns
    // coordinates in canvas (object) space. We need to convert to screen space.
    const canvasWidth  = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const cssScaleX = rect.width  / canvasWidth;
    const cssScaleY = rect.height / canvasHeight;

    const bnd = obj.getBoundingRect(); // in canvas-space pixels
    // Convert canvas-space to screen pixels
    const screenLeft   = rect.left + bnd.left   * cssScaleX;
    const screenTop    = rect.top  + bnd.top    * cssScaleY;
    const screenWidth  = bnd.width  * cssScaleX;
    const screenHeight = bnd.height * cssScaleY;

    const barW  = 290;
    const barH  = 44;
    const gap   = 50;   // gap between element top edge and toolbar bottom
    let tx = screenLeft + screenWidth / 2 - barW / 2;
    // Place ABOVE the element with gap
    let ty = screenTop - barH - gap;
    // Clamp horizontally
    tx = Math.max(8, Math.min(window.innerWidth - barW - 8, tx));
    // If no room above, place below with same gap
    if (ty < 8) ty = screenTop + screenHeight + gap;

    setPos({ x: tx, y: ty });
    setVisible(true);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    const clear = () => { setVisible(false); setActiveObj(null); setShowPosition(false); setShowAI(false); };
    canvas.on('selection:created', updatePos);
    canvas.on('selection:updated', updatePos);
    canvas.on('object:moving',     updatePos);
    canvas.on('object:scaling',    updatePos);
    canvas.on('object:rotating',   updatePos);
    canvas.on('selection:cleared', clear);
    return () => {
      canvas.off('selection:created', updatePos);
      canvas.off('selection:updated', updatePos);
      canvas.off('object:moving',     updatePos);
      canvas.off('object:scaling',    updatePos);
      canvas.off('object:rotating',   updatePos);
      canvas.off('selection:cleared', clear);
    };
  }, [canvas, updatePos]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowPosition(false); setShowAI(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!visible || !activeObj) return null;

  /* ── actions ── */
  const duplicate = () => {
    if (!canvas||!activeObj) return;
    activeObj.clone().then((c:any)=>{
      c.set({left:(c.left||0)+20,top:(c.top||0)+20});
      canvas.add(c); canvas.setActiveObject(c); canvas.renderAll(); saveToHistory();
    });
  };

  const remove = () => {
    if (!canvas||!activeObj) return;
    canvas.remove(activeObj); canvas.discardActiveObject(); canvas.renderAll(); saveToHistory();
    setVisible(false);
  };

  void copiedStyle; void setCopiedStyle;

  /* Layering */
  const bringForward = () => { if(!canvas||!activeObj)return; canvas.bringObjectForward(activeObj); canvas.renderAll(); saveToHistory(); };
  const sendBackward = () => { if(!canvas||!activeObj)return; canvas.sendObjectBackwards(activeObj); canvas.renderAll(); saveToHistory(); };
  const bringToFront = () => { if(!canvas||!activeObj)return; canvas.bringObjectToFront(activeObj); canvas.renderAll(); saveToHistory(); };
  const sendToBack   = () => { if(!canvas||!activeObj)return; canvas.sendObjectToBack(activeObj); canvas.renderAll(); saveToHistory(); };

  /* Position align */
  const align = (cmd: string) => {
    if(!canvas||!activeObj) return;
    const W=canvas.getWidth(), H=canvas.getHeight();
    const ow=activeObj.getScaledWidth(), oh=activeObj.getScaledHeight();
    const cx=(activeObj.left||0)+(ow/2), cy=(activeObj.top||0)+(oh/2);
    switch(cmd){
      case 'left':   activeObj.set({left:0}); break;
      case 'center': activeObj.set({left:W/2-ow/2}); break;
      case 'right':  activeObj.set({left:W-ow}); break;
      case 'top':    activeObj.set({top:0}); break;
      case 'middle': activeObj.set({top:H/2-oh/2}); break;
      case 'bottom': activeObj.set({top:H-oh}); break;
    }
    void cx; void cy;
    activeObj.setCoords(); canvas.renderAll(); saveToHistory();
    setShowPosition(false);
  };

  /* AI text transform (text objects only) */
  const isText = ['textbox','text','i-text'].includes(activeObj?.type||'');
  const AI_ACTIONS = [
    {label:'Make Professional',fn:()=>transformFl('professional')},
    {label:'Make Shorter',fn:()=>transformFl('shorter')},
    {label:'Make Longer',fn:()=>transformFl('longer')},
    {label:'Rewrite',fn:()=>transformFl('rewrite')},
    {label:'Fix Grammar',fn:()=>transformFl('grammar')},
  ];
  function transformFl(ins:string){
    if(!activeObj||!canvas)return;
    const t=activeObj.text||'';
    let r=t;
    switch(ins){
      case 'professional': r=t.charAt(0).toUpperCase()+t.slice(1).replace(/!!+/g,'.'); break;
      case 'shorter': {const w=t.split(' ');r=w.length>4?w.slice(0,Math.ceil(w.length*0.6)).join(' ')+'...':t;} break;
      case 'longer': r=t+(t.endsWith('.')?'':'.')+' Discover more today.'; break;
      case 'rewrite': {const w=t.split(' ');r=w.length>2?w.reverse().join(' '):t;} break;
      case 'grammar': r=t.charAt(0).toUpperCase()+t.slice(1).replace(/\s+([.,!?])/g,'$1'); break;
    }
    activeObj.set('text',r); canvas.renderAll(); saveToHistory(); setShowAI(false);
  }

  return (
    <div ref={toolbarRef} className="fixed pointer-events-auto" style={{left:pos.x,top:pos.y,zIndex:99999}}>

      {/* ── Main bar ── */}
      <div className="bg-[#1e1e2e] border border-gray-600/40 rounded-xl shadow-2xl shadow-black/60 flex items-center px-2 py-1.5 gap-1">

        {/* AI write (text only) */}
        {isText && (
          <div className="relative">
            <ToolBtn
              onClick={()=>{setShowAI(p=>!p);setShowPosition(false);}}
              active={showAI}
              icon={<span className="text-xs">✦</span>}
              label="AI write"
              accent
            />
            {showAI && (
              <div className="absolute bottom-full mb-2 left-0 bg-[#1a1a2e] border border-gray-600/40 rounded-xl shadow-2xl p-2 w-48" style={{zIndex:99999}}>
                <p className="text-gray-500 text-[9px] font-semibold uppercase tracking-wider mb-1 px-1">AI Write</p>
                {AI_ACTIONS.map((a,i)=>(
                  <button key={i} onClick={a.fn}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white rounded transition-all">
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Duplicate */}
        <ToolBtn onClick={duplicate} title="Duplicate"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>}
        />

        {/* Delete */}
        <ToolBtn onClick={remove} title="Delete" danger
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>}
        />

        {/* Position button — shows layering + align dropdown below */}
        <div className="relative">
          <ToolBtn
            onClick={()=>{setShowPosition(p=>!p);setShowAI(false);}}
            active={showPosition}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>}
            label="Position"
            showArrow
          />

          {showPosition && (
            <div
              className="absolute bottom-full mb-2 right-0 bg-[#1e1e2e] border border-gray-600/40 rounded-xl shadow-2xl overflow-hidden"
              style={{width:280, zIndex:99999}}
            >
              {/* Arrow tip */}
              <div className="absolute bottom-[-7px] right-10 w-3 h-3 bg-[#1e1e2e] border-r border-b border-gray-600/40 rotate-45"/>

              {/* Layering section */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-700/30">
                <p className="text-white text-sm font-bold mb-2.5">Layering</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <PosBtn onClick={bringForward} icon="∧" label="Forward"/>
                  <PosBtn onClick={sendBackward} icon="∨" label="Backward"/>
                  <PosBtn onClick={bringToFront} icon="⋀" label="To Front"/>
                  <PosBtn onClick={sendToBack}   icon="⋁" label="To back"/>
                </div>
              </div>

              {/* Position / Align section */}
              <div className="px-4 pt-3 pb-4">
                <p className="text-white text-sm font-bold mb-2.5">Position</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <AlignBtn onClick={()=>align('left')}   icon="⊢" label="Align left"/>
                  <AlignBtn onClick={()=>align('top')}    icon="⊤" label="Align top"/>
                  <AlignBtn onClick={()=>align('center')} icon="⊣" label="Align center"/>
                  <AlignBtn onClick={()=>align('middle')} icon="⊥" label="Align middle"/>
                  <AlignBtn onClick={()=>align('right')}  icon="⊣" label="Align right"/>
                  <AlignBtn onClick={()=>align('bottom')} icon="⊤" label="Align bottom"/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── small sub-components ── */
const ToolBtn: React.FC<{
  onClick:()=>void; title?:string; icon:React.ReactNode; label?:string;
  danger?:boolean; active?:boolean; accent?:boolean; disabled?:boolean; showArrow?:boolean;
}> = ({onClick,title,icon,label,danger,active,accent,disabled,showArrow}) => (
  <button
    onClick={onClick} title={title} disabled={disabled}
    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all focus:outline-none ${
      disabled ? 'opacity-30 cursor-not-allowed text-gray-500' :
      danger   ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' :
      accent   ? (active?'bg-purple-600 text-white':'text-purple-300 hover:bg-purple-600/20 border border-purple-500/30') :
      active   ? 'bg-[#2a2a5a] text-white' :
                 'text-gray-300 hover:text-white hover:bg-white/5'
    }`}>
    {icon}
    {label && <span>{label}</span>}
    {showArrow && <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>}
  </button>
);

const PosBtn: React.FC<{onClick:()=>void;icon:string;label:string}> = ({onClick,icon,label}) => (
  <button onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a5a] transition-all text-xs">
    <span className="text-base leading-none text-gray-400 w-4 text-center">{icon}</span>
    {label}
  </button>
);

const AlignBtn: React.FC<{onClick:()=>void;icon:string;label:string}> = ({onClick,icon,label}) => (
  <button onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a5a] transition-all text-xs">
    <span className="text-sm leading-none text-gray-400 w-4 text-center">{icon}</span>
    {label}
  </button>
);

export default FloatingToolbar;
