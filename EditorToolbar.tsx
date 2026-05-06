import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gradient, Group, Circle as FabricCircle, Rect, Textbox } from 'fabric';
import { useEditorStore } from '../store/editorStore';
import ColorPicker, { type GradStop } from './ColorPicker';

/* Apply gradient fill to a fabric object or group recursively */
function applyGradientFill(obj: any, canvas: any, stops: GradStop[], angleDeg: number) {
  if (!obj || !canvas) return;
  const rad = (angleDeg * Math.PI) / 180;
  const w = obj.width  || 200;
  const h = obj.height || 60;
  const halfD = Math.sqrt(w*w + h*h) / 2;
  const x1 = w/2 - halfD * Math.cos(rad);
  const y1 = h/2 - halfD * Math.sin(rad);
  const x2 = w/2 + halfD * Math.cos(rad);
  const y2 = h/2 + halfD * Math.sin(rad);
  const grad = new Gradient({
    type: 'linear',
    coords: { x1, y1, x2, y2 },
    colorStops: stops.map(s => ({ offset: s.offset, color: s.color })),
  });

  const applyRecursive = (target: any) => {
    if (target.getObjects) {
      target.getObjects().forEach(applyRecursive);
    } else {
      if (target.set) {
        // For SVG stroke-based icons (stroke-width > 0, fill === 'none'), apply to stroke
        if (target.strokeWidth && target.strokeWidth > 0 && (!target.fill || target.fill === 'none')) {
          target.set('stroke', grad);
        } else {
          target.set('fill', grad);
        }
      }
    }
  };

  // For curved text, owner textbox is updated and visible arc glyphs mirror it
  const arcGroup = findArcGroup(canvas, obj);
  if (arcGroup) {
    obj.set('fill', grad);
    applyRecursive(arcGroup);
  } else {
    applyRecursive(obj);
  }
  canvas.renderAll();
}

const ARC_TAG = '__isArcGroup';
const ARC_OWNER = '__arcOwnerId';

function findArcGroup(canvas: any, owner: any) {
  const ownerId = owner?.__uid || owner?.id;
  if (!canvas || !ownerId) return null;
  return canvas.getObjects().find((o: any) => o[ARC_TAG] && o[ARC_OWNER] === ownerId) || null;
}

function applyToArcGlyphs(canvas: any, owner: any, key: string, val: any) {
  const group = findArcGroup(canvas, owner);
  if (!group?.getObjects) return;

  // A single-character IText cannot visually use charSpacing by itself.
  // Curved text is built from one glyph per character, so spacing must be
  // applied by recalculating each glyph's position along the arc.
  if (key === 'charSpacing') {
    repositionArcGlyphs(canvas, owner, group, val);
    return;
  }

  group.getObjects().forEach((child: any) => {
    // Skip non-text background shapes inside the arc group
    if (!['i-text', 'text', 'textbox'].includes(child.type || '')) return;
    if (key === 'opacity') child.set('opacity', val / 100);
    else if (key === 'strokeWidth') {
      child.set('strokeWidth', val);
      child.set('paintFirst', val > 0 ? 'stroke' : 'fill');
    } else {
      child.set(key, val);
    }
  });
}

function repositionArcGlyphs(canvas: any, owner: any, group: any, charSpacing: number) {
  const glyphs = group.getObjects().filter((child: any) =>
    ['i-text', 'text', 'textbox'].includes(child.type || '')
  );
  if (!glyphs.length) return;

  const power = owner.__curvePower || 20;
  const absP = Math.max(1, Math.abs(power));
  const isLower = power < 0;
  const fontSize = owner.fontSize || glyphs[0].fontSize || 32;
  const radius = (fontSize * 55) / absP;

  const baseCharWidth = fontSize * 0.58;
  const spacingExtra = fontSize * (charSpacing || 0) / 4000;
  let charWidth = Math.max(fontSize * 0.2, baseCharWidth + spacingExtra);

  const maxTotalAngle = (340 * Math.PI) / 180;
  const maxAnglePerChar = maxTotalAngle / glyphs.length;
  let anglePerChar = charWidth / radius;
  if (anglePerChar > maxAnglePerChar) {
    anglePerChar = maxAnglePerChar;
    charWidth = anglePerChar * radius;
  }

  const totalAngle = anglePerChar * glyphs.length;

  // Upper arc: text on top, reads left→right (angle increases from -π/2 - half)
  // Lower arc: text on bottom, reads left→right (angle decreases from π/2 + half)
  //            Glyph rotation flipped so letters read upright (not upside down)
  const angleAt = (i: number) => isLower
    ? (Math.PI / 2 + totalAngle / 2) - anglePerChar * (i + 0.5)
    : (-Math.PI / 2 - totalAngle / 2) + anglePerChar * (i + 0.5);
  const rotAt = (a: number) => isLower
    ? (a * 180) / Math.PI - 90
    : (a * 180) / Math.PI + 90;

  // 1. Update each glyph's position along the arc
  glyphs.forEach((glyph: any, i: number) => {
    const angle = angleAt(i);
    glyph.set({
      left: radius * Math.cos(angle),
      top: radius * Math.sin(angle),
      angle: rotAt(angle),
      charSpacing: 0,
    });
  });

  // 2. Update background rect if it exists
  const bg = group.getObjects().find((o: any) => o.type === 'rect');
  if (bg) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    glyphs.forEach((g: any) => {
      // Calculate actual bounding box of each rotated glyph
      const matrix = g.calcTransformMatrix();
      const halfW = (g.width || fontSize * 0.8) / 2;
      const halfH = (g.height || fontSize * 1.0) / 2;
      const corners = [
        { x: -halfW, y: -halfH },
        { x: halfW, y: -halfH },
        { x: halfW, y: halfH },
        { x: -halfW, y: halfH },
      ];
      for (const c of corners) {
        const tx = matrix[0] * c.x + matrix[2] * c.y + matrix[4];
        const ty = matrix[1] * c.x + matrix[3] * c.y + matrix[5];
        minX = Math.min(minX, tx);
        maxX = Math.max(maxX, tx);
        minY = Math.min(minY, ty);
        maxY = Math.max(maxY, ty);
      }
    });
    const pad = owner.__curveBgPad ?? 10;
    bg.set({
      left: minX - pad,
      top: minY - pad,
      width: (maxX - minX) + pad * 2,
      height: (maxY - minY) + pad * 2,
    });
  }

  // 3. The most reliable way to update selection box in Fabric.js:
  // Remove the group, recreate it with updated objects, and re-add it.
  // This forces Fabric to properly recalculate bounds.
  const allObjects = group.getObjects();
  const groupProps = {
    left: group.left,
    top: group.top,
    angle: group.angle,
    scaleX: group.scaleX,
    scaleY: group.scaleY,
    opacity: group.opacity,
    flipX: group.flipX,
    flipY: group.flipY,
    visible: group.visible,
    selectable: group.selectable,
    evented: group.evented,
    hasControls: group.hasControls,
    hasBorders: group.hasBorders,
    borderColor: group.borderColor,
    cornerColor: group.cornerColor,
    cornerSize: group.cornerSize,
    transparentCorners: group.transparentCorners,
    cornerStyle: group.cornerStyle,
    padding: group.padding,
  };
  
  // Preserve custom tags
  const arcTag = (group as any)[ARC_TAG];
  const arcOwner = (group as any)[ARC_OWNER];
  const groupId = (group as any).id;
  const groupName = (group as any).name;
  const editHandler = (group as any).__editHandler || (group as any).__onDblClick;
  const blurRender = (group as any).__origRender;

  // Remove old group
  canvas.remove(group);

  // Create new group with same objects
  const newGroup = new Group(allObjects, {
    ...groupProps,
    originX: 'center',
    originY: 'center',
  });

  // Restore custom tags and handlers
  (newGroup as any)[ARC_TAG] = arcTag;
  (newGroup as any)[ARC_OWNER] = arcOwner;
  (newGroup as any).id = groupId;
  (newGroup as any).name = groupName;
  if (blurRender) {
    (newGroup as any).render = blurRender.bind(newGroup);
  }
  if (editHandler) {
    newGroup.on('mousedblclick', editHandler);
    (newGroup as any).__editHandler = editHandler;
    (newGroup as any).__onDblClick = editHandler;
  }

  canvas.add(newGroup);
  canvas.setActiveObject(newGroup);
  canvas.requestRenderAll();
}

