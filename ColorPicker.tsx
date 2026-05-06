import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ── colour math ──────────────────────────────────────────────────────────── */
function hexToRgb(hex: string) {
  const h = (hex.replace('#','')+'000000').slice(0,6);
  const n = parseInt(h,16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function rgbToHex(r:number,g:number,b:number){
  return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function hsvToRgb(h:number,s:number,v:number){
  const i=Math.floor(h/60)%6, f=h/60-Math.floor(h/60);
  const p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
  const m=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i];
  return { r:Math.round(m[0]*255), g:Math.round(m[1]*255), b:Math.round(m[2]*255) };
}
function rgbToHsv(r:number,g:number,b:number){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;
  if(d){ if(max===r)h=((g-b)/d+6)%6; else if(max===g)h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; }
  return { h, s:max?d/max:0, v:max };
}

export interface GradStop { offset:number; color:string; }

interface Props {
  value: string;
  onChange: (color:string)=>void;
  onGradientChange?: (stops:GradStop[], angle:number)=>void;
  showGradient?: boolean;
  className?: string;
}

const SWATCHES = [
  '#00BCD4','#4CAF50','#FFEB3B','#FF5722','#9C27B0','#3F51B5',
  '#F44336','#E91E63','#FF9800','#8BC34A','#009688','#607D8B',
  '#795548','#9E9E9E','#000000','#ffffff','#1e293b','#ef4444',
];

const ColorPicker: React.FC<Props> = ({value, onChange, onGradientChange, showGradient=false, className=''}) => {
  const [mode,      setMode]      = useState<'solid'|'linear'>('solid');
  const [hsv,       setHsv]       = useState(()=>{ const rgb=hexToRgb(value||'#3b82f6'); return rgbToHsv(rgb.r,rgb.g,rgb.b); });
  const [alpha,     setAlpha]     = useState(100);
  const [hexInput,  setHexInput]  = useState((value||'000000').replace('#','').slice(0,6));
  const [angle,     setAngle]     = useState(90);
  const [stops,     setStops]     = useState<GradStop[]>([
    {offset:0,   color:'#7c3aed'},
    {offset:1,   color:'#ec4899'},
  ]);
  const [activeStop, setActiveStop] = useState(0);
  const [draggingStop, setDraggingStop] = useState<number|null>(null);

  const specRef  = useRef<HTMLDivElement>(null);
  const hueRef   = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  const gradBarRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'spec'|'hue'|'alpha'|null>(null);

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const previewHex = rgbToHex(rgb.r, rgb.g, rgb.b);

  /* emit colour change */
  const emitSolid = useCallback((h:number,s:number,v:number,a:number)=>{
    const c=hsvToRgb(h,s,v); const hex=rgbToHex(c.r,c.g,c.b);
    setHexInput(hex.replace('#',''));
    setAlpha(a);
    onChange(hex);
  },[onChange]);

  const emitStop = useCallback((h:number,s:number,v:number,idx:number,curStops:GradStop[])=>{
    const c=hsvToRgb(h,s,v); const hex=rgbToHex(c.r,c.g,c.b);
    setHexInput(hex.replace('#',''));
    const ns=curStops.map((st,i)=>i===idx?{...st,color:hex}:st);
    setStops(ns);
    onGradientChange?.(ns,angle);
  },[onGradientChange,angle]);

  const emitColor = useCallback((h:number,s:number,v:number,a:number)=>{
    if(mode==='solid') emitSolid(h,s,v,a);
    else emitStop(h,s,v,activeStop,stops);
  },[mode,activeStop,stops,emitSolid,emitStop]);

  /* sync from outside */
  useEffect(()=>{
    if(!value||!value.startsWith('#')) return;
    const r=hexToRgb(value); const h=rgbToHsv(r.r,r.g,r.b);
    setHsv(h); setHexInput(value.replace('#',''));
  },[value]);

  /* pointer helpers */
  const rel=(el:HTMLElement,e:MouseEvent|React.MouseEvent)=>{
    const r=el.getBoundingClientRect();
    return { x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)), y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)) };
  };

  const specDown=(e:React.MouseEvent)=>{ dragging.current='spec'; const p=rel(specRef.current!,e); const nh={...hsv,s:p.x,v:1-p.y}; setHsv(nh); emitColor(nh.h,nh.s,nh.v,alpha); };
  const hueDown=(e:React.MouseEvent)=>{ dragging.current='hue';  const p=rel(hueRef.current!,e);  const nh={...hsv,h:p.x*360}; setHsv(nh); emitColor(nh.h,nh.s,nh.v,alpha); };
  const alphaDown=(e:React.MouseEvent)=>{ dragging.current='alpha'; const p=rel(alphaRef.current!,e); const a=Math.round(p.x*100); setAlpha(a); emitColor(hsv.h,hsv.s,hsv.v,a); };

  useEffect(()=>{
    const mv=(e:MouseEvent)=>{
      if(!dragging.current) return;
      if(dragging.current==='spec'&&specRef.current){const p=rel(specRef.current,e);const nh={...hsv,s:p.x,v:1-p.y};setHsv(nh);emitColor(nh.h,nh.s,nh.v,alpha);}
      if(dragging.current==='hue'&&hueRef.current){const p=rel(hueRef.current,e);const nh={...hsv,h:p.x*360};setHsv(nh);emitColor(nh.h,nh.s,nh.v,alpha);}
      if(dragging.current==='alpha'&&alphaRef.current){const p=rel(alphaRef.current,e);const a=Math.round(p.x*100);setAlpha(a);emitColor(hsv.h,hsv.s,hsv.v,a);}
    };
    const up=()=>{ dragging.current=null; };
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
    return ()=>{ window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); };
  },[hsv,alpha,emitColor]);

  /* gradient stop dragging */
  useEffect(()=>{
    if(draggingStop===null) return;
    const mv=(e:MouseEvent)=>{
      if(!gradBarRef.current) return;
      const r=gradBarRef.current.getBoundingClientRect();
      const offset=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
      setStops(prev=>{
        const ns=prev.map((st,i)=>i===draggingStop?{...st,offset}:st).sort((a,b)=>a.offset-b.offset);
        // keep activeStop index in sync after sort
        const newIdx=ns.findIndex(s=>s===prev[draggingStop]||(s.offset===offset&&s.color===prev[draggingStop].color));
        if(newIdx!==-1) setActiveStop(newIdx);
        onGradientChange?.(ns,angle);
        return ns;
      });
    };
    const up=()=>setDraggingStop(null);
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
    return ()=>{ window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); };
  },[draggingStop,angle,onGradientChange]);

  /* click gradient bar to add stop */
  const gradBarClick=(e:React.MouseEvent)=>{
    if(!gradBarRef.current) return;
    const r=gradBarRef.current.getBoundingClientRect();
    const offset=(e.clientX-r.left)/r.width;
    // interpolate colour at that position
    const sorted=[...stops].sort((a,b)=>a.offset-b.offset);
    let color=sorted[0]?.color||'#ffffff';
    for(let i=0;i<sorted.length-1;i++){
      if(offset>=sorted[i].offset&&offset<=sorted[i+1].offset){
        const t=(offset-sorted[i].offset)/(sorted[i+1].offset-sorted[i].offset);
        const c1=hexToRgb(sorted[i].color); const c2=hexToRgb(sorted[i+1].color);
        color=rgbToHex(Math.round(c1.r+(c2.r-c1.r)*t),Math.round(c1.g+(c2.g-c1.g)*t),Math.round(c1.b+(c2.b-c1.b)*t));
        break;
      }
    }
    const newStop:GradStop={offset:Math.max(0,Math.min(1,offset)),color};
    const ns=[...stops,newStop].sort((a,b)=>a.offset-b.offset);
    const idx=ns.indexOf(newStop);
    setStops(ns); setActiveStop(idx);
    const r2=hexToRgb(color); setHsv(rgbToHsv(r2.r,r2.g,r2.b)); setHexInput(color.replace('#',''));
    onGradientChange?.(ns,angle);
  };

  /* delete stop */
  const deleteStop=(i:number)=>{
    if(stops.length<=2) return;
    const ns=stops.filter((_,idx)=>idx!==i);
    setStops(ns); setActiveStop(Math.min(i,ns.length-1));
    onGradientChange?.(ns,angle);
  };

  const pickSwatch=(hex:string)=>{
    const r=hexToRgb(hex); const nh=rgbToHsv(r.r,r.g,r.b);
    setHsv(nh); setHexInput(hex.replace('#','')); emitColor(nh.h,nh.s,nh.v,alpha);
  };

  const gradCss=stops.map(s=>`${s.color} ${s.offset*100}%`).join(', ');
  const deg=angle;

  return (
    <div className={`w-56 bg-[#2a2a3a] rounded-xl shadow-2xl border border-gray-700/60 overflow-hidden select-none ${className}`}>

      {/* Tabs */}
      {showGradient&&(
        <div className="flex border-b border-gray-700/50">
          <button onClick={()=>setMode('solid')} className={`flex-1 py-2 text-xs font-semibold transition-all ${mode==='solid'?'text-[#64b5f6] border-b-2 border-[#64b5f6]':'text-gray-400 hover:text-gray-200'}`}>Solid</button>
          <button onClick={()=>setMode('linear')} className={`flex-1 py-2 text-xs font-semibold transition-all ${mode==='linear'?'text-[#64b5f6] border-b-2 border-[#64b5f6]':'text-gray-400 hover:text-gray-200'}`}>Linear</button>
        </div>
      )}

      {/* Gradient controls */}
      {mode==='linear'&&(
        <div className="px-3 pt-3 space-y-2">
          {/* Gradient bar with draggable stops */}
          <div className="relative" style={{paddingBottom:16}}>
            {/* Bar */}
            <div ref={gradBarRef}
              onClick={gradBarClick}
              className="h-5 rounded-md cursor-crosshair border border-gray-600/40 relative overflow-visible"
              style={{background:`linear-gradient(90deg,${gradCss})`}}
              title="Click to add stop">
            </div>
            {/* Stop handles */}
            {stops.map((st,i)=>(
              <div
                key={i}
                onMouseDown={e=>{ e.stopPropagation(); setDraggingStop(i); setActiveStop(i); const r2=hexToRgb(st.color); setHsv(rgbToHsv(r2.r,r2.g,r2.b)); setHexInput(st.color.replace('#','')); }}
                onDoubleClick={()=>deleteStop(i)}
                title="Drag to move · Double-click to delete"
                className={`absolute cursor-grab active:cursor-grabbing transition-transform ${activeStop===i?'scale-125 z-10':'z-0'}`}
                style={{
                  bottom:0, left:`calc(${st.offset*100}% - 7px)`,
                  width:14, height:14, borderRadius:'50%',
                  backgroundColor:st.color,
                  border: activeStop===i ? '2px solid #64b5f6' : '2px solid white',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.5)',
                }}
              />
            ))}
          </div>

          {/* Angle */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[10px] shrink-0">Angle</span>
            <input type="number" value={angle}
              onChange={e=>{const a=parseInt(e.target.value)||0;setAngle(a);onGradientChange?.(stops,a);}}
              className="w-12 px-1 py-0.5 bg-[#1a1a2e] border border-gray-600/30 rounded text-white text-[10px] text-center" min={0} max={360}/>
            <input type="range" min={0} max={360} value={angle}
              onChange={e=>{const a=parseInt(e.target.value);setAngle(a);onGradientChange?.(stops,a);}}
              className="flex-1"/>
          </div>

          {/* Active stop colour preview */}
          <div className="flex items-center gap-2 text-[9px] text-gray-500">
            <div className="w-4 h-4 rounded-sm border border-gray-500 shrink-0" style={{backgroundColor:stops[activeStop]?.color}}/>
            Editing stop {activeStop+1}/{stops.length} · dbl-click to delete
          </div>
        </div>
      )}

      {/* Saturation/Value box */}
      <div ref={specRef} onMouseDown={specDown}
        className="mx-3 mt-3 h-36 rounded-lg cursor-crosshair relative overflow-hidden"
        style={{background:`linear-gradient(to right,#fff,hsl(${hsv.h},100%,50%))`}}>
        <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,transparent,#000)'}}/>
        <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{left:`${hsv.s*100}%`,top:`${(1-hsv.v)*100}%`,backgroundColor:previewHex}}/>
      </div>

      {/* Hue + Alpha */}
      <div className="px-3 pt-2 space-y-1.5">
        <div ref={hueRef} onMouseDown={hueDown} className="h-3 rounded-full cursor-pointer relative"
          style={{background:'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)'}}>
          <div className="absolute w-4 h-4 rounded-full border-2 border-white shadow top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{left:`${(hsv.h/360)*100}%`,backgroundColor:`hsl(${hsv.h},100%,50%)`}}/>
        </div>
        <div ref={alphaRef} onMouseDown={alphaDown} className="h-3 rounded-full cursor-pointer relative"
          style={{background:`linear-gradient(to right,transparent,${previewHex})`}}>
          <div className="absolute w-4 h-4 rounded-full border-2 border-white shadow top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{left:`${alpha}%`,backgroundColor:previewHex}}/>
        </div>
      </div>

      {/* Hex + RGB + A inputs */}
      <div className="px-3 pt-2 pb-2">
        <div className="flex gap-1">
          <div className="flex-1 min-w-0">
            <input value={hexInput} onChange={e=>{ const v=e.target.value.replace(/[^0-9a-fA-F]/g,'').slice(0,6); setHexInput(v); if(v.length===6){const r2=hexToRgb('#'+v);const nh=rgbToHsv(r2.r,r2.g,r2.b);setHsv(nh);emitColor(nh.h,nh.s,nh.v,alpha);}}}
              className="w-full px-1 py-1 bg-[#1a1a2e] border border-gray-600/30 rounded text-white text-[10px] font-mono text-center" maxLength={6}/>
            <div className="text-gray-500 text-[8px] text-center mt-0.5">Hex</div>
          </div>
          {(['r','g','b'] as const).map(ch=>(
            <div key={ch} className="w-9">
              <input value={rgb[ch]} type="number" min={0} max={255}
                onChange={e=>{ const n=Math.max(0,Math.min(255,parseInt(e.target.value)||0)); const nr={...rgb,[ch]:n}; const nh=rgbToHsv(nr.r,nr.g,nr.b); setHsv(nh); setHexInput(rgbToHex(nr.r,nr.g,nr.b).replace('#','')); emitColor(nh.h,nh.s,nh.v,alpha); }}
                className="w-full px-1 py-1 bg-[#1a1a2e] border border-gray-600/30 rounded text-white text-[10px] text-center"/>
              <div className="text-gray-500 text-[8px] text-center mt-0.5">{ch.toUpperCase()}</div>
            </div>
          ))}
          <div className="w-9">
            <input value={alpha} type="number" min={0} max={100}
              onChange={e=>{const a=Math.max(0,Math.min(100,parseInt(e.target.value)||0));setAlpha(a);emitColor(hsv.h,hsv.s,hsv.v,a);}}
              className="w-full px-1 py-1 bg-[#1a1a2e] border border-gray-600/30 rounded text-white text-[10px] text-center"/>
            <div className="text-gray-500 text-[8px] text-center mt-0.5">A</div>
          </div>
        </div>
      </div>

      {/* Swatches */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-9 gap-1">
          {SWATCHES.map((s,i)=>(
            <button key={i} onClick={()=>pickSwatch(s)}
              className="w-5 h-5 rounded-sm border border-gray-600/30 hover:scale-125 transition-transform"
              style={{backgroundColor:s}}/>
          ))}
        </div>
      </div>

      {/* Preview of gradient */}
      {mode==='linear'&&(
        <div className="mx-3 mb-3 h-6 rounded-md border border-gray-600/30"
          style={{background:`linear-gradient(${deg}deg,${gradCss})`}}/>
      )}
    </div>
  );
};

export default ColorPicker;
