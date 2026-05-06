import React, { useState, useEffect } from 'react';
import { Shadow } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import ColorPicker from '../ColorPicker';

const TextEffectsPanel: React.FC = () => {
  const { canvas, saveToHistory } = useEditorStore();
  const [obj, setObj] = useState<any>(null);

  // ── local state mirrors ────────────────────────────────────────────────────
  const [blurVal, setBlurVal]         = useState(0);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeW, setStrokeW]         = useState(0);
  const [bgColor, setBgColor]         = useState('transparent');
  const [bgPad, setBgPad]             = useState(4);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur]   = useState(10);
  const [shadowX, setShadowX]         = useState(4);
  const [shadowY, setShadowY]         = useState(4);
  const [curveAngle, setCurveAngle]   = useState(0);

  const [showBgPicker, setShowBgPicker]     = useState(false);
  const [showShadowPicker, setShowShadowPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  useEffect(() => {
    if (!canvas) return;
    const sync = () => {
      const o = canvas.getActiveObject() as any;
      const isText = o && (o.type === 'textbox' || o.type === 'text' || o.type === 'i-text');
      setObj(isText ? o : null);
      if (!isText) return;
      setStrokeColor(o.stroke || '#000000');
      setStrokeW(o.strokeWidth || 0);
      setBgColor(o.textBackgroundColor || 'transparent');
      const sh = o.shadow;
      if (sh) { setShadowColor(sh.color||'#000000'); setShadowBlur(sh.blur||10); setShadowX(sh.offsetX||4); setShadowY(sh.offsetY||4); }
    };
    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', sync);
    return () => { canvas.off('selection:created', sync); canvas.off('selection:updated', sync); canvas.off('selection:cleared', sync); };
  }, [canvas]);

  const apply = (props: Record<string, any>) => {
    if (!obj || !canvas) return;
    Object.entries(props).forEach(([k, v]) => obj.set(k, v));
    canvas.renderAll(); saveToHistory();
  };

  const applyBlur = (v: number) => {
    if (!obj || !canvas) return;
    setBlurVal(v);
    if (v === 0) { obj.set('filters', []); }
    else {
      const { filters: { BlurFilter } } = require('fabric') as any;
      if (BlurFilter) {
        obj.filters = [new BlurFilter({ blur: v / 100 })];
      }
    }
    if (obj.applyFilters) obj.applyFilters();
    canvas.renderAll(); saveToHistory();
  };

  const applyShadow = () => {
    if (!obj || !canvas) return;
    const sh = new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowX, offsetY: shadowY });
    obj.set('shadow', sh); canvas.renderAll(); saveToHistory();
  };

  const removeShadow = () => { if (!obj || !canvas) return; obj.set('shadow', null); canvas.renderAll(); saveToHistory(); };

  if (!obj) return (
    <div className="p-4 text-gray-500 text-sm text-center">Select a text element to apply effects.</div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">

      {/* ── Blur ── */}
      <Section title="Blur" icon="💧">
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={40} value={blurVal}
            onChange={e => applyBlur(parseInt(e.target.value))} className="flex-1" />
          <span className="text-gray-300 text-xs w-6">{blurVal}</span>
        </div>
      </Section>

      {/* ── Curved Text ── */}
      <Section title="Curved Text" icon="🌀">
        <p className="text-gray-500 text-[10px] mb-2">Rotation simulates curve. Use angle to curve text direction.</p>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[10px]">Curve</span>
          <input type="range" min={-180} max={180} value={curveAngle}
            onChange={e => { const a = parseInt(e.target.value); setCurveAngle(a); apply({ angle: a }); }} className="flex-1" />
          <span className="text-gray-300 text-xs w-8">{curveAngle}°</span>
        </div>
      </Section>

      {/* ── Text Stroke ── */}
      <Section title="Text Stroke" icon="✏️">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <button onClick={() => setShowStrokePicker(p => !p)}
              className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: strokeColor }} />
            {showStrokePicker && (
              <div className="absolute z-50 top-9 left-0">
                <ColorPicker value={strokeColor} onChange={c => { setStrokeColor(c); apply({ stroke: c }); }} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="text-gray-400 text-[10px] block mb-1">Width</label>
            <input type="range" min={0} max={20} value={strokeW}
              onChange={e => { const v=parseInt(e.target.value); setStrokeW(v); apply({ stroke: strokeColor, strokeWidth: v }); }} className="w-full" />
          </div>
          <span className="text-gray-300 text-xs w-4">{strokeW}</span>
        </div>
      </Section>

      {/* ── Background Color ── */}
      <Section title="Text Background" icon="🎨">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <button onClick={() => setShowBgPicker(p => !p)}
              className="w-8 h-8 rounded border border-gray-600 flex items-center justify-center text-[9px]"
              style={{ backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor }}>
              {bgColor === 'transparent' ? <span className="text-gray-500">✕</span> : null}
            </button>
            {showBgPicker && (
              <div className="absolute z-50 top-9 left-0">
                <ColorPicker value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                  onChange={c => { setBgColor(c); apply({ textBackgroundColor: c }); }} />
              </div>
            )}
          </div>
          <button onClick={() => { setBgColor('transparent'); apply({ textBackgroundColor: '' }); }}
            className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded bg-[#1e1e3a]">Remove</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[10px]">Padding</span>
          <input type="range" min={0} max={30} value={bgPad}
            onChange={e => { const v=parseInt(e.target.value); setBgPad(v); apply({ padding: v }); }} className="flex-1" />
          <span className="text-gray-300 text-xs w-4">{bgPad}</span>
        </div>
      </Section>

      {/* ── Shadow ── */}
      <Section title="Shadow" icon="🌑">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowShadowPicker(p => !p)}
                className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: shadowColor }} />
              {showShadowPicker && (
                <div className="absolute z-50 top-9 left-0">
                  <ColorPicker value={shadowColor} onChange={c => { setShadowColor(c); }} />
                </div>
              )}
            </div>
            <span className="text-gray-400 text-[10px]">Color</span>
          </div>
          <Slider label="Blur" min={0} max={60} value={shadowBlur} onChange={v => setShadowBlur(v)} />
          <Slider label="X" min={-50} max={50} value={shadowX} onChange={v => setShadowX(v)} />
          <Slider label="Y" min={-50} max={50} value={shadowY} onChange={v => setShadowY(v)} />
          <div className="flex gap-2 mt-2">
            <button onClick={applyShadow} className="flex-1 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium">Apply Shadow</button>
            <button onClick={removeShadow} className="px-3 py-1.5 rounded bg-[#1e1e3a] text-gray-400 hover:text-red-400 text-xs">Remove</button>
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
    <div className="bg-[#1e1e3a] rounded-lg p-3 border border-gray-700/30">
      {children}
    </div>
  </div>
);

const Slider: React.FC<{ label: string; min: number; max: number; value: number; onChange: (v: number) => void }> = ({ label, min, max, value, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400 text-[10px] w-8">{label}</span>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))} className="flex-1" />
    <span className="text-gray-300 text-[10px] w-8 text-right">{value}</span>
  </div>
);

export default TextEffectsPanel;
