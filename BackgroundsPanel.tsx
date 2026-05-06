import React, { useState } from 'react';
import { Gradient } from 'fabric';
import { useEditorStore } from '../../store/editorStore';

const solidColors = [
  '#ffffff','#f8fafc','#f1f5f9','#e2e8f0','#cbd5e1','#94a3b8','#64748b','#475569','#334155','#1e293b','#0f172a','#000000',
  '#fef2f2','#fee2e2','#fecaca','#fca5a5','#f87171','#ef4444','#dc2626','#b91c1c','#991b1b','#7f1d1d',
  '#fffbeb','#fef3c7','#fde68a','#fcd34d','#fbbf24','#f59e0b','#d97706','#b45309','#92400e','#78350f',
  '#f0fdf4','#dcfce7','#bbf7d0','#86efac','#4ade80','#22c55e','#16a34a','#15803d','#166534','#14532d',
  '#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a',
  '#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7e22ce','#6b21a8','#581c87',
  '#fdf2f8','#fce7f3','#fbcfe8','#f9a8d4','#f472b6','#ec4899','#db2777','#be185d','#9d174d','#831843',
];

const gradientPresets = [
  { name: 'Sunset', c1: '#f43f5e', c2: '#f59e0b' },
  { name: 'Ocean', c1: '#0ea5e9', c2: '#6366f1' },
  { name: 'Forest', c1: '#10b981', c2: '#064e3b' },
  { name: 'Purple Haze', c1: '#7c3aed', c2: '#ec4899' },
  { name: 'Night Sky', c1: '#1e1b4b', c2: '#312e81' },
  { name: 'Fire', c1: '#dc2626', c2: '#f59e0b' },
  { name: 'Mint', c1: '#6ee7b7', c2: '#3b82f6' },
  { name: 'Coral', c1: '#fb7185', c2: '#fbbf24' },
  { name: 'Midnight', c1: '#0f172a', c2: '#334155' },
  { name: 'Lavender', c1: '#c084fc', c2: '#f9a8d4' },
  { name: 'Dark Blue', c1: '#1e3a8a', c2: '#0f172a' },
  { name: 'Gold', c1: '#d4a853', c2: '#78350f' },
  { name: 'Aurora', c1: '#06b6d4', c2: '#a855f7' },
  { name: 'Cherry', c1: '#be123c', c2: '#7f1d1d' },
  { name: 'Aqua', c1: '#0d9488', c2: '#0284c7' },
];

type GradDir = 'to-b' | 'to-r' | 'to-br' | 'to-bl';
const gradDirCoords: Record<GradDir, { x1: number; y1: number; x2: number; y2: number }> = {
  'to-b':  { x1: 0, y1: 0, x2: 0, y2: 1 },
  'to-r':  { x1: 0, y1: 0, x2: 1, y2: 0 },
  'to-br': { x1: 0, y1: 0, x2: 1, y2: 1 },
  'to-bl': { x1: 1, y1: 0, x2: 0, y2: 1 },
};

const BackgroundsPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const [customColor, setCustomColor] = useState('#ffffff');
  const [gradMode, setGradMode] = useState(false);
  const [gradColor1, setGradColor1] = useState('#7c3aed');
  const [gradColor2, setGradColor2] = useState('#ec4899');
  const [gradDir, setGradDir] = useState<GradDir>('to-br');
  const [target, setTarget] = useState<'canvas' | 'object'>('canvas');

  const applySolidColor = (color: string) => {
    if (!canvas) return;
    if (target === 'object') {
      const active = canvas.getActiveObject();
      if (active) {
        active.set('fill', color);
        canvas.renderAll();
        saveToHistory();
        return;
      }
    }
    canvas.backgroundColor = color;
    canvas.renderAll();
    saveToHistory();
  };

  const applyGradientToCanvas = (c1: string, c2: string, dir: GradDir) => {
    if (!canvas) return;
    const coords = gradDirCoords[dir];
    const gradient = new Gradient({
      type: 'linear',
      coords: {
        x1: coords.x1 * canvasSize.width,
        y1: coords.y1 * canvasSize.height,
        x2: coords.x2 * canvasSize.width,
        y2: coords.y2 * canvasSize.height,
      },
      colorStops: [
        { offset: 0, color: c1 },
        { offset: 1, color: c2 },
      ],
    });

    if (target === 'object') {
      const active = canvas.getActiveObject();
      if (active) {
        const objGrad = new Gradient({
          type: 'linear',
          coords: {
            x1: 0,
            y1: 0,
            x2: coords.x1 !== coords.x2 ? (active.width || 100) : 0,
            y2: coords.y1 !== coords.y2 ? (active.height || 100) : 0,
          },
          colorStops: [
            { offset: 0, color: c1 },
            { offset: 1, color: c2 },
          ],
        });
        active.set('fill', objGrad);
        canvas.renderAll();
        saveToHistory();
        return;
      }
    }

    // Apply to canvas background
    canvas.backgroundColor = gradient as any;
    canvas.renderAll();
    saveToHistory();
  };

  const cssBg = (c1: string, c2: string, dir: GradDir) => {
    const map: Record<GradDir, string> = { 'to-b': '180deg', 'to-r': '90deg', 'to-br': '135deg', 'to-bl': '225deg' };
    return `linear-gradient(${map[dir]}, ${c1}, ${c2})`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-2">Background & Fill</h3>
        {/* Target selector */}
        <div className="flex gap-1.5 mb-3">
          <button onClick={() => setTarget('canvas')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${target === 'canvas' ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400'}`}>
            Canvas BG
          </button>
          <button onClick={() => setTarget('object')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${target === 'object' ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400'}`}>
            Selected Object
          </button>
        </div>
        {/* Mode tabs */}
        <div className="flex gap-1.5">
          <button onClick={() => setGradMode(false)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${!gradMode ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400'}`}>
            Solid Color
          </button>
          <button onClick={() => setGradMode(true)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${gradMode ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400'}`}>
            Gradient
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {!gradMode ? (
          <>
            {/* Custom color picker */}
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Custom Color</h4>
              <div className="flex gap-2 items-center">
                <input type="color" value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); applySolidColor(e.target.value); }}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                <input type="text" value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applySolidColor(e.target.value); }}
                  className="flex-1 px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded text-white text-sm font-mono" />
              </div>
            </div>

            {/* Swatches */}
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Solid Colors</h4>
              <div className="grid grid-cols-8 gap-1.5">
                {solidColors.map((c, i) => (
                  <button key={i} onClick={() => { setCustomColor(c); applySolidColor(c); }}
                    className="w-full aspect-square rounded-md border border-gray-600/20 hover:border-purple-500 transition-all hover:scale-110"
                    style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Gradient builder */}
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Gradient Builder</h4>
              <div className="flex gap-2 items-center mb-3">
                <div className="flex-1">
                  <label className="text-gray-500 text-[9px] block mb-1">Color 1</label>
                  <input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
                </div>
                <div className="flex-1">
                  <label className="text-gray-500 text-[9px] block mb-1">Color 2</label>
                  <input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
                </div>
              </div>

              {/* Direction */}
              <label className="text-gray-500 text-[9px] block mb-1.5">Direction</label>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {([
                  { d: 'to-b' as GradDir, label: '↓' },
                  { d: 'to-r' as GradDir, label: '→' },
                  { d: 'to-br' as GradDir, label: '↘' },
                  { d: 'to-bl' as GradDir, label: '↙' },
                ]).map(item => (
                  <button key={item.d} onClick={() => setGradDir(item.d)}
                    className={`py-2 rounded-lg text-sm transition-all ${gradDir === item.d ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400 hover:bg-[#2a2a5a]'}`}>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Preview + apply */}
              <div className="h-16 rounded-lg mb-3 border border-gray-700/30" style={{ background: cssBg(gradColor1, gradColor2, gradDir) }} />
              <button onClick={() => applyGradientToCanvas(gradColor1, gradColor2, gradDir)}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium transition-all">
                Apply Gradient
              </button>
            </div>

            {/* Gradient Presets */}
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Presets</h4>
              <div className="grid grid-cols-3 gap-2">
                {gradientPresets.map((g, i) => (
                  <button key={i}
                    onClick={() => {
                      setGradColor1(g.c1);
                      setGradColor2(g.c2);
                      applyGradientToCanvas(g.c1, g.c2, gradDir);
                    }}
                    className="aspect-[4/3] rounded-lg border border-gray-700/30 hover:border-purple-500 transition-all hover:scale-105 overflow-hidden flex items-end p-1"
                    style={{ background: `linear-gradient(135deg, ${g.c1}, ${g.c2})` }}>
                    <span className="text-white/80 text-[8px] font-medium drop-shadow-md">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BackgroundsPanel;
