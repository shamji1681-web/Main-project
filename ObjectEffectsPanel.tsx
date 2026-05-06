import React, { useState, useEffect } from 'react';
import { Shadow } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import ColorPicker from '../ColorPicker';

/* ── filter helpers ────────────────────────────────────────────────────────── */
type FilterSlider = { label: string; key: string; min: number; max: number; step: number; default: number };

const FILTER_SLIDERS: FilterSlider[] = [
  { label: 'Brightness', key: 'brightness', min: -1, max: 1, step: 0.01, default: 0 },
  { label: 'Contrast',   key: 'contrast',   min: -1, max: 1, step: 0.01, default: 0 },
  { label: 'Saturation', key: 'saturation', min: -1, max: 1, step: 0.01, default: 0 },
  { label: 'Vibrance',   key: 'vibrance',   min: -1, max: 1, step: 0.01, default: 0 },
  { label: 'Blur',       key: 'blur',       min: 0,  max: 1, step: 0.01, default: 0 },
  { label: 'Noise',      key: 'noise',      min: 0,  max: 1, step: 0.01, default: 0 },
  { label: 'Temperature',key: 'temperature',min: -1, max: 1, step: 0.01, default: 0 },
];

type LutFilter = { label: string; key: string; icon: string };
const LUT_FILTERS: LutFilter[] = [
  { label: 'None',      key: 'none',      icon: '🚫' },
  { label: 'Grayscale', key: 'grayscale', icon: '🖤' },
  { label: 'Sepia',     key: 'sepia',     icon: '🟤' },
  { label: 'Cold',      key: 'cold',      icon: '🧊' },
  { label: 'Warm',      key: 'warm',      icon: '🔆' },
  { label: 'Natural',   key: 'natural',   icon: '🌿' },
  { label: 'Invert',    key: 'invert',    icon: '🔄' },
  { label: 'Vintage',   key: 'vintage',   icon: '📷' },
  { label: 'White',     key: 'white',     icon: '⬜' },
  { label: 'Black',     key: 'black',     icon: '⬛' },
];

function buildFilters(lut: string, sliders: Record<string, number>) {
  const fabric = require('fabric') as any;
  const F = fabric.filters || fabric;
  const list: any[] = [];

  // LUT filter
  switch (lut) {
    case 'grayscale': if (F.Grayscale) list.push(new F.Grayscale()); break;
    case 'sepia':     if (F.Sepia)     list.push(new F.Sepia());     break;
    case 'invert':    if (F.Invert)    list.push(new F.Invert());    break;
    case 'cold':      if (F.ColorMatrix) list.push(new F.ColorMatrix({ matrix:[1,0,0,0,0, 0,1,0,0,0, 0,0,1.4,0,0, 0,0,0,1,0] })); break;
    case 'warm':      if (F.ColorMatrix) list.push(new F.ColorMatrix({ matrix:[1.2,0,0,0,0, 0,1,0,0,0, 0,0,0.8,0,0, 0,0,0,1,0] })); break;
    case 'natural':   if (F.ColorMatrix) list.push(new F.ColorMatrix({ matrix:[1.05,0,0,0,0.05, 0,1.05,0,0,0.05, 0,0,1,0,0, 0,0,0,1,0] })); break;
    case 'vintage':   if (F.ColorMatrix) list.push(new F.ColorMatrix({ matrix:[0.9,0.1,0,0,0, 0.1,0.8,0.1,0,0, 0,0.1,0.9,0,0, 0,0,0,1,0] })); break;
    case 'white':     if (F.Brightness) list.push(new F.Brightness({ brightness: 0.5 })); break;
    case 'black':     if (F.Brightness) list.push(new F.Brightness({ brightness: -0.6 })); break;
  }

  // Slider filters
  if (sliders.brightness !== 0 && F.Brightness) list.push(new F.Brightness({ brightness: sliders.brightness }));
  if (sliders.contrast !== 0 && F.Contrast)     list.push(new F.Contrast({ contrast: sliders.contrast }));
  if (sliders.saturation !== 0 && F.Saturation) list.push(new F.Saturation({ saturation: sliders.saturation }));
  if (sliders.vibrance !== 0 && F.Vibrance)     list.push(new F.Vibrance({ vibrance: sliders.vibrance }));
  if (sliders.blur > 0 && F.BlurFilter)         list.push(new F.BlurFilter({ blur: sliders.blur }));
  if (sliders.noise > 0 && F.Noise)             list.push(new F.Noise({ noise: sliders.noise * 200 }));
  if (sliders.temperature !== 0 && F.ColorMatrix) {
    const t = sliders.temperature;
    list.push(new F.ColorMatrix({ matrix: [1+t*0.2,0,0,0,0, 0,1,0,0,0, 0,0,1-t*0.2,0,0, 0,0,0,1,0] }));
  }
  return list;
}