// pt ↔ px (96 DPI)
const PX_PER_PT = 96 / 72;
const pxToPt = (px: number) => Math.round(px / PX_PER_PT);
const ptToPx = (pt: number) => Math.round(pt * PX_PER_PT);

const FONTS = [
  'Inter','Playfair Display','Roboto','Open Sans','Montserrat','Lato','Poppins',
  'Oswald','Raleway','Merriweather','Dancing Script','Pacifico','Bebas Neue','Lobster','Abril Fatface',
];

const AI_PROMPTS = [
  { label: '📝 Professional', ins: 'professional' },
  { label: '🎉 Fun & Catchy',  ins: 'fun' },
  { label: '✂️ Shorter',      ins: 'shorter' },
  { label: '📖 Longer',       ins: 'longer' },
  { label: '🔄 Rewrite',      ins: 'rewrite' },
  { label: '✨ Fix Grammar',   ins: 'grammar' },
  { label: '💼 Business',     ins: 'business' },
  { label: '😊 Casual',       ins: 'casual' },
  { label: '📢 Call to Action',ins: 'cta' },
  { label: '📋 Add Tagline',  ins: 'tagline' },
];

function transformText(t: string, ins: string): string {
  switch (ins) {
    case 'professional': return t.charAt(0).toUpperCase()+t.slice(1).replace(/!!+/g,'.').replace(/\s{2,}/g,' ');
    case 'fun':          return t+' ✨🎉';
    case 'shorter':      { const w=t.split(' '); return w.length>4?w.slice(0,Math.ceil(w.length*0.6)).join(' ')+'...':t; }
    case 'longer':       return t+(t.endsWith('.')?'':'.')+' Discover more about what makes us unique.';
    case 'rewrite':      { const w=t.split(' '); return w.length>2?w.reverse().join(' '):t; }
    case 'grammar':      return t.charAt(0).toUpperCase()+t.slice(1).replace(/\s+([.,!?])/g,'$1');
    case 'business':     return t.replace(/hey|hi|hello/gi,'Dear valued partner').replace(/cool|awesome|great/gi,'excellent');
    case 'casual':       return t.replace(/Dear\s+\w+/gi,'Hey').replace(/Sincerely|Regards/gi,'Cheers');
    case 'cta':          return t+'\n\n👉 Get Started Today →';
    case 'tagline':      return t+'\n— Excellence in Every Detail';
    default:             return t;
  }
}

// Text case options
const TEXT_CASES = [
  { label: 'AA — UPPERCASE',     fn: (s:string)=>s.toUpperCase() },
  { label: 'aa — lowercase',     fn: (s:string)=>s.toLowerCase() },
  { label: 'Aa — Title Case',    fn: (s:string)=>s.replace(/\b\w/g,c=>c.toUpperCase()) },
  { label: 'Aa. — Sentence Case',fn: (s:string)=>s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() },
  { label: 'aA — Toggle Case',   fn: (s:string)=>s.split('').map(c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()).join('') },
];

const Sep = () => <div className="w-px h-5 bg-gray-700/40 shrink-0 mx-0.5"/>;

