import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shadow, IText, Group, Rect } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import ColorPicker from '../ColorPicker';
import { v4 as uuid } from 'uuid';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function hexToRgba(hex: string, a: number): string {
  const h = (hex.replace('#','')+'000000').slice(0,6);
  const n = parseInt(h,16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${Math.max(0,Math.min(1,a)).toFixed(2)})`;
}
function rgbaToHex(c: string): string {
  if (!c) return '#000000'; if (c.startsWith('#')) return c;
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? '#'+[m[1],m[2],m[3]].map(v=>parseInt(v).toString(16).padStart(2,'0')).join('') : '#000000';
}
function rgbaToAlpha(c: string): number {
  const m = c?.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/);
  return m ? Math.round(parseFloat(m[1])*100) : 100;
}
function getFab(): any { try { return require('fabric'); } catch { return {}; } }

/* ── per-object blur via render() override ───────────────────────────────── */
function setObjBlur(obj: any, canvas: any, px: number) {
  if (!obj || !canvas) return;
  if (obj.__origRender) { obj.render = obj.__origRender; delete obj.__origRender; }
  obj.__blurPx = px;
  if (px > 0) {
    obj.__origRender = obj.render.bind(obj);
    obj.render = function(ctx: CanvasRenderingContext2D) {
      ctx.save(); ctx.filter = `blur(${px}px)`;
      obj.__origRender(ctx);
      ctx.filter = 'none'; ctx.restore();
    };
  }
  canvas.requestRenderAll();
}

/* ── arc text constants ───────────────────────────────────────────────────── */
const ARC_TAG   = '__isArcGroup';
const ARC_OWNER = '__arcOwnerId';

/* ── arc builder ─────────────────────────────────────────────────────────── */
interface ArcStyle {
  fontSize: number; fontFamily: string; fontWeight: string;
  fontStyle: string; underline: boolean; linethrough: boolean;
  charSpacing: number;
  fill: string; strokeClr: string; strokeW: number;
  shadow: any; blurPx: number;
  bgColor: string; bgOpacity: number; bgPad: number;
}

function buildArcGroup(
  text: string, power: number, style: ArcStyle,
): Group | null {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { fontSize, fontFamily, fontWeight, fontStyle, underline, linethrough, charSpacing,
    fill, strokeClr, strokeW, shadow, blurPx, bgColor, bgOpacity, bgPad } = style;
  const chars = text.replace(/\n/g,'').split('').filter(Boolean);
  if (!chars.length) return null;

  const absP  = Math.max(1, Math.abs(power));
  const isLow = power < 0;
  const R     = (fontSize * 55) / absP;
  let charW = Math.max(fontSize * 0.2, (fontSize * 0.58) + (fontSize * (charSpacing || 0) / 4000));
  let apc = charW / R;
  const maxApc = ((340 * Math.PI) / 180) / chars.length;
  if (apc > maxApc) { apc = maxApc; charW = apc * R; }
  const total = apc * chars.length;
  const base  = isLow ? Math.PI/2 : -Math.PI/2;
  const start = base - total/2;

  const items: any[] = [];

  const hasBg = bgColor && bgColor !== 'transparent' && bgOpacity > 0;
  if (hasBg) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    chars.forEach((_,i) => {
      const a = start + apc*(i+0.5);
      const x = R*Math.cos(a), y = R*Math.sin(a);
      const half = fontSize * 0.6;
      minX = Math.min(minX, x-half); maxX = Math.max(maxX, x+half);
      minY = Math.min(minY, y-half); maxY = Math.max(maxY, y+half);
    });
    const pad = bgPad;
    items.push(new Rect({
      left:   minX - pad,
      top:    minY - pad,
      width:  (maxX - minX) + pad*2,
      height: (maxY - minY) + pad*2,
      fill:   hexToRgba(bgColor, bgOpacity/100),
      strokeWidth: 0,
      rx: Math.min(pad, 20), ry: Math.min(pad, 20),
      originX: 'left', originY: 'top',
      selectable: false, evented: false,
      hasControls: false, hasBorders: false,
    }));
  }

  chars.forEach((ch, i) => {
    const a = start + apc*(i+0.5);
    const hasStroke = strokeW > 0;
    items.push(new IText(ch===' ' ? '\u00A0' : ch, {
      left: R*Math.cos(a), top: R*Math.sin(a),
      angle: (a*180)/Math.PI + 90,
      fontSize, fontFamily, fontWeight: fontWeight as any,
      fontStyle: fontStyle as any, underline, linethrough,
      charSpacing: 0,
      fill,
      stroke: hasStroke ? strokeClr : '',
      strokeWidth: hasStroke ? strokeW : 0,
      paintFirst: hasStroke ? 'stroke' : 'fill',
      shadow: shadow||null,
      originX:'center', originY:'center',
      selectable:false, evented:false,
      hasControls:false, hasBorders:false, editable:false,
    }));
  });

  const grp = new Group(items, { originX:'center', originY:'center', selectable:true, evented:true });

  if (blurPx > 0) {
    const orig = (grp as any).render.bind(grp);
    (grp as any).__origRender = orig;
    (grp as any).render = function(ctx: CanvasRenderingContext2D) {
      ctx.save(); ctx.filter = `blur(${blurPx}px)`;
      orig(ctx); ctx.filter='none'; ctx.restore();
    };
  }

  (grp as any)[ARC_TAG] = true;
  (grp as any).id   = uuid();
  (grp as any).name = `Arc: ${text.slice(0,10)}`;
  return grp;
}

function findArcGroup(canvas: any, ownerId: string): any|null {
  return canvas?.getObjects().find((o:any)=>o[ARC_TAG]&&o[ARC_OWNER]===ownerId) ?? null;
}
function removeArcByOwner(canvas: any, ownerId: string) {
  const g = findArcGroup(canvas, ownerId);
  if (g) canvas.remove(g);
}

/* ── sync arc ─────────────────────────────────────────────────────────────── */
function syncArc(canvas: any, obj: any, syncLock: React.MutableRefObject<boolean>) {
  if (!canvas || !obj) return;
  const id = obj.__uid || obj.id;
  if (!id) return;

  syncLock.current = true;
  removeArcByOwner(canvas, id);

  const power = obj.__curvePower ?? 0;
  if (power === 0) {
    obj.set('visible', true);
    requestAnimationFrame(() => { syncLock.current = false; canvas.requestRenderAll(); });
    return;
  }

  const rawFill = obj.fill;
  const resolvedFill = (typeof rawFill === 'string' && rawFill)
    ? rawFill
    : (rawFill && typeof rawFill === 'object') ? rawFill : '#000000';

  const grp = buildArcGroup(obj.text || '', power, {
    fontSize:    obj.fontSize    || 32,
    fontFamily:  obj.fontFamily  || 'Inter',
    fontWeight:  obj.fontWeight  || 'normal',
    fontStyle:   obj.fontStyle   || 'normal',
    underline:   !!obj.underline,
    linethrough: !!obj.linethrough,
    charSpacing: obj.charSpacing || 0,
    fill:        resolvedFill,
    strokeClr:  obj.__curveStrokeColor  != null ? obj.__curveStrokeColor  : (obj.stroke      || ''),
    strokeW:    obj.__curveStrokeWidth  != null ? obj.__curveStrokeWidth  : (obj.strokeWidth ?? 0),
    shadow:     obj.__curveShadow       != null ? obj.__curveShadow       : (obj.shadow      || null),
    blurPx:     obj.__curveBlurPx       != null ? obj.__curveBlurPx       : 0,
    bgColor:    obj.__curveBgColor      != null ? obj.__curveBgColor      : '',
    bgOpacity:  obj.__curveBgOpacity    != null ? obj.__curveBgOpacity    : 0,
    bgPad:      obj.__curveBgPad        != null ? obj.__curveBgPad        : 0,
  });

  if (!grp) { obj.set('visible',true); requestAnimationFrame(()=>{ syncLock.current=false; canvas.requestRenderAll(); }); return; }

  const bnd = obj.getBoundingRect();
  grp.set({ left: bnd.left+bnd.width/2, top: bnd.top+bnd.height/2 });
  (grp as any)[ARC_OWNER] = id;

  obj.set('visible', false);
  canvas.add(grp);

  const onDblClick = () => {
    if (!canvas) return;
    syncLock.current = true;
    canvas.remove(grp);
    obj.set({ visible: true, selectable: true, evented: true, hasControls: true, hasBorders: true, editable: true });
    obj.setCoords();
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    requestAnimationFrame(() => {
      try { obj.enterEditing(); obj.selectAll(); canvas.requestRenderAll(); } catch (_e) { /* ignore */ }
    });
    const onExit = () => {
      obj.off('editing:exited', onExit);
      obj.set({ visible: false, selectable: false, evented: false, hasControls: false, hasBorders: false, editable: false });
      syncArc(canvas, obj, syncLock);
    };
    obj.on('editing:exited', onExit);
  };

  if ((grp as any).__onDblClick) {
    grp.off('mousedblclick', (grp as any).__onDblClick);
  }
  grp.on('mousedblclick', onDblClick);
  (grp as any).__onDblClick = onDblClick;

  requestAnimationFrame(() => { syncLock.current = false; canvas.requestRenderAll(); });
}

/* ── color transformation helpers (works like Polotno) ───────────────────── */
function clamp(v: number, min = 0, max = 255) { return Math.max(min, Math.min(max, Math.round(v))); }

function transformRgb(r: number, g: number, b: number, preset: string, adj: Record<string, number>) {
  if (preset === 'grayscale') { const avg = (r + g + b) / 3; return { r: avg, g: avg, b: avg }; }
  if (preset === 'sepia') {
    return {
      r: r * .393 + g * .769 + b * .189,
      g: r * .349 + g * .686 + b * .168,
      b: r * .272 + g * .534 + b * .131,
    };
  }
  if (preset === 'cold') { return { r: r * 0.85, g: g, b: b * 1.25 }; }
  if (preset === 'warm') { return { r: r * 1.2, g: g, b: b * 0.8 }; }
  if (preset === 'white') {
    return { r: r + (255-r)*0.55, g: g + (255-g)*0.55, b: b + (255-b)*0.55 };
  }
  if (preset === 'black') { return { r: r * 0.35, g: g * 0.35, b: b * 0.35 }; }
  if (preset === 'invert') { return { r: 255-r, g: 255-g, b: 255-b }; }
  if (preset === 'natural') { return { r: r * 1.03, g: g * 1.08, b: b * 1.02 }; }
  if (preset === 'vintage') { return { r: r * 1.06, g: g * 0.94, b: b * 0.78 }; }

  let nr = r, ng = g, nb = b;
  const brightness = adj.brightness || 0;
  if (brightness !== 0) { nr += 255 * brightness; ng += 255 * brightness; nb += 255 * brightness; }
  const contrast = adj.contrast || 0;
  if (contrast !== 0) {
    const f = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    nr = f * (nr - 128) + 128; ng = f * (ng - 128) + 128; nb = f * (nb - 128) + 128;
  }
  const saturation = (adj.saturation || 0) + (adj.vibrance || 0) * 0.6;
  if (saturation !== 0) {
    const gray = 0.2989*nr + 0.587*ng + 0.114*nb;
    nr = gray + (nr-gray) * (1+saturation); ng = gray + (ng-gray) * (1+saturation); nb = gray + (nb-gray) * (1+saturation);
  }
  const temp = adj.temperature || 0;
  if (temp !== 0) { nr += 60*temp; nb -= 60*temp; }
  return { r: nr, g: ng, b: nb };
}

function transformColor(color: string | any, preset: string, adj: Record<string, number>): string | any {
  if (!color) return color;
  
  // Handle Gradient objects (for SVG icons with gradients)
  if (color && typeof color === 'object' && Array.isArray(color.colorStops)) {
    const cloned = { ...color };
    cloned.colorStops = color.colorStops.map((stop: any) => {
      const c = transformColor(stop.color, preset, adj);
      return { ...stop, color: c };
    });
    return cloned;
  }
  
  // Handle string colors (hex, rgb)
  if (typeof color === 'string') {
    // Skip 'none' and other non-color values
    if (color === 'none' || color === 'transparent') return color;
    
    let r = 0, g = 0, b = 0;
    if (color.startsWith('#')) {
      const h = (color.replace('#','')+'000000').slice(0,6);
      const n = parseInt(h,16);
      r = (n>>16)&255; g = (n>>8)&255; b = n&255;
    } else if (color.startsWith('rgb')) {
      const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) { r = parseInt(m[1]); g = parseInt(m[2]); b = parseInt(m[3]); }
    } else {
      return color; // unknown format
    }
    const { r: nr, g: ng, b: nb } = transformRgb(r, g, b, preset, adj);
    return `rgb(${clamp(nr)},${clamp(ng)},${clamp(nb)})`;
  }
  return color;
}

/* ── apply effects to vectors/icons (Polotno-style) ──────────────────────── */
function applyVectorEffects(obj: any, preset: string, adj: Record<string, number>) {
  // For SVG icons, get the base color from the object
  const baseColor = obj.__baseColor || obj.__baseFill || obj.__baseStroke || '#000000';
  
  // Transform the base color
  const transformedColor = transformColor(baseColor, preset, adj);
  
  // Helper to recursively apply the transformed color
  const applyTransformedColor = (o: any) => {
    if (!o || !o.set) return;
    
    // Apply to group-level shadow/blur
    if ((adj.blur || 0) > 0) {
      o.set('shadow', new Shadow({ 
        color: 'rgba(0,0,0,0.3)', 
        blur: Math.round((adj.blur || 0)*20), 
        offsetX: 0, 
        offsetY: 0 
      }));
    } else if (o.shadow && o.shadow.blur !== 0) {
      o.set('shadow', null);
    }
    
    // For SVG icons, replace all fill/stroke with the transformed color
    if (obj.__isSvgIcon) {
      if (o.fill && o.fill !== 'none' && typeof o.fill === 'string') {
        o.set('fill', transformedColor);
      }
      if (o.stroke && o.stroke !== 'none' && typeof o.stroke === 'string') {
        o.set('stroke', transformedColor);
      }
    } else {
      // For non-SVG objects, transform existing colors
      if (o.fill && typeof o.fill === 'string' && o.fill !== 'none') {
        const newFill = transformColor(o.fill, preset, adj);
        if (newFill !== o.fill) o.set('fill', newFill);
      }
      if (o.stroke && typeof o.stroke === 'string' && o.stroke !== 'none') {
        const newStroke = transformColor(o.stroke, preset, adj);
        if (newStroke !== o.stroke) o.set('stroke', newStroke);
      }
    }
    
    // Recurse into children
    if (o.getObjects) {
      o.getObjects().forEach(applyTransformedColor);
    }
  };
  
  applyTransformedColor(obj);
}

/* ── UI primitives ───────────────────────────────────────────────────────── */
const Toggle: React.FC<{on:boolean; onToggle:()=>void}> = ({on,onToggle}) => (
  <button
    onMouseDown={e=>{e.preventDefault();e.stopPropagation();}}
    onClick={e=>{e.preventDefault();e.stopPropagation();onToggle();}}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none ${on?'bg-[#3b82f6]':'bg-gray-600 hover:bg-gray-500'}`}>
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-150 ${on?'left-6':'left-1'}`}/>
  </button>
);

const Section: React.FC<{label:string;on:boolean;onToggle:()=>void;children?:React.ReactNode}> =
  ({label,on,onToggle,children}) => (
  <div className="border-b border-gray-700/30 last:border-0">
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-white text-sm font-medium select-none">{label}</span>
      <Toggle on={on} onToggle={onToggle}/>
    </div>
    {on&&children&&<div className="px-4 pb-4 space-y-3">{children}</div>}
  </div>
);

const Slider: React.FC<{label:string;value:number;min:number;max:number;step?:number;onChange:(v:number)=>void;showTicks?:boolean}> =
  ({label,value,min,max,step=1,onChange,showTicks}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-gray-400 text-xs select-none">{label}</span>
      <input type="number" value={value} min={min} max={max}
        onChange={e=>onChange(Math.max(min,Math.min(max,Number(e.target.value))))}
        className="w-14 px-1 py-0.5 bg-[#12122a] border border-gray-600/40 rounded text-white text-xs text-center"/>
    </div>
    {showTicks&&<div className="flex justify-between text-gray-600 text-[9px] mb-0.5 px-0.5"><span>{min}</span><span>0</span><span>{max}</span></div>}
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e=>onChange(Number(e.target.value))} className="w-full cursor-pointer accent-[#3b82f6]"/>
  </div>
);

const ColorSwatch: React.FC<{label:string;value:string;onChange:(c:string)=>void}> = ({label,value,onChange}) => {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);
  const display=(value?.startsWith('rgba')?rgbaToHex(value):value)||'#000000';
  return (
    <div className="flex items-center justify-between" ref={ref}>
      <span className="text-gray-400 text-xs select-none">{label}</span>
      <div className="relative">
        <button onClick={e=>{e.stopPropagation();setOpen(p=>!p);}}
          className="w-8 h-8 rounded border-2 border-gray-600 hover:border-gray-300 transition-all"
          style={{backgroundColor:display}}/>
        {open&&<div className="absolute right-0 top-10 z-[200]"><ColorPicker value={display} onChange={c=>onChange(c)}/></div>}
      </div>
    </div>
  );
};

/* ── TEXT EFFECTS ─────────────────────────────────────────────────────────── */
const TextEffects: React.FC<{
  obj: any; canvas: any; save: ()=>void;
  syncLock: React.MutableRefObject<boolean>;
}> = ({obj, canvas, save, syncLock}) => {

  const [curveOn,    setCurveOn]    = useState(()=> (obj.__curvePower ?? 0) !== 0);
  const [curvePower, setCurvePower] = useState(()=> obj.__curvePower ?? 20);
  const [blurOn,  setBlurOn]  = useState(()=> (obj.__curveBlurPx ?? 0) > 0);
  const [blurPx,  setBlurPx]  = useState(()=> obj.__curveBlurPx  ?? 4);
  const [strokeOn,    setStrokeOn]    = useState(()=> (obj.__curveStrokeWidth ?? obj.strokeWidth ?? 0) > 0);
  const [strokeColor, setStrokeColor] = useState(()=> obj.__curveStrokeColor ?? obj.stroke ?? '#000000');
  const [strokeW,     setStrokeW]     = useState(()=> obj.__curveStrokeWidth  ?? obj.strokeWidth ?? 2);
  const [bgOn,      setBgOn]      = useState(()=> !!(obj.__curveBgColor));
  const [bgColor,   setBgColor]   = useState(()=> obj.__curveBgColor   ?? '#4ade80');
  const [bgPad,     setBgPad]     = useState(()=> obj.__curveBgPad     ?? 8);
  const [bgOpacity, setBgOpacity] = useState(()=> obj.__curveBgOpacity ?? 100);
  const [shadowOn,      setShadowOn]      = useState(()=> !!(obj.__curveShadow ?? obj.shadow));
  const [shadowColor,   setShadowColor]   = useState(()=>{ const sh=obj.__curveShadow??obj.shadow as any; return sh?.color?rgbaToHex(sh.color):'#000000'; });
  const [shadowBlur,    setShadowBlur]    = useState(()=>{ const sh=obj.__curveShadow??obj.shadow as any; return sh?.blur??5; });
  const [shadowX,       setShadowX]       = useState(()=>{ const sh=obj.__curveShadow??obj.shadow as any; return sh?.offsetX??0; });
  const [shadowY,       setShadowY]       = useState(()=>{ const sh=obj.__curveShadow??obj.shadow as any; return sh?.offsetY??4; });
  const [shadowOpacity, setShadowOpacity] = useState(()=>{ const sh=obj.__curveShadow??obj.shadow as any; return sh?.color?rgbaToAlpha(sh.color):80; });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const ownerId = obj.__uid || obj.id;
      if (detail?.ownerId === ownerId && curveOn && (obj.__curvePower ?? 0) !== 0) {
        syncArc(canvas, obj, syncLock);
      }
    };
    window.addEventListener('__rebuildArc', handler);
    return () => window.removeEventListener('__rebuildArc', handler);
  }, [canvas, obj, syncLock, curveOn]);

  const doSync = useCallback((overrides: Record<string,any>={}) => {
    if (!canvas||!obj) return;
    Object.assign(obj, overrides);
    if (obj.__curvePower) {
      syncArc(canvas, obj, syncLock);
    } else {
      setObjBlur(obj, canvas, obj.__curveBlurPx||0);
      const sw = obj.__curveStrokeWidth||0;
      obj.set({
        visible: true,
        stroke: obj.__curveStrokeColor||'',
        strokeWidth: sw,
        paintFirst: sw > 0 ? 'stroke' : 'fill',
        shadow: obj.__curveShadow||null,
        textBackgroundColor: obj.__curveBgColor && (obj.__curveBgOpacity||0)>0
          ? hexToRgba(obj.__curveBgColor, (obj.__curveBgOpacity||0)/100) : '',
      });
      canvas.requestRenderAll();
    }
    save();
  }, [canvas, obj, save, syncLock]);

  const handleCurveToggle = (on: boolean) => {
    setCurveOn(on);
    obj.__curvePower = on ? curvePower : 0;
    if (on) {
      syncArc(canvas, obj, syncLock);
      requestAnimationFrame(()=>{
        const ownerId = obj.__uid||obj.id;
        const grp = findArcGroup(canvas, ownerId);
        if (grp) { canvas.discardActiveObject(); canvas.setActiveObject(grp); canvas.requestRenderAll(); }
      });
    } else {
      const ownerId = obj.__uid||obj.id;
      syncLock.current = true;
      removeArcByOwner(canvas, ownerId);
      obj.set('visible', true);
      setObjBlur(obj, canvas, obj.__curveBlurPx||0);
      const sw2 = obj.__curveStrokeWidth||0;
      obj.set({ stroke:obj.__curveStrokeColor||'', strokeWidth:sw2, paintFirst: sw2>0?'stroke':'fill', shadow:obj.__curveShadow||null, textBackgroundColor:obj.__curveBgColor&&(obj.__curveBgOpacity||0)>0?hexToRgba(obj.__curveBgColor,(obj.__curveBgOpacity||0)/100):'' });
      requestAnimationFrame(()=>{ canvas.discardActiveObject(); canvas.setActiveObject(obj); canvas.requestRenderAll(); syncLock.current=false; });
    }
    save();
  };

  const handleCurvePower = (val: number) => {
    setCurvePower(val); obj.__curvePower = val;
    if (curveOn) { syncArc(canvas, obj, syncLock); save(); }
  };

  const handleBlurToggle = (on: boolean) => {
    setBlurOn(on); obj.__curveBlurPx = on ? blurPx : 0;
    if (curveOn) { syncArc(canvas, obj, syncLock); } else setObjBlur(obj, canvas, on ? blurPx : 0);
    save();
  };
  const handleBlurAmt = (val: number) => {
    setBlurPx(val); obj.__curveBlurPx = blurOn ? val : 0;
    if (curveOn) { syncArc(canvas, obj, syncLock); } else if (blurOn) setObjBlur(obj, canvas, val);
  };

  const applyStroke = (on: boolean, color: string, w: number) => {
    obj.__curveStrokeColor = on ? color : '';
    obj.__curveStrokeWidth = on ? w : 0;
    if (!curveOn && obj && canvas) {
      obj.set({ stroke: on?color:'', strokeWidth: on?w:0, paintFirst: (on&&w>0)?'stroke':'fill' });
      canvas.requestRenderAll();
    }
    doSync();
  };

  const applyBg = (on: boolean, color: string, opacity: number, pad: number) => {
    obj.__curveBgColor = on ? color : ''; obj.__curveBgOpacity = on ? opacity : 0; obj.__curveBgPad = on ? pad : 0;
    doSync();
  };

  const applyShadow = (on: boolean, c: string, bl: number, x: number, y: number, op: number) => {
    obj.__curveShadow = on ? new Shadow({ color:hexToRgba(c,op/100), blur:bl, offsetX:x, offsetY:y }) : null;
    doSync();
  };

  return (
    <div>
      <Section label="Blur" on={blurOn} onToggle={()=>handleBlurToggle(!blurOn)}>
        <Slider label="Amount (px)" value={blurPx} min={0} max={30} onChange={v=>handleBlurAmt(v)}/>
      </Section>

      <Section label="Curved text" on={curveOn} onToggle={()=>handleCurveToggle(!curveOn)}>
        <div className="flex items-center justify-center py-2 mb-1 bg-[#12122a] rounded-lg overflow-hidden">
          <svg width="140" height="80" viewBox="-70 -70 140 140">
            {curvePower===0
              ? <text x="-45" y="0" fontSize="10" fill="#94a3b8" fontFamily="Inter">ABCDEFGHI</text>
              : (() => {
                  const absP=Math.max(1,Math.abs(curvePower)), R=(28*55)/absP;
                  const apc=(28*0.58)/R, tot=apc*9, base=(curvePower<0?Math.PI/2:-Math.PI/2), st=base-tot/2;
                  return 'ABCDEFGHI'.split('').map((ch,i)=>{
                    const a=st+apc*(i+0.5), x=R*Math.cos(a), y=R*Math.sin(a), rot=(a*180)/Math.PI+90;
                    return <text key={i} x={x.toFixed(1)} y={y.toFixed(1)} fontSize="10" fill="#94a3b8"
                      fontFamily="Inter" textAnchor="middle" dominantBaseline="central"
                      transform={`rotate(${rot.toFixed(1)},${x.toFixed(1)},${y.toFixed(1)})`}>{ch}</text>;
                  });
                })()}
          </svg>
        </div>
        <Slider label="Power" value={curvePower} min={-100} max={100} onChange={v=>handleCurvePower(v)} showTicks/>
        <p className="text-gray-600 text-[9px]">0 = straight · + = upper arc · − = lower arc</p>
        <div className="grid grid-cols-4 gap-1.5 mt-1">
          {([{p:20,icon:'⌢',label:'Gentle'},{p:60,icon:'◠',label:'Upper'},{p:-60,icon:'◡',label:'Lower'},{p:-100,icon:'⌣',label:'Half ↓'}] as const).map(b=>(
            <button key={b.p}
              onMouseDown={e=>e.preventDefault()}
              onClick={e=>{e.stopPropagation();handleCurvePower(b.p);}}
              className={`py-1.5 rounded-lg flex flex-col items-center text-[10px] font-medium transition-all border ${curvePower===b.p?'bg-[#3b82f6] text-white border-[#3b82f6]':'bg-[#12122a] text-gray-400 border-gray-700/40 hover:bg-[#1e1e3a]'}`}>
              <span className="text-base leading-none mb-0.5">{b.icon}</span>{b.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Text Stroke" on={strokeOn}
        onToggle={()=>{const nv=!strokeOn;setStrokeOn(nv);applyStroke(nv,strokeColor,strokeW);}}>
        <ColorSwatch label="Color" value={strokeColor} onChange={c=>{setStrokeColor(c);applyStroke(strokeOn,c,strokeW);}}/>
        <Slider label="Width" value={strokeW} min={0} max={20} onChange={v=>{setStrokeW(v);applyStroke(strokeOn,strokeColor,v);}}/>
      </Section>

      <Section label="Background" on={bgOn}
        onToggle={()=>{const nv=!bgOn;setBgOn(nv);applyBg(nv,bgColor,bgOpacity,bgPad);}}>
        <ColorSwatch label="Color" value={bgColor} onChange={c=>{setBgColor(c);applyBg(bgOn,c,bgOpacity,bgPad);}}/>
        <Slider label="Padding" value={bgPad} min={0} max={60} onChange={v=>{setBgPad(v);applyBg(bgOn,bgColor,bgOpacity,v);}}/>
        <Slider label="Opacity" value={bgOpacity} min={0} max={100} onChange={v=>{setBgOpacity(v);applyBg(bgOn,bgColor,v,bgPad);}}/>
      </Section>

      <Section label="Shadow" on={shadowOn}
        onToggle={()=>{const nv=!shadowOn;setShadowOn(nv);applyShadow(nv,shadowColor,shadowBlur,shadowX,shadowY,shadowOpacity);}}>
        <ColorSwatch label="Color" value={shadowColor} onChange={c=>{setShadowColor(c);applyShadow(shadowOn,c,shadowBlur,shadowX,shadowY,shadowOpacity);}}/>
        <Slider label="Blur"     value={shadowBlur}    min={0}   max={60} onChange={v=>{setShadowBlur(v);applyShadow(shadowOn,shadowColor,v,shadowX,shadowY,shadowOpacity);}}/>
        <Slider label="Offset X" value={shadowX}       min={-50} max={50} onChange={v=>{setShadowX(v);applyShadow(shadowOn,shadowColor,shadowBlur,v,shadowY,shadowOpacity);}}/>
        <Slider label="Offset Y" value={shadowY}       min={-50} max={50} onChange={v=>{setShadowY(v);applyShadow(shadowOn,shadowColor,shadowBlur,shadowX,v,shadowOpacity);}}/>
        <Slider label="Opacity"  value={shadowOpacity} min={0}   max={100} onChange={v=>{setShadowOpacity(v);applyShadow(shadowOn,shadowColor,shadowBlur,shadowX,shadowY,v);}}/>
      </Section>
    </div>
  );
};

/* ── OBJECT EFFECTS ───────────────────────────────────────────────────────── */
const PRESETS=[
  {key:'grayscale',label:'Grayscale'},
  {key:'sepia',label:'Sepia'},
  {key:'cold',label:'Cold'},
  {key:'natural',label:'Natural'},
  {key:'warm',label:'Warm'},
];

const ObjectEffects: React.FC<{obj:any;canvas:any;save:()=>void}> = ({obj,canvas,save}) => {
  const [presetVal,setPreset]=useState('none');
  const [brightness,setBrightness]=useState(0);
  const [contrast,setContrast]=useState(0);
  const [saturation,setSaturation]=useState(0);
  const [vibrance,setVibrance]=useState(0);
  const [blur,setBlur]=useState(0);
  const [temperature,setTemperature]=useState(0);
  const [borderOn,setBorderOn]=useState(false);
  const [borderColor,setBorderColor]=useState('#000000');
  const [borderW,setBorderW]=useState(2);
  const [cornerOn,setCornerOn]=useState(false);
  const [cornerR,setCornerR]=useState(0);
  const [shadowOn,setShadowOn]=useState(false);
  const [shadowColor,setShadowColor]=useState('#000000');
  const [shadowBlur,setShadowBlur]=useState(10);
  const [shadowX,setShadowX]=useState(0);
  const [shadowY,setShadowY]=useState(4);
  const [shadowOp,setShadowOp]=useState(60);
  // Toggles for adjustments
  const [blurOn,setBlurOnAdj]=useState(false);
  const [brightnessOn,setBrightnessOn]=useState(false);
  const [temperatureOn,setTemperatureOn]=useState(false);
  const [contrastOn,setContrastOn]=useState(false);
  const [saturationOn,setSaturationOn]=useState(false);
  const [vibranceOn,setVibranceOn]=useState(false);

  useEffect(()=>{
    if(!obj)return;
    setBorderOn((obj.strokeWidth||0)>0); setBorderColor(obj.stroke||'#000000'); setBorderW(obj.strokeWidth||2);
    const rx=obj.rx||0; setCornerOn(rx>0); setCornerR(rx);
    const sh=obj.shadow as any; setShadowOn(!!sh);
    if(sh){setShadowColor(sh.color?rgbaToHex(sh.color):'#000000');setShadowBlur(sh.blur||10);setShadowX(sh.offsetX||0);setShadowY(sh.offsetY||4);setShadowOp(sh.color?rgbaToAlpha(sh.color):60);}
  },[obj]); // eslint-disable-line

  const buildActiveAdj = (overrides: Record<string, number> = {}) => ({
    blur: blurOn ? blur : 0,
    brightness: brightnessOn ? brightness : 0,
    temperature: temperatureOn ? temperature : 0,
    contrast: contrastOn ? contrast : 0,
    saturation: saturationOn ? saturation : 0,
    vibrance: vibranceOn ? vibrance : 0,
    ...overrides,
  });

  const applyRecursive = useCallback((fn:(o:any)=>void) => {
    const walk = (o:any) => {
      if (o.getObjects) { o.getObjects().forEach(walk); return; }
      fn(o);
    };
    if (obj) walk(obj);
  }, [obj]);

  const applyF = useCallback((p:string, adj:Record<string,number>) => {
    if (!obj || !canvas) return;
    
    // For images (FabricImage), use native filter system
    if (obj.type === 'image' && obj.applyFilters) {
      const F = getFab().filters || getFab();
      const out: any[] = [];
      if (p==='grayscale'&&F.Grayscale) out.push(new F.Grayscale());
      if (p==='sepia'&&F.Sepia) out.push(new F.Sepia());
      if (p==='cold'&&F.ColorMatrix) out.push(new F.ColorMatrix({matrix:[1,0,0,0,0,0,1,0,0,0,0,0,1.4,0,0,0,0,0,1,0]}));
      if (p==='warm'&&F.ColorMatrix) out.push(new F.ColorMatrix({matrix:[1.2,0,0,0,0,0,1,0,0,0,0,0,0.8,0,0,0,0,0,1,0]}));
      if (p==='natural'&&F.ColorMatrix) out.push(new F.ColorMatrix({matrix:[1.05,0,0,0,0.05,0,1.05,0,0,0.05,0,0,1,0,0,0,0,0,1,0]}));
      if (adj.brightness!==0&&F.Brightness) out.push(new F.Brightness({brightness:adj.brightness}));
      if (adj.contrast!==0&&F.Contrast) out.push(new F.Contrast({contrast:adj.contrast}));
      if (adj.saturation!==0&&F.Saturation) out.push(new F.Saturation({saturation:adj.saturation}));
      if (adj.vibrance!==0&&F.Vibrance) out.push(new F.Vibrance({vibrance:adj.vibrance}));
      if (adj.blur>0&&F.BlurFilter) out.push(new F.BlurFilter({blur:adj.blur}));
      if (adj.temperature!==0&&F.ColorMatrix) {const t=adj.temperature; out.push(new F.ColorMatrix({matrix:[1+t*0.2,0,0,0,0,0,1,0,0,0,0,0,1-t*0.2,0,0,0,0,0,1,0]}));}
      
      obj.filters = out;
      obj.applyFilters();
      canvas.requestRenderAll();
      save();
      return;
    }
    
    // For vectors/shapes/groups, apply color transformations recursively (Polotno-style)
    applyVectorEffects(obj, p, adj);
    canvas.requestRenderAll(); 
    save();
  }, [obj, canvas, save]);

  const setAdj = (key:string, val:number) => {
    switch(key){
      case 'brightness': setBrightness(val); break;
      case 'contrast': setContrast(val); break;
      case 'saturation': setSaturation(val); break;
      case 'vibrance': setVibrance(val); break;
      case 'blur': setBlur(val); break;
      case 'temperature': setTemperature(val); break;
    }
    applyF(presetVal, buildActiveAdj({[key]:val}));
  };

  const applyProp = useCallback((props:Record<string,any>) => {
    if (!obj || !canvas) return;
    applyRecursive((o:any) => Object.entries(props).forEach(([k,v]) => o.set(k,v)));
    canvas.requestRenderAll();
    save();
  }, [obj, canvas, save, applyRecursive]);

  const applySh = (on:boolean, c:string, bl:number, x:number, y:number, op:number) => {
    if (!obj || !canvas) return;
    applyRecursive((o:any) => {
      if (on) o.set('shadow', new Shadow({color:hexToRgba(c,op/100), blur:bl, offsetX:x, offsetY:y}));
      else o.set('shadow', null);
    });
    canvas.requestRenderAll();
    save();
  };

  return (
    <div>
      <div className="px-4 pt-4 pb-3 border-b border-gray-700/30">
        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-3">Filter Presets</p>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => { setPreset(p.key); applyF(p.key, buildActiveAdj()); }}
              className={`py-2 rounded-lg flex flex-col items-center gap-1.5 text-[10px] font-medium transition-all ${presetVal===p.key ? 'text-white bg-[#3b82f6]/20' : 'text-gray-400 hover:text-white hover:bg-[#1e1e3a]'}`}>
              <div className="w-12 h-12 rounded-lg bg-[#12122a] border border-gray-700/50 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 32V16l8-6 8 6v16" />
                  <path d="M12 32v-10h8v10M20 32v-10h8v10" />
                </svg>
              </div>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      
      <Section label="Blur" on={blurOn} onToggle={() => { const nv = !blurOn; setBlurOnAdj(nv); applyF(presetVal, buildActiveAdj({blur: nv ? blur : 0})); }}>
        <Slider label="Amount" value={blur} min={0} max={1} step={0.01} onChange={v => setAdj('blur', v)}/>
      </Section>
      
      <Section label="Brightness" on={brightnessOn} onToggle={() => { const nv = !brightnessOn; setBrightnessOn(nv); applyF(presetVal, buildActiveAdj({brightness: nv ? brightness : 0})); }}>
        <Slider label="Amount" value={brightness} min={-1} max={1} step={0.01} onChange={v => setAdj('brightness', v)}/>
      </Section>
      
      <Section label="Temperature" on={temperatureOn} onToggle={() => { const nv = !temperatureOn; setTemperatureOn(nv); applyF(presetVal, buildActiveAdj({temperature: nv ? temperature : 0})); }}>
        <Slider label="Amount" value={temperature} min={-1} max={1} step={0.01} onChange={v => setAdj('temperature', v)}/>
      </Section>
      
      <Section label="Contrast" on={contrastOn} onToggle={() => { const nv = !contrastOn; setContrastOn(nv); applyF(presetVal, buildActiveAdj({contrast: nv ? contrast : 0})); }}>
        <Slider label="Amount" value={contrast} min={-1} max={1} step={0.01} onChange={v => setAdj('contrast', v)}/>
      </Section>
      
      <Section label="Saturation" on={saturationOn} onToggle={() => { const nv = !saturationOn; setSaturationOn(nv); applyF(presetVal, buildActiveAdj({saturation: nv ? saturation : 0})); }}>
        <Slider label="Amount" value={saturation} min={-1} max={1} step={0.01} onChange={v => setAdj('saturation', v)}/>
      </Section>
      
      <Section label="Vibrance" on={vibranceOn} onToggle={() => { const nv = !vibranceOn; setVibranceOn(nv); applyF(presetVal, buildActiveAdj({vibrance: nv ? vibrance : 0})); }}>
        <Slider label="Amount" value={vibrance} min={-1} max={1} step={0.01} onChange={v => setAdj('vibrance', v)}/>
      </Section>
      
      <Section label="Border" on={borderOn} onToggle={() => { const nv = !borderOn; setBorderOn(nv); applyProp({stroke: nv ? borderColor : '', strokeWidth: nv ? borderW : 0}); }}>
        <ColorSwatch label="Color" value={borderColor} onChange={c => { setBorderColor(c); applyProp({stroke: c}); }} />
        <Slider label="Width" value={borderW} min={0} max={40} onChange={v => { setBorderW(v); applyProp({strokeWidth: v}); }} />
      </Section>
      
      <Section label="Corner radius" on={cornerOn} onToggle={() => { const nv = !cornerOn; setCornerOn(nv); if (!nv) { setCornerR(0); applyProp({rx:0, ry:0}); } }}>
        <Slider label="Radius" value={cornerR} min={0} max={300} onChange={v => { setCornerR(v); applyProp({rx: v, ry: v}); }} />
      </Section>
      
      <Section label="Shadow" on={shadowOn} onToggle={() => { const nv = !shadowOn; setShadowOn(nv); applySh(nv, shadowColor, shadowBlur, shadowX, shadowY, shadowOp); }}>
        <ColorSwatch label="Color" value={shadowColor} onChange={c => { setShadowColor(c); applySh(shadowOn, c, shadowBlur, shadowX, shadowY, shadowOp); }} />
        <Slider label="Blur" value={shadowBlur} min={0} max={80} onChange={v => { setShadowBlur(v); applySh(shadowOn, shadowColor, v, shadowX, shadowY, shadowOp); }} />
        <Slider label="Offset X" value={shadowX} min={-60} max={60} onChange={v => { setShadowX(v); applySh(shadowOn, shadowColor, shadowBlur, v, shadowY, shadowOp); }} />
        <Slider label="Offset Y" value={shadowY} min={-60} max={60} onChange={v => { setShadowY(v); applySh(shadowOn, shadowColor, shadowBlur, shadowX, v, shadowOp); }} />
        <Slider label="Opacity" value={shadowOp} min={0} max={100} onChange={v => { setShadowOp(v); applySh(shadowOn, shadowColor, shadowBlur, shadowX, shadowY, v); }} />
      </Section>
    </div>
  );
};

/* ── MAIN PANEL ───────────────────────────────────────────────────────────── */
const EffectsPanel: React.FC = () => {
  const { canvas, saveToHistory, setActivePanel } = useEditorStore();
  const [activeObj, setActiveObj] = useState<any>(null);
  const [objType, setObjType] = useState<'text'|'object'|null>(null);
  const [objKey, setObjKey] = useState('');
  const syncLock = useRef(false);
  const lastTextRef = useRef<any>(null);

  const resolveOwner = useCallback((o: any): any => {
    if (o && o[ARC_TAG]) {
      const ownerId = o[ARC_OWNER];
      const owner = canvas?.getObjects().find((x:any)=> (x.__uid||x.id) === ownerId);
      return owner ?? null;
    }
    return o;
  }, [canvas]);

  const applyObj = useCallback((raw: any) => {
    const o = resolveOwner(raw);
    if (!o) return;
    if (!o.__uid) o.__uid = o.id || uuid();
    setActiveObj(o);
    const isText = ['textbox','text','i-text'].includes(o.type||'');
    setObjType(isText ? 'text' : 'object');
    setObjKey(o.__uid);
    if (isText) lastTextRef.current = o;
  }, [resolveOwner]);

  const syncSelection = useCallback(() => {
    if (!canvas || syncLock.current) return;
    const raw = canvas.getActiveObject() as any;
    if (!raw) {
      setActivePanel(null);
      setActiveObj(null); setObjType(null); setObjKey('');
      return;
    }
    applyObj(raw);
  }, [canvas, applyObj, setActivePanel]);

  useEffect(() => {
    if (!canvas) return;
    const current = canvas.getActiveObject() as any;
    if (current) applyObj(current);
    canvas.on('selection:created', syncSelection);
    canvas.on('selection:updated', syncSelection);
    canvas.on('selection:cleared', syncSelection);
    return () => {
      canvas.off('selection:created', syncSelection);
      canvas.off('selection:updated', syncSelection);
      canvas.off('selection:cleared', syncSelection);
    };
  }, [canvas, syncSelection, applyObj]);

  return (
    <div className="h-full flex flex-col bg-[#16162e]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40 shrink-0">
        <h3 className="text-white font-semibold">Effects</h3>
        {objType && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${objType==='text'?'bg-purple-500/20 text-purple-300 border border-purple-500/30':'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
            {objType==='text'?'✏️ Text':'🖼️ Object'}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {!activeObj || !objKey ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-1">No element selected</p>
            <p className="text-gray-500 text-xs leading-relaxed max-w-[200px]">Select any text, image, icon or shape then click Effects</p>
          </div>
        ) : objType === 'text' ? (
          <TextEffects key={objKey} obj={activeObj} canvas={canvas} save={saveToHistory} syncLock={syncLock}/>
        ) : (
          <ObjectEffects key={objKey} obj={activeObj} canvas={canvas} save={saveToHistory}/>
        )}
      </div>
    </div>
  );
};

export default EffectsPanel;

/* ── Re-attach arc handlers after page load ───────────────────────────────── */
export function reattachArcHandlersAfterLoad(canvas: any, syncLock: React.MutableRefObject<boolean>) {
  if (!canvas) return;
  const objects = canvas.getObjects();
  const owners = new Map<string, any>();
  objects.forEach((o: any) => {
    if (['textbox', 'text', 'i-text'].includes(o.type) && o.__uid) {
      owners.set(o.__uid, o);
    }
  });
  objects.forEach((g: any) => {
    if (g[ARC_TAG] && g[ARC_OWNER]) {
      const owner = owners.get(g[ARC_OWNER]);
      if (owner) {
        owner.set({ visible: false, selectable: false, evented: false, hasControls: false, hasBorders: false, editable: false });
        const onDblClick = () => {
          if (!canvas) return;
          syncLock.current = true;
          canvas.remove(g);
          owner.set({ visible: true, selectable: true, evented: true, hasControls: true, hasBorders: true, editable: true });
          owner.setCoords();
          canvas.setActiveObject(owner);
          canvas.requestRenderAll();
          requestAnimationFrame(() => {
            try { owner.enterEditing(); owner.selectAll(); canvas.requestRenderAll(); } catch (_e) { /* ignore */ }
          });
          const onExit = () => {
            owner.off('editing:exited', onExit);
            owner.set({ visible: false, selectable: false, evented: false, hasControls: false, hasBorders: false, editable: false });
            syncArc(canvas, owner, syncLock);
          };
          owner.on('editing:exited', onExit);
        };
        if (g.__onDblClick) g.off('mousedblclick', g.__onDblClick);
        g.on('mousedblclick', onDblClick);
        g.__onDblClick = onDblClick;
      }
    }
  });
  canvas.requestRenderAll();
}