const defaultSliders = () => Object.fromEntries(FILTER_SLIDERS.map(f => [f.key, f.default]));

const ObjectEffectsPanel: React.FC = () => {
  const { canvas, saveToHistory } = useEditorStore();
  const [obj, setObj] = useState<any>(null);
  const [lutFilter, setLutFilter] = useState('none');
  const [sliders, setSliders] = useState<Record<string, number>>(defaultSliders());
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderW, setBorderW] = useState(0);
  const [cornerR, setCornerR] = useState(0);
  const [shadowColor, setShadowColor] = useState('#00000066');
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowX, setShadowX] = useState(4);
  const [shadowY, setShadowY] = useState(4);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [showShadowPicker, setShowShadowPicker] = useState(false);

  useEffect(() => {
    if (!canvas) return;
    const sync = () => {
      const o = canvas.getActiveObject() as any;
      setObj(o || null);
      if (!o) return;
      setBorderColor(o.stroke || '#000000');
      setBorderW(o.strokeWidth || 0);
      setCornerR(o.rx || o.cornerRadius || 0);
      const sh = o.shadow;
      if (sh) { setShadowColor(sh.color||'#000000'); setShadowBlur(sh.blur||10); setShadowX(sh.offsetX||4); setShadowY(sh.offsetY||4); }
    };
    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', sync);
    return () => { canvas.off('selection:created', sync); canvas.off('selection:updated', sync); canvas.off('selection:cleared', sync); };
  }, [canvas]);

  const applyFilters = (lut: string, sld: Record<string, number>) => {
    if (!obj || !canvas) return;
    const filters = buildFilters(lut, sld);
    obj.filters = filters;
    if (obj.applyFilters) obj.applyFilters();
    canvas.renderAll(); saveToHistory();
  };

  const setLut = (key: string) => { setLutFilter(key); applyFilters(key, sliders); };
  const setSlider = (key: string, val: number) => {
    const newSld = { ...sliders, [key]: val };
    setSliders(newSld); applyFilters(lutFilter, newSld);
  };
  const resetFilters = () => {
    setLutFilter('none'); setSliders(defaultSliders());
    if (!obj || !canvas) return;
    obj.filters = []; if (obj.applyFilters) obj.applyFilters();
    canvas.renderAll(); saveToHistory();
  };

  const applyBorder = () => {
    if (!obj || !canvas) return;
    obj.set({ stroke: borderColor, strokeWidth: borderW });
    canvas.renderAll(); saveToHistory();
  };

  const applyCornerRadius = (v: number) => {
    if (!obj || !canvas) return;
    setCornerR(v); obj.set({ rx: v, ry: v }); canvas.renderAll(); saveToHistory();
  };

  const applyShadow = () => {
    if (!obj || !canvas) return;
    obj.set('shadow', new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowX, offsetY: shadowY }));
    canvas.renderAll(); saveToHistory();
  };
  const removeShadow = () => { if (!obj || !canvas) return; obj.set('shadow', null); canvas.renderAll(); saveToHistory(); };

  if (!obj) return (
    <div className="p-4 text-gray-500 text-sm text-center">Select an element to apply effects.</div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">

      {/* ── LUT / Preset Filters ── */}
      <Section title="Filter Presets" icon="🎨">
        <div className="grid grid-cols-5 gap-1.5">
          {LUT_FILTERS.map(f => (
            <button key={f.key} onClick={() => setLut(f.key)}
              className={`py-2 rounded-lg flex flex-col items-center gap-0.5 text-[9px] font-medium transition-all ${
                lutFilter === f.key ? 'bg-purple-600 text-white' : 'bg-[#0f0f2a] text-gray-400 hover:bg-[#2a2a5a]'
              }`}>
              <span className="text-base">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Adjustment Sliders ── */}
      <Section title="Adjustments" icon="🔧">
        <div className="space-y-2">
          {FILTER_SLIDERS.map(f => (
            <div key={f.key} className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] w-20 shrink-0">{f.label}</span>
              <input type="range" min={f.min} max={f.max} step={f.step} value={sliders[f.key]}
                onChange={e => setSlider(f.key, parseFloat(e.target.value))} className="flex-1" />
              <span className="text-gray-300 text-[9px] w-8 text-right">{sliders[f.key].toFixed(2)}</span>
            </div>
          ))}
          <button onClick={resetFilters} className="mt-1 w-full text-[10px] text-gray-400 hover:text-red-400 py-1 rounded bg-[#0f0f2a] transition-all">
            ↺ Reset all filters
          </button>
        </div>
      </Section>

      {/* ── Border ── */}
      <Section title="Border / Stroke" icon="🟦">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowBorderPicker(p=>!p)}
                className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: borderColor }} />
              {showBorderPicker && (
                <div className="absolute z-50 top-9 left-0">
                  <ColorPicker value={borderColor} onChange={c => { setBorderColor(c); }} />
                </div>
              )}
            </div>
            <span className="text-gray-400 text-[10px]">Color</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[10px] w-12">Width</span>
            <input type="range" min={0} max={40} value={borderW}
              onChange={e => setBorderW(parseInt(e.target.value))} className="flex-1" />
            <span className="text-gray-300 text-[10px] w-4">{borderW}</span>
          </div>
          <button onClick={applyBorder} className="w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium">Apply Border</button>
        </div>
      </Section>

      {/* ── Corner Radius ── */}
      <Section title="Corner Radius" icon="⬛">
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={200} value={cornerR}
            onChange={e => applyCornerRadius(parseInt(e.target.value))} className="flex-1" />
          <span className="text-gray-300 text-xs w-6">{cornerR}</span>
        </div>
      </Section>

      {/* ── Shadow ── */}
      <Section title="Shadow" icon="🌑">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowShadowPicker(p=>!p)}
                className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: shadowColor }} />
              {showShadowPicker && (
                <div className="absolute z-50 top-9 left-0">
                  <ColorPicker value={shadowColor} onChange={c => setShadowColor(c)} />
                </div>
              )}
            </div>
            <span className="text-gray-400 text-[10px]">Shadow Color</span>
          </div>
          {([
            { label:'Blur',min:0,max:80,value:shadowBlur,set:setShadowBlur },
            { label:'X',min:-60,max:60,value:shadowX,set:setShadowX },
            { label:'Y',min:-60,max:60,value:shadowY,set:setShadowY },
          ]).map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] w-8">{s.label}</span>
              <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => s.set(parseInt(e.target.value))} className="flex-1" />
              <span className="text-gray-300 text-[9px] w-6 text-right">{s.value}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={applyShadow} className="flex-1 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium">Apply</button>
            <button onClick={removeShadow} className="px-3 py-1.5 rounded bg-[#0f0f2a] text-gray-400 hover:text-red-400 text-xs">Remove</button>
          </div>
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <span>{icon}</span>{title}
    </h4>
    <div className="bg-[#1a1a3a] rounded-lg p-3 border border-gray-700/30">{children}</div>
  </div>
);

export default ObjectEffectsPanel;