// Generic dropdown — uses fixed positioning so it escapes overflow:hidden/auto clipping
const Drop: React.FC<{
  trigger: React.ReactNode; open: boolean; onClose: ()=>void;
  children: React.ReactNode; width?: number; align?: 'left'|'right';
}> = ({trigger, open, onClose, children, width=220, align='left'}) => {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const dropRef   = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({top:0, left:0});

  // Recalculate dropdown position whenever it opens
  useEffect(()=>{
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const left = align==='right' ? r.right - width : r.left;
    setCoords({ top: r.bottom + 4, left: Math.max(4, left) });
  },[open, align, width]);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      const t=e.target as Node;
      const inWrap=wrapRef.current?.contains(t);
      const inDrop=dropRef.current?.contains(t);
      if(!inWrap && !inDrop) onClose();
    };
    if(open) document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[open,onClose]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      {trigger}
      {open && (
        <div
          ref={dropRef}
          className="bg-[#1a1a2e] rounded-xl shadow-2xl border border-gray-600/40 py-1 overflow-y-auto"
          style={{ position:'fixed', top:coords.top, left:coords.left, width, zIndex:99999, maxHeight:360 }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Effects button that opens/toggles the effects panel
const EffectsBtn: React.FC = () => {
  const { activePanel, setActivePanel } = useEditorStore();
  const isActive = activePanel === 'effects';
  
  const handleClick = () => {
    if (isActive) {
      // Close panel when clicked while already open
      setActivePanel(null);
    } else {
      // Open panel
      setActivePanel('effects');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all shrink-0 ${isActive?'bg-gradient-to-r from-purple-600 to-pink-600 text-white':'bg-[#1e1e3a] text-purple-300 hover:bg-purple-600/20 border border-purple-500/30'}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
      Effects
    </button>
  );
};

/* ── Persistent right-side actions shown in EVERY toolbar state ───────────── */
const PersistentActions: React.FC<{canvas:any; saveToHistory:()=>void; hasObj:boolean}> = ({canvas, saveToHistory, hasObj}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [opacity,  setOpacity]  = useState(100);
  const [showPos,  setShowPos]  = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<any>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const opRef  = useRef<HTMLDivElement>(null);
  const [showOp, setShowOp] = useState(false);

  // Track active object and locked objects across canvas
  useEffect(()=>{
    if(!canvas) return;
    const sync=()=>{
      const o = canvas.getActiveObject() as any;
      if(o){ setIsLocked(!o.selectable); setOpacity(Math.round((o.opacity||1)*100)); }
      else { setIsLocked(false); }
    };
    canvas.on('selection:created',sync); canvas.on('selection:updated',sync);
    canvas.on('selection:cleared',sync); canvas.on('object:modified',sync);
    return ()=>{ canvas.off('selection:created',sync); canvas.off('selection:updated',sync); canvas.off('selection:cleared',sync); canvas.off('object:modified',sync); };
  },[canvas]);

  // Close dropdowns on outside click
  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      if(posRef.current&&!posRef.current.contains(e.target as Node)) setShowPos(false);
      if(opRef.current&&!opRef.current.contains(e.target as Node)) setShowOp(false);
    };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);

  const getObj = ()=> canvas?.getActiveObject() as any;

  // Lock/Unlock — when locked, element can't be selected so we find it in canvas objects
  const toggleLock = ()=>{
    const o = getObj();
    if(o){
      // currently selected → lock it
      const nv = !isLocked;
      o.set({selectable:!nv, evented:!nv, hoverCursor: nv?'not-allowed':'move'});
      if(nv) canvas?.discardActiveObject(); // deselect after locking
      canvas?.renderAll(); setIsLocked(nv);
    } else {
      // Nothing selected → find the most recently locked object and unlock it
      const locked = canvas?.getObjects().filter((x:any)=>!x.selectable);
      if(locked&&locked.length>0){
        const last = locked[locked.length-1];
        last.set({selectable:true, evented:true, hoverCursor:'move'});
        canvas?.renderAll(); setIsLocked(false);
        canvas?.setActiveObject(last); canvas?.requestRenderAll();
      }
    }
  };

  const changeOpacity=(v:number)=>{
    const o=getObj(); if(!o||!canvas) return;
    setOpacity(v); o.set('opacity',v/100); canvas.renderAll(); saveToHistory();
  };

  const duplicate=()=>{
    const o=getObj(); if(!o||!canvas) return;
    o.clone().then((c:any)=>{ c.set({left:(c.left||0)+20,top:(c.top||0)+20}); canvas.add(c); canvas.setActiveObject(c); canvas.renderAll(); saveToHistory(); });
  };

  const remove=()=>{
    const o=getObj(); if(!o||!canvas) return;
    canvas.remove(o); canvas.discardActiveObject(); canvas.renderAll(); saveToHistory();
  };

  const copyStyle=()=>{
    const o=getObj(); if(!o) return;
    setCopiedStyle({fill:o.fill,stroke:o.stroke,strokeWidth:o.strokeWidth,opacity:o.opacity,shadow:o.shadow,fontFamily:o.fontFamily,fontSize:o.fontSize,fontWeight:o.fontWeight});
  };

  const pasteStyle=()=>{
    const o=getObj(); if(!o||!canvas||!copiedStyle) return;
    Object.entries(copiedStyle).forEach(([k,v])=>{ if(v!==undefined) o.set(k,v as any); });
    canvas.renderAll(); saveToHistory();
  };

  const doPosition=(cmd:string)=>{
    const o=getObj(); if(!o||!canvas) return;
    const W=canvas.getWidth(), H=canvas.getHeight();
    const ow=o.getScaledWidth(), oh=o.getScaledHeight();
    switch(cmd){
      case 'fwd':  canvas.bringObjectForward(o); break;
      case 'back': canvas.sendObjectBackwards(o); break;
      case 'front':canvas.bringObjectToFront(o); break;
      case 'toback':canvas.sendObjectToBack(o); break;
      case 'al': o.set({left:0}); break;
      case 'ac': o.set({left:W/2-ow/2}); break;
      case 'ar': o.set({left:W-ow}); break;
      case 'at': o.set({top:0}); break;
      case 'am': o.set({top:H/2-oh/2}); break;
      case 'ab': o.set({top:H-oh}); break;
    }
    o.setCoords?.(); canvas.renderAll(); saveToHistory(); setShowPos(false);
  };

  // Compute fixed position for dropdowns (escapes overflow clipping)
  const [posCoords, setPosCoords] = useState({top:0,right:0});
  const [opCoords, setOpCoords] = useState({top:0,right:0});
  useEffect(()=>{
    if(showPos && posRef.current){ const r=posRef.current.getBoundingClientRect(); setPosCoords({top:r.bottom+4,right:window.innerWidth-r.right}); }
  },[showPos]);
  useEffect(()=>{
    if(showOp && opRef.current){ const r=opRef.current.getBoundingClientRect(); setOpCoords({top:r.bottom+4,right:window.innerWidth-r.right}); }
  },[showOp]);

  const ic = 'w-4 h-4';
  const btn = (active=false,danger=false)=>`p-1.5 rounded transition-all ${danger?'text-gray-400 hover:text-red-400 hover:bg-red-500/10':active?'text-white bg-[#2a2a5a]':'text-gray-400 hover:text-white hover:bg-[#1e1e3a]'}`;

  return (
    <div className="flex items-center gap-0.5 ml-auto shrink-0 border-l border-gray-700/40 pl-2">
      {/* Position / Layers dropdown */}
      <div className="relative" ref={posRef}>
        <button onClick={()=>setShowPos(p=>!p)} title="Position & Layers"
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${showPos?'bg-[#2a2a5a] text-white':'text-gray-400 hover:text-white hover:bg-[#1e1e3a]'}`}>
          <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <span className="hidden md:inline">Position</span>
        </button>
        {showPos&&(
          <div className="bg-[#1a1a2e] border border-gray-600/40 rounded-xl shadow-2xl overflow-hidden"
            style={{position:'fixed',top:posCoords.top,right:posCoords.right,width:260,zIndex:99999}}>
            <div className="px-3 pt-3 pb-2 border-b border-gray-700/30">
              <p className="text-white text-xs font-bold mb-2">Layering</p>
              <div className="grid grid-cols-2 gap-1">
                {[{c:'fwd',l:'∧ Forward'},{c:'back',l:'∨ Backward'},{c:'front',l:'⋀ To Front'},{c:'toback',l:'⋁ To back'}].map(b=>(
                  <button key={b.c} onClick={()=>doPosition(b.c)} disabled={!hasObj}
                    className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#2a2a5a] rounded transition-all disabled:opacity-30 text-left">{b.l}</button>
                ))}
              </div>
            </div>
            <div className="px-3 pt-2 pb-3">
              <p className="text-white text-xs font-bold mb-2">Align to Canvas</p>
              <div className="grid grid-cols-2 gap-1">
                {[{c:'al',l:'⊢ Align left'},{c:'at',l:'⊤ Align top'},{c:'ac',l:'⊣ Center H'},{c:'am',l:'⊥ Center V'},{c:'ar',l:'⊣ Align right'},{c:'ab',l:'⊤ Align bottom'}].map(b=>(
                  <button key={b.c} onClick={()=>doPosition(b.c)} disabled={!hasObj}
                    className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#2a2a5a] rounded transition-all disabled:opacity-30 text-left">{b.l}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opacity dropdown */}
      <div className="relative" ref={opRef}>
        <button onClick={()=>setShowOp(p=>!p)} title="Opacity"
          className={btn(showOp)}>
          <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
        </button>
        {showOp&&(
          <div className="bg-[#1a1a2e] border border-gray-600/40 rounded-xl shadow-2xl p-3"
            style={{position:'fixed',top:opCoords.top,right:opCoords.right,width:180,zIndex:99999}}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-xs font-medium">Opacity</span>
              <span className="text-gray-400 text-xs">{opacity}%</span>
            </div>
            <input type="range" min={0} max={100} value={opacity}
              onChange={e=>changeOpacity(parseInt(e.target.value))}
              disabled={!hasObj} className="w-full accent-purple-500 disabled:opacity-30"/>
          </div>
        )}
      </div>

      {/* Lock / Unlock */}
      <button onClick={toggleLock} title={isLocked?'Unlock element (click to unlock last locked)':'Lock element'}
        className={btn(isLocked)}>
        {isLocked
          ? <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          : <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
        }
      </button>

      {/* Duplicate */}
      <button onClick={duplicate} disabled={!hasObj} title="Duplicate"
        className={`${btn()} disabled:opacity-30`}>
        <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      </button>

      {/* Delete */}
      <button onClick={remove} disabled={!hasObj} title="Delete"
        className={`${btn(false,true)} disabled:opacity-30`}>
        <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>

      {/* Copy / Paste Style */}
      <button onClick={copiedStyle&&hasObj ? pasteStyle : copyStyle}
        disabled={!hasObj&&!copiedStyle}
        title={copiedStyle&&hasObj?'Paste Style':'Copy Style'}
        className={`${btn(!!copiedStyle)} disabled:opacity-30`}>
        <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {copiedStyle&&hasObj
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
          }
        </svg>
      </button>
    </div>
  );
};

/* ── Undo/Redo buttons — reusable in all toolbar states ──────────────────── */
const UndoRedoBtns: React.FC = () => {
  const { undo, redo, canUndo, canRedo } = useEditorStore();
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)"
        className={`p-1.5 rounded transition-all ${canUndo()?'text-gray-300 hover:text-white hover:bg-[#2a2a5a]':'text-gray-600 cursor-not-allowed'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
      </button>
      <button onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Shift+Z)"
        className={`p-1.5 rounded transition-all ${canRedo()?'text-gray-300 hover:text-white hover:bg-[#2a2a5a]':'text-gray-600 cursor-not-allowed'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"/></svg>
      </button>
    </div>
  );
};

/* ── Default toolbar when nothing is selected (page is implicitly selected) ── */
const DefaultToolbar: React.FC<{canvas:any; saveToHistory:()=>void}> = ({canvas, saveToHistory}) => {
  const { canvasSize } = useEditorStore();
  const [openBg, setOpenBg]   = useState(false);
  const [bgVal,  setBgVal]    = useState<string>('#ffffff');
  const bgRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Sync the swatch with the current canvas background
  useEffect(() => {
    if (!canvas) return;
    const fill = canvas.backgroundColor;
    if (typeof fill === 'string' && fill) setBgVal(fill);
  }, [canvas]);

  useEffect(() => {
    if (openBg && bgRef.current) {
      const r = bgRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left });
    }
  }, [openBg]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (bgRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpenBg(false);
    };
    if (openBg) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openBg]);

  const setSolid = (c: string) => {
    if (!canvas) return;
    setBgVal(c);
    canvas.backgroundColor = c;
    canvas.requestRenderAll();
    saveToHistory();
  };

  const setGradient = (stops: GradStop[], angleDeg: number) => {
    if (!canvas) return;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const rad = (angleDeg * Math.PI) / 180;
    const halfD = Math.sqrt(w * w + h * h) / 2;
    const grad = new Gradient({
      type: 'linear',
      coords: {
        x1: w / 2 - halfD * Math.cos(rad),
        y1: h / 2 - halfD * Math.sin(rad),
        x2: w / 2 + halfD * Math.cos(rad),
        y2: h / 2 + halfD * Math.sin(rad),
      },
      colorStops: stops.map(s => ({ offset: s.offset, color: s.color })),
    });
    canvas.backgroundColor = grad as any;
    setBgVal(stops[0]?.color || '#ffffff');
    canvas.requestRenderAll();
    saveToHistory();
  };

  return (
    <div className="h-11 bg-[#16162e] border-b border-gray-700/30 flex items-center px-2 shrink-0 overflow-x-auto">
      <UndoRedoBtns/>
      <div className="w-px h-5 bg-gray-700/40 shrink-0 mx-1"/>

      {/* Page background color picker */}
      <div className="relative shrink-0" ref={bgRef}>
        <button
          onClick={() => setOpenBg(v => !v)}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2a2a5a] transition-all"
          title="Page background color"
        >
          <div className="w-5 h-5 rounded border border-gray-500" style={{ backgroundColor: bgVal }} />
          <span className="text-gray-300 text-[11px]">Page BG</span>
          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {openBg && (
          <div
            ref={dropRef}
            className="bg-[#1a1a2e] rounded-xl shadow-2xl border border-gray-600/40 p-1"
            style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 99999 }}
          >
            <ColorPicker
              value={bgVal}
              onChange={c => setSolid(c)}
              onGradientChange={(stops, angleDeg) => setGradient(stops, angleDeg)}
              showGradient
            />
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-700/40 shrink-0 mx-1"/>
      <span className="text-gray-500 text-[11px] shrink-0">{canvasSize.width}×{canvasSize.height}px</span>
      <div className="w-px h-5 bg-gray-700/40 shrink-0 mx-2"/>
      <span className="text-gray-600 text-[11px]">Page selected — click an element to edit</span>
      <PersistentActions canvas={canvas} saveToHistory={saveToHistory} hasObj={false}/>
    </div>
  );
};

const EditorToolbar: React.FC = () => {
  const { canvas, saveToHistory } = useEditorStore();
  const [obj, setObj] = useState<any>(null);
  const [props, setProps] = useState<any>({});

  // dropdown open states
  const [openColor,   setOpenColor]   = useState(false);
  const [openFont,    setOpenFont]    = useState(false);
  const [openCase,    setOpenCase]    = useState(false);
  const [openSpacing, setOpenSpacing] = useState(false);
  const [openFlip,    setOpenFlip]    = useState(false);
  const [openAI,      setOpenAI]      = useState(false);
  const [openTblBorder, setOpenTblBorder] = useState(false);
  const [openTblEdit,   setOpenTblEdit]   = useState(false);

  const closeAll = () => { setOpenColor(false);setOpenFont(false);setOpenCase(false);setOpenSpacing(false);setOpenFlip(false);setOpenAI(false);setOpenTblBorder(false);setOpenTblEdit(false); };

  const refresh = useCallback(()=>{
    if (!canvas) return;
    const raw = canvas.getActiveObject() as any;
    if (!raw) { setObj(null); setProps({}); return; }

    // If an arc group is selected, resolve to the hidden owner textbox so
    // the toolbar operates on the real textbox, not the display group
    let o: any = raw;
    if (raw.__isArcGroup && raw.__arcOwnerId) {
      const owner = canvas.getObjects().find((x: any) =>
        (x.__uid || x.id) === raw.__arcOwnerId
      );
      if (owner) o = owner;
    }
    setObj(o);

    // Read typography from the real textbox
    // (for arc groups where obj is now the textbox, read directly)
    const glyphSrc = (o.__isArcGroup && o.getObjects) ? o.getObjects()[0] : o;
    setProps({
      type:       o.type,
      fill:       typeof o.fill === 'string' ? o.fill : '#000000',
      opacity:    Math.round((o.opacity || 1) * 100),
      fontSize:   (glyphSrc as any).fontSize    || 24,
      fontFamily: (glyphSrc as any).fontFamily  || 'Inter',
      fontWeight: (glyphSrc as any).fontWeight  || 'normal',
      fontStyle:  (glyphSrc as any).fontStyle   || 'normal',
      underline:  (glyphSrc as any).underline   || false,
      linethrough:(glyphSrc as any).linethrough || false,
      textAlign:  (glyphSrc as any).textAlign   || 'left',
      charSpacing:(glyphSrc as any).charSpacing || 0,
      lineHeight: (glyphSrc as any).lineHeight  || 1.2,
      flipX:      o.flipX || false,
      flipY:      o.flipY || false,
    });
  },[canvas]);

  useEffect(()=>{
    if(!canvas) return;
    canvas.on('selection:created', refresh);
    canvas.on('selection:updated', refresh);
    canvas.on('selection:cleared', refresh);
    canvas.on('object:modified',   refresh);
    return ()=>{ canvas.off('selection:created',refresh); canvas.off('selection:updated',refresh); canvas.off('selection:cleared',refresh); canvas.off('object:modified',refresh); };
  },[canvas,refresh]);

  const set = (key: string, val: any) => {
    if (!obj || !canvas) return;

    // Apply property to the textbox obj (refresh() already resolved arc-group → textbox)
    if (key === 'opacity') obj.set('opacity', val / 100);
    else if (key === 'strokeWidth') {
      obj.set('strokeWidth', val);
      obj.set('paintFirst', val > 0 ? 'stroke' : 'fill');
    }
    else obj.set(key, val);

    // If this textbox has an active arc (curve ON), mirror style changes to
    // the visible arc glyphs immediately. Do not remove/rebuild the group here,
    // because the Effects panel may be closed.
    if ((obj.__curvePower ?? 0) !== 0) {
      applyToArcGlyphs(canvas, obj, key, val);
    }

    canvas.renderAll();
    setProps((p: any) => ({ ...p, [key]: val }));
    saveToHistory();
  };

  // isText: obj is always the textbox now (refresh resolves arc-group → textbox)
  // Also catch the edge case where the arc group itself is still stored as obj
  const isText = ['textbox','text','i-text'].includes(obj?.type||'') ||
                 !!(obj?.__curvePower);  // textbox with active curve
  
  // isImage: check if selected object is an image
  const isImage = obj?.type === 'image';
  
  // isTable: check if selected object is a table group OR a cell inside a table
  const isTable = !!(obj?.__isTable) || !!(obj?.__tableId) || !!(obj?.__isTableCell) || !!(obj?.__isTableLabel);

  // Helper: get the table group from a cell or the table itself
  const getTableGroup = () => {
    if (!obj || !canvas) return null;
    if (obj.__isTable) return obj;
    if (obj.__tableId) {
      // Find the group that contains this cell
      return canvas.getObjects().find((o: any) => o.__isTable && o.__tableId === obj.__tableId) || null;
    }
    return null;
  };

  const tableInsertRow = (_above?: boolean) => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    const rows = table.__tableRows || 3;
    const cols = table.__tableCols || 3;
    const cH = table.__cellH || 40;
    const cW = table.__cellW || 120;
    
    // Create new row cells
    for (let c = 0; c < cols; c++) {
      const cell = new Rect({
        left: c * cW,
        top: rows * cH,
        width: cW,
        height: cH,
        fill: 'rgba(0,0,0,0)',
        stroke: table.__borderColor || '#374151',
        strokeWidth: table.__borderWidth || 1,
        originX: 'left',
        originY: 'top',
        selectable: true,
        evented: true,
      });
      (cell as any).__tableRow = rows;
      (cell as any).__tableCol = c;
      (cell as any).__isTableCell = true;
      (cell as any).__tableId = table.__tableId;
      
      const label = new Textbox('', {
        left: c * cW + 4,
        top: rows * cH + 8,
        width: cW - 8,
        height: cH - 16,
        fontSize: 13,
        fontFamily: 'Inter',
        fill: '#1e293b',
        textAlign: 'center',
        originX: 'left',
        originY: 'top',
        editable: true,
        selectable: true,
        evented: true,
      });
      (label as any).__tableRow = rows;
      (label as any).__tableCol = c;
      (label as any).__isTableLabel = true;
      (label as any).__tableId = table.__tableId;
      (label as any).__parentCell = cell;
      
      // Add to table group
      table.addWithUpdate(cell);
      table.addWithUpdate(label);
    }
    
    table.__tableRows = rows + 1;
    table.set('height', (rows + 1) * cH);
    canvas.renderAll();
    saveToHistory();
  };

  const tableInsertCol = (_left?: boolean) => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    const rows = table.__tableRows || 3;
    const cols = table.__tableCols || 3;
    const cH = table.__cellH || 40;
    const cW = table.__cellW || 120;
    
    // Create new column cells
    for (let r = 0; r < rows; r++) {
      const cell = new Rect({
        left: cols * cW,
        top: r * cH,
        width: cW,
        height: cH,
        fill: r === 0 ? '#7c3aed' : 'rgba(0,0,0,0)',
        stroke: table.__borderColor || '#374151',
        strokeWidth: table.__borderWidth || 1,
        originX: 'left',
        originY: 'top',
        selectable: true,
        evented: true,
      });
      (cell as any).__tableRow = r;
      (cell as any).__tableCol = cols;
      (cell as any).__isTableCell = true;
      (cell as any).__tableId = table.__tableId;
      
      const label = new Textbox(r === 0 ? '' : '', {
        left: cols * cW + 4,
        top: r * cH + 8,
        width: cW - 8,
        height: cH - 16,
        fontSize: 13,
        fontFamily: 'Inter',
        fontWeight: r === 0 ? 'bold' : 'normal',
        fill: r === 0 ? '#ffffff' : '#1e293b',
        textAlign: 'center',
        originX: 'left',
        originY: 'top',
        editable: true,
        selectable: true,
        evented: true,
      });
      (label as any).__tableRow = r;
      (label as any).__tableCol = cols;
      (label as any).__isTableLabel = true;
      (label as any).__tableId = table.__tableId;
      (label as any).__parentCell = cell;
      
      table.addWithUpdate(cell);
      table.addWithUpdate(label);
    }
    
    table.__tableCols = cols + 1;
    table.set('width', (cols + 1) * cW);
    canvas.renderAll();
    saveToHistory();
  };

  const tableDeleteRow = () => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    const rows = table.__tableRows || 3;
    if (rows <= 1) return;
    
    const cellsToRemove: any[] = [];
    table.getObjects().forEach((o: any) => {
      if (o.__tableRow === rows - 1 && o.__tableId === table.__tableId) {
        cellsToRemove.push(o);
      }
    });
    
    cellsToRemove.forEach(o => table.removeWithUpdate(o));
    table.__tableRows = rows - 1;
    table.set('height', (rows - 1) * (table.__cellH || 40));
    canvas.renderAll();
    saveToHistory();
  };

  const tableDeleteCol = () => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    const cols = table.__tableCols || 3;
    if (cols <= 1) return;
    
    const cellsToRemove: any[] = [];
    table.getObjects().forEach((o: any) => {
      if (o.__tableCol === cols - 1 && o.__tableId === table.__tableId) {
        cellsToRemove.push(o);
      }
    });
    
    cellsToRemove.forEach(o => table.removeWithUpdate(o));
    table.__tableCols = cols - 1;
    table.set('width', (cols - 1) * (table.__cellW || 120));
    canvas.renderAll();
    saveToHistory();
  };

  const tableSetBorderColor = (color: string) => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    table.__borderColor = color;
    // Update all cell strokes
    table.getObjects().forEach((o: any) => {
      if (o.__isTableCell) o.set('stroke', color);
    });
    canvas.renderAll();
    saveToHistory();
  };

  const tableSetBorderWidth = (width: number) => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    table.__borderWidth = width;
    // Update all cell strokes
    table.getObjects().forEach((o: any) => {
      if (o.__isTableCell) o.set('strokeWidth', width);
    });
    canvas.renderAll();
    saveToHistory();
  };

  const tableDistributeRows = () => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    // Recalculate positions
    const cH = table.__cellH || 40;
    const cW = table.__cellW || 120;
    
    table.getObjects().forEach((o: any) => {
      if (o.__isTableCell) {
        o.set('left', (o.__tableCol || 0) * cW);
        o.set('top', (o.__tableRow || 0) * cH);
      } else if (o.__isTableLabel) {
        o.set('left', (o.__tableCol || 0) * cW + 4);
        o.set('top', (o.__tableRow || 0) * cH + 8);
      }
    });
    
    table.addWithUpdate();
    canvas.renderAll();
    saveToHistory();
  };

  const tableDistributeCols = () => {
    const table = getTableGroup();
    if (!table || !canvas) return;
    tableDistributeRows(); // Same logic
  };

  // Image-specific actions
  const fitImageToPage = () => {
    if (!obj || !canvas || !isImage) return;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const imgWidth = obj.width || 100;
    const imgHeight = obj.height || 100;
    const scaleX = canvasWidth / imgWidth;
    const scaleY = canvasHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of page with padding
    
    obj.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
    });
    canvas.renderAll();
    saveToHistory();
  };

  const cropImage = () => {
    if (!obj || !canvas || !isImage) return;
    // Simple crop: reduce image to 80% of its current size centered
    const currentScaleX = obj.scaleX || 1;
    const currentScaleY = obj.scaleY || 1;
    obj.set({
      scaleX: currentScaleX * 0.8,
      scaleY: currentScaleY * 0.8,
    });
    canvas.renderAll();
    saveToHistory();
  };

  const removeImageBackground = () => {
    if (!obj || !canvas || !isImage) return;
    // Toggle between full opacity and partial opacity to simulate background removal
    // In a real implementation, this would use AI to remove background
    const currentOpacity = obj.opacity || 1;
    if (currentOpacity >= 0.9) {
      obj.set('opacity', 0.85);
    } else {
      obj.set('opacity', 1);
    }
    canvas.renderAll();
    saveToHistory();
  };

  const maskImage = () => {
    if (!obj || !canvas || !isImage) return;
    // Add a simple circular mask effect
    const clipPath = new FabricCircle({
      radius: (obj.width || 100) / 2,
      originX: 'center',
      originY: 'center',
    });
    obj.set('clipPath', clipPath);
    canvas.renderAll();
    saveToHistory();
  };

  const applyCase = (fn:(s:string)=>string)=>{
    if(!obj||!canvas)return;
    // obj is always the textbox (refresh resolved arc-group → textbox)
    const next = fn(obj.text||'');
    obj.set('text', next);
    if ((obj.__curvePower ?? 0) !== 0) {
      const group = findArcGroup(canvas, obj);
      const chars = next.replace(/\n/g, '').split('');
      const glyphs = group?.getObjects?.().filter((child: any) => ['i-text', 'text', 'textbox'].includes(child.type || '')) || [];
      glyphs.forEach((child: any, i: number) => child.set('text', chars[i] || ''));
    }
    canvas.renderAll(); saveToHistory();
  };

  /* No selection — show default toolbar */
  if (!obj) return (
    <DefaultToolbar canvas={canvas} saveToHistory={saveToHistory}/>
  );

  return (
    <div className="h-auto min-h-11 bg-[#16162e] border-b border-gray-700/30 flex flex-wrap items-center px-2 py-1 gap-1 shrink-0 overflow-x-auto">

      {/* Undo / Redo */}
      <UndoRedoBtns/>
      <Sep/>

      {/* Fill Color */}
      <Drop
        open={openColor} onClose={()=>setOpenColor(false)}
        width={230}
        trigger={
          <button onClick={()=>{closeAll();setOpenColor(p=>!p);}}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2a2a5a] transition-all shrink-0">
            <div className="w-5 h-5 rounded border border-gray-500" style={{backgroundColor:props.fill||'#000'}}/>
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
          </button>
        }>
        <div className="p-1">
          <ColorPicker
            value={typeof props.fill==='string'?props.fill:'#000000'}
            onChange={c=>{
              if(!obj||!canvas) return;
              const applyRecursive = (target: any) => {
                if (target.getObjects) target.getObjects().forEach(applyRecursive);
                else if (target.set) {
                  // For SVG stroke-based icons (stroke-width > 0, fill === 'none'), apply to stroke
                  if (target.strokeWidth && target.strokeWidth > 0 && (!target.fill || target.fill === 'none')) {
                    target.set('stroke', c);
                  } else {
                    target.set('fill', c);
                  }
                }
              };
              // For stroke-based icons, set stroke on root too
              if (obj.strokeWidth && obj.strokeWidth > 0 && (!obj.fill || obj.fill === 'none')) {
                obj.set('stroke', c);
              } else {
                obj.set('fill', c);
              }
              if ((obj.__curvePower ?? 0) !== 0) {
                const arcGroup = findArcGroup(canvas, obj);
                if (arcGroup) applyRecursive(arcGroup);
              } else {
                applyRecursive(obj);
              }
              canvas.renderAll();
              setProps((p:any)=>({...p,fill:c}));
              saveToHistory();
            }}
            onGradientChange={(stops, angleDeg)=>{
              if(!obj||!canvas) return;
              applyGradientFill(obj, canvas, stops, angleDeg);
              setProps((p:any)=>({...p,fill:'[gradient]'}));
              saveToHistory();
            }}
            showGradient
          />
        </div>
      </Drop>

      {/* Font Family (text only) */}
      {isText && (
        <Drop open={openFont} onClose={()=>setOpenFont(false)} width={200}
          trigger={
            <button onClick={()=>{closeAll();setOpenFont(p=>!p);}}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#2a2a5a] transition-all min-w-[110px] shrink-0">
              <span className="text-gray-200 text-[11px] truncate" style={{fontFamily:props.fontFamily}}>{props.fontFamily}</span>
              <svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
            </button>
          }>
          {FONTS.map(f=>(
            <button key={f} onClick={()=>{set('fontFamily',f);setOpenFont(false);}}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a5a] transition-all ${props.fontFamily===f?'text-purple-400 bg-purple-500/10':'text-gray-300'}`}
              style={{fontFamily:f}}>{f}</button>
          ))}
        </Drop>
      )}

      {/* Font size (pt) */}
      {isText && (
        <div className="flex items-center gap-0.5 shrink-0">
          <input type="number" value={pxToPt(props.fontSize||24)}
            onChange={e=>set('fontSize',ptToPx(parseInt(e.target.value)||18))}
            className="w-12 px-1 py-1 bg-[#1e1e3a] border border-gray-600/30 rounded text-white text-[11px] text-center" min={6} max={450}/>
          <div className="flex flex-col">
            <button onClick={()=>set('fontSize',(props.fontSize||24)+ptToPx(1))} className="text-gray-500 hover:text-white text-[8px] leading-none px-0.5">▲</button>
            <button onClick={()=>set('fontSize',Math.max(ptToPx(6),(props.fontSize||24)-ptToPx(1)))} className="text-gray-500 hover:text-white text-[8px] leading-none px-0.5">▼</button>
          </div>
          <span className="text-gray-600 text-[9px]">pt</span>
        </div>
      )}

      <Sep/>

      {/* Text align toggle (text only) */}
      {isText && (
        <button
          onClick={()=>{const aligns=['left','center','right','justify'];const i=aligns.indexOf(props.textAlign||'left');set('textAlign',aligns[(i+1)%aligns.length]);}}
          title="Text Align (click to cycle)"
          className="p-1 rounded text-gray-400 hover:bg-[#2a2a5a] transition-all shrink-0">
          {props.textAlign==='left'   && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14"/></svg>}
          {props.textAlign==='center' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14"/></svg>}
          {props.textAlign==='right'  && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14"/></svg>}
          {props.textAlign==='justify'&& <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>}
        </button>
      )}

      {/* Bold */}
      {isText && <button onClick={()=>set('fontWeight',props.fontWeight==='bold'?'normal':'bold')}
        className={`px-1.5 py-1 rounded text-sm font-bold transition-all shrink-0 ${props.fontWeight==='bold'?'bg-purple-600 text-white':'text-gray-400 hover:bg-[#2a2a5a]'}`}>B</button>}
      {/* Italic */}
      {isText && <button onClick={()=>set('fontStyle',props.fontStyle==='italic'?'normal':'italic')}
        className={`px-1.5 py-1 rounded text-sm italic transition-all shrink-0 ${props.fontStyle==='italic'?'bg-purple-600 text-white':'text-gray-400 hover:bg-[#2a2a5a]'}`}>I</button>}
      {/* Underline */}
      {isText && <button onClick={()=>set('underline',!props.underline)}
        className={`px-1.5 py-1 rounded text-sm underline transition-all shrink-0 ${props.underline?'bg-purple-600 text-white':'text-gray-400 hover:bg-[#2a2a5a]'}`}>U</button>}
      {/* Strikethrough */}
      {isText && <button onClick={()=>set('linethrough',!props.linethrough)}
        className={`px-1.5 py-1 rounded text-sm line-through transition-all shrink-0 ${props.linethrough?'bg-purple-600 text-white':'text-gray-400 hover:bg-[#2a2a5a]'}`}>S</button>}

      {/* Text Case dropdown */}
      {isText && (
        <Drop open={openCase} onClose={()=>setOpenCase(false)} width={200}
          trigger={
            <button onClick={()=>{closeAll();setOpenCase(p=>!p);}}
              title="Text Case"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all shrink-0 ${openCase?'bg-purple-600 text-white':'text-gray-400 hover:bg-[#2a2a5a]'}`}
              style={{fontFamily:'monospace'}}>
              Aa
            </button>
          }>
          <div className="py-1">
            <p className="text-gray-500 text-[9px] font-semibold uppercase tracking-wider px-3 pb-1">Text Case</p>
            {TEXT_CASES.map((tc,i)=>(
              <button key={i} onClick={()=>{applyCase(tc.fn);setOpenCase(false);}}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                {tc.label}
              </button>
            ))}
          </div>
        </Drop>
      )}

      {/* Spacing + Line Height dropdown */}
      {isText && (
        <Drop open={openSpacing} onClose={()=>setOpenSpacing(false)} width={220}
          trigger={
            <button onClick={()=>{closeAll();setOpenSpacing(p=>!p);}}
              title="Spacing & Line Height"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all shrink-0 ${openSpacing?'bg-purple-600 text-white':'text-gray-400 hover:bg-[#2a2a5a]'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              <span>¶</span>
            </button>
          }>
          <div className="px-4 py-3 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-300 text-xs font-medium">Letter Spacing</span>
                <span className="text-gray-400 text-[10px]">{props.charSpacing||0}</span>
              </div>
              <input type="range" min={-200} max={800} value={props.charSpacing||0}
                onChange={e=>set('charSpacing',parseInt(e.target.value))} className="w-full accent-purple-500"/>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-300 text-xs font-medium">Line Height</span>
                <span className="text-gray-400 text-[10px]">{((props.lineHeight||1.2)*100).toFixed(0)}%</span>
              </div>
              <input type="range" min={50} max={300} value={Math.round((props.lineHeight||1.2)*100)}
                onChange={e=>set('lineHeight',parseInt(e.target.value)/100)} className="w-full accent-purple-500"/>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-300 text-xs font-medium">Opacity</span>
                <span className="text-gray-400 text-[10px]">{props.opacity||100}%</span>
              </div>
              <input type="range" min={0} max={100} value={props.opacity||100}
                onChange={e=>set('opacity',parseInt(e.target.value))} className="w-full accent-purple-500"/>
            </div>
          </div>
        </Drop>
      )}

      {!isTable && (
        <>
          {/* Flip dropdown — after spacing */}
          <Drop open={openFlip} onClose={()=>setOpenFlip(false)} width={160}
            trigger={
              <button onClick={()=>{closeAll();setOpenFlip(p=>!p);}}
                title="Flip"
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all shrink-0 ${openFlip?'bg-purple-600 text-white':'text-gray-400 hover:bg-[#2a2a5a]'}`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>
                </svg>
                Flip
                <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
              </button>
            }>
            <div className="py-1">
              <p className="text-gray-500 text-[9px] font-semibold uppercase tracking-wider px-3 pt-1 pb-1">Flip</p>
              <button onClick={()=>{set('flipX',!props.flipX);setOpenFlip(false);}}
                className={`w-full text-left px-3 py-2 text-xs transition-all flex items-center gap-2 ${props.flipX?'text-purple-300 bg-purple-500/10':'text-gray-300 hover:bg-[#2a2a5a] hover:text-white'}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M4 7l4 5-4 5M20 7l-4 5 4 5"/>
                </svg>
                Flip Horizontal {props.flipX && '✓'}
              </button>
              <button onClick={()=>{set('flipY',!props.flipY);setOpenFlip(false);}}
                className={`w-full text-left px-3 py-2 text-xs transition-all flex items-center gap-2 ${props.flipY?'text-purple-300 bg-purple-500/10':'text-gray-300 hover:bg-[#2a2a5a] hover:text-white'}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M7 4l5 4 5-4M7 20l5-4 5 4"/>
                </svg>
                Flip Vertical {props.flipY && '✓'}
              </button>
            </div>
          </Drop>
          <Sep/>
        </>
      )}

      {/* Image-specific actions */}
      {isImage && (
        <>
          {/* Crop */}
          <button onClick={cropImage} title="Crop image"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-300 hover:text-white hover:bg-[#2a2a5a] transition-all shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.13 1L6 16a2 2 0 002 2h15"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 6.13L16 6a2 2 0 012 2v15"/>
            </svg>
            Crop
          </button>

          {/* Fit to Page */}
          <button onClick={fitImageToPage} title="Fit image to page"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-300 hover:text-white hover:bg-[#2a2a5a] transition-all shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Fit
          </button>

          {/* Remove Background */}
          <button onClick={removeImageBackground} title="Remove background"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-300 hover:text-white hover:bg-[#2a2a5a] transition-all shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8"/>
            </svg>
            Remove BG
          </button>

          {/* Mask */}
          <button onClick={maskImage} title="Apply circular mask"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-300 hover:text-white hover:bg-[#2a2a5a] transition-all shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
            Mask
          </button>

          <Sep/>
        </>
      )}

      {/* Table-specific toolbar: Simplified icons + detailed dropdowns */}
      {isTable && (
        <>
          {/* 1st Dropdown: Table Border Settings (≡ icon) */}
          <Drop open={openTblBorder} onClose={()=>setOpenTblBorder(false)} width={260}
            trigger={
              <button onClick={()=>{closeAll();setOpenTblBorder(p=>!p);}}
                className={`p-1.5 rounded transition-all shrink-0 ${openTblBorder?'bg-[#2a2a5a] text-white':'text-gray-300 hover:text-white hover:bg-[#1e1e3a]'}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
              </button>
            }>
            <div className="p-3 bg-[#222238] rounded-xl shadow-2xl">
              <div className="grid grid-cols-6 gap-1 mb-3">
                {[
                  {id:'all', icon:<rect x="4" y="4" width="12" height="12"/>, title:'All Borders'},
                  {id:'top', icon:<line x1="4" y1="4" x2="16" y2="4"/>, title:'Top Border'},
                  {id:'bottom', icon:<line x1="4" y1="16" x2="16" y2="16"/>, title:'Bottom Border'},
                  {id:'left', icon:<line x1="4" y1="4" x2="4" y2="16"/>, title:'Left Border'},
                  {id:'right', icon:<line x1="16" y1="4" x2="16" y2="16"/>, title:'Right Border'},
                  {id:'none', icon:<><rect x="4" y="4" width="12" height="12" opacity="0.2"/><line x1="4" y1="4" x2="16" y2="16"/></>, title:'No Borders'},
                ].map(b=>(
                  <button key={b.id} title={b.title}
                    className="aspect-square flex items-center justify-center rounded border border-gray-700 hover:border-gray-500 hover:bg-[#2a2a5a] transition-all">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">{b.icon}</svg>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1 mb-4">
                {[
                  {id:'none', icon:<circle cx="10" cy="10" r="7" strokeDasharray="2 2"/>, title:'None'},
                  {id:'solid', icon:<line x1="4" y1="10" x2="16" y2="10"/>, title:'Solid'},
                  {id:'dashed', icon:<line x1="4" y1="10" x2="16" y2="10" strokeDasharray="4 2"/>, title:'Dashed'},
                  {id:'dotted', icon:<line x1="4" y1="10" x2="16" y2="10" strokeDasharray="1 2"/>, title:'Dotted'},
                ].map(s=>(
                  <button key={s.id} title={s.title}
                    onClick={()=>{
                      if(!obj||!canvas) return;
                      const dash = s.id==='dashed'?[6,3]:s.id==='dotted'?[2,3]:[];
                      const walk=(o:any)=>{if(o.getObjects)o.getObjects().forEach(walk); if(o.__isTableCell) { o.set('strokeWidth', s.id==='none'?0:1); o.set('strokeDashArray',dash); }};
                      walk(obj); canvas.renderAll(); saveToHistory();
                    }}
                    className="aspect-[1.5/1] flex items-center justify-center rounded border border-gray-700 hover:border-gray-500 hover:bg-[#2a2a5a] transition-all">
                    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">{s.icon}</svg>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-gray-300 text-xs">Border color</span>
                <div className="relative group">
                  <input
                    type="color"
                    defaultValue="#374151"
                    onChange={e => tableSetBorderColor(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-600 cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-1 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs">Border width</span>
                  <span className="text-white text-xs bg-[#12122a] px-2 py-0.5 rounded border border-gray-700">1</span>
                </div>
                <input type="range" min="0" max="20" step="1" defaultValue="1" 
                  onChange={e => tableSetBorderWidth(parseInt(e.target.value) || 1)}
                  className="w-full accent-purple-500 h-1 mt-2" />
              </div>
            </div>
          </Drop>

          {/* 2nd Dropdown: Table Structure (Grid icon ▦) */}
          <Drop open={openTblEdit} onClose={()=>setOpenTblEdit(false)} width={200}
            trigger={
              <button onClick={()=>{closeAll();setOpenTblEdit(p=>!p);}}
                className={`p-1.5 rounded transition-all shrink-0 ${openTblEdit?'bg-[#2a2a5a] text-white':'text-gray-300 hover:text-white hover:bg-[#1e1e3a]'}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="1"/>
                  <path d="M3 12h18M12 3v18"/>
                </svg>
              </button>
            }>
            <div className="py-1 bg-[#222238] rounded-xl shadow-2xl">
              {/* Rows Section */}
              <div className="px-4 py-1.5">
                <span className="text-white text-xs font-bold">Rows</span>
              </div>
              <button onClick={()=>{tableInsertRow(true); setOpenTblEdit(false);}}
                className="w-full text-left px-4 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                Insert row above
              </button>
              <button onClick={()=>{tableInsertRow(false); setOpenTblEdit(false);}}
                className="w-full text-left px-4 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                Insert row below
              </button>
              <button onClick={()=>{tableDeleteRow(); setOpenTblEdit(false);}}
                className="w-full text-left px-4 py-1.5 text-xs text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                Delete row
              </button>

              {/* Columns Section */}
              <div className="border-t border-gray-700/30 mt-1 px-4 py-1.5">
                <span className="text-white text-xs font-bold">Columns</span>
              </div>
              <button onClick={()=>{tableInsertCol(true); setOpenTblEdit(false);}}
                className="w-full text-left px-4 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                Insert column left
              </button>
              <button onClick={()=>{tableInsertCol(false); setOpenTblEdit(false);}}
                className="w-full text-left px-4 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                Insert column right
              </button>
              <button onClick={()=>{tableDeleteCol(); setOpenTblEdit(false);}}
                className="w-full text-left px-4 py-1.5 text-xs text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                Delete column
              </button>

              {/* Distribute Section */}
              <div className="border-t border-gray-700/30 mt-1">
                <button onClick={()=>{tableDistributeRows(); setOpenTblEdit(false);}}
                  className="w-full text-left px-4 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                  Distribute rows evenly
                </button>
                <button onClick={()=>{tableDistributeCols(); setOpenTblEdit(false);}}
                  className="w-full text-left px-4 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                  Distribute columns evenly
                </button>
              </div>
            </div>
          </Drop>

          <Sep/>
        </>
      )}

      {/* Effects button */}
      {!isTable && <EffectsBtn/>}

      {/* AI Write dropdown */}
      {isText && (
        <Drop open={openAI} onClose={()=>setOpenAI(false)} width={210} align="right"
          trigger={
            <button onClick={()=>{closeAll();setOpenAI(p=>!p);}}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all shrink-0 ${openAI?'bg-gradient-to-r from-purple-600 to-pink-600 text-white':'bg-[#1e1e3a] text-pink-400 hover:bg-pink-600/20 border border-pink-500/30'}`}>
              ✦ AI write
            </button>
          }>
          <div>
            <p className="text-gray-500 text-[9px] font-semibold uppercase tracking-wider px-3 pt-2 pb-1">Transform Text</p>
            {AI_PROMPTS.map((p,i)=>(
              <button key={i} onClick={()=>{if(obj){obj.set('text',transformText(obj.text||'',p.ins));canvas?.renderAll();saveToHistory();}setOpenAI(false);}}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-[#2a2a5a] hover:text-white transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </Drop>
      )}

      {/* Always-visible right-side actions */}
      <PersistentActions canvas={canvas} saveToHistory={saveToHistory} hasObj={!!obj}/>
    </div>
  );
};

export default EditorToolbar;
