import React, { useState, useEffect, useCallback } from 'react';
import { useEditorStore, PRODUCT_SIZES, type ProductType, type CanvasSize } from '../../store/editorStore';

type SizeUnit = 'px' | 'pt' | 'mm' | 'cm' | 'inch' | 'feet' | 'meter';

// All conversions go through pixels (at 300 DPI for print)
const DPI = 300;
const unitInfo: Record<SizeUnit, { label: string; toPx: number; decimals: number }> = {
  px:    { label: 'Pixels (px)',       toPx: 1,                         decimals: 0 },
  pt:    { label: 'Points (pt)',       toPx: DPI / 72,                  decimals: 1 },
  mm:    { label: 'Millimeters (mm)',  toPx: DPI / 25.4,               decimals: 1 },
  cm:    { label: 'Centimeters (cm)',  toPx: DPI / 2.54,               decimals: 2 },
  inch:  { label: 'Inches (in)',       toPx: DPI,                       decimals: 2 },
  feet:  { label: 'Feet (ft)',         toPx: DPI * 12,                  decimals: 3 },
  meter: { label: 'Meters (m)',        toPx: DPI / 0.0254,             decimals: 4 },
};

function pxToUnit(px: number, unit: SizeUnit): number {
  return px / unitInfo[unit].toPx;
}
function unitToPx(val: number, unit: SizeUnit): number {
  return val * unitInfo[unit].toPx;
}

const presets: { category: string; sizes: { id: ProductType; label: string; sub: string; icon: string }[] }[] = [
  {
    category: 'Print',
    sizes: [
      { id: 'visiting-card', label: 'Visiting Card', sub: '3.5×2" · 1050×600px', icon: '💳' },
      { id: 'letterhead', label: 'Letterhead A4', sub: '210×297mm · 2480×3508px', icon: '📄' },
      { id: 'brochure', label: 'Brochure A4', sub: '210×297mm · 2480×3508px', icon: '📰' },
      { id: 'flyer', label: 'Flyer', sub: '4.25×6.25" · 1275×1875px', icon: '📋' },
      { id: 'poster', label: 'Poster', sub: '24×36" · 2400×3600px', icon: '🖼️' },
    ]
  },
  {
    category: 'Signage',
    sizes: [
      { id: 'sign-board', label: 'Sign Board', sub: '36×24" · 3600×2400px', icon: '🪧' },
    ]
  },
  {
    category: 'Digital',
    sizes: [
      { id: 'social-media', label: 'Social Media', sub: '1080×1080px', icon: '📱' },
      { id: 'custom', label: 'HD Landscape', sub: '1920×1080px', icon: '🖥️' },
    ]
  },
];

const SizePanel: React.FC = () => {
  const { canvas, productType, setProductType, setCanvasSize, canvasSize, saveToHistory } = useEditorStore();
  const [unit, setUnit] = useState<SizeUnit>('px');
  const [inputW, setInputW] = useState('');
  const [inputH, setInputH] = useState('');

  const formatVal = useCallback((px: number) => {
    const val = pxToUnit(px, unit);
    return val.toFixed(unitInfo[unit].decimals);
  }, [unit]);

  // Sync inputs when canvas size or unit changes
  useEffect(() => {
    setInputW(formatVal(canvasSize.width));
    setInputH(formatVal(canvasSize.height));
  }, [canvasSize, unit, formatVal]);

  const applyPreset = (type: ProductType) => {
    if (!canvas) return;
    const size = PRODUCT_SIZES[type];
    setProductType(type);
    setCanvasSize(size);
    canvas.setDimensions({ width: size.width, height: size.height });
    canvas.renderAll();
    saveToHistory();
  };

  const applyCustomSize = () => {
    if (!canvas) return;
    const wPx = Math.round(unitToPx(parseFloat(inputW) || 100, unit));
    const hPx = Math.round(unitToPx(parseFloat(inputH) || 100, unit));
    if (wPx < 10 || hPx < 10 || wPx > 20000 || hPx > 20000) return;
    const size: CanvasSize = { width: wPx, height: hPx, label: `Custom (${wPx}×${hPx})` };
    setCanvasSize(size);
    canvas.setDimensions({ width: wPx, height: hPx });
    canvas.renderAll();
    saveToHistory();
  };

  const unitSuffix = unit === 'inch' ? 'in' : unit === 'feet' ? 'ft' : unit === 'meter' ? 'm' : unit;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg">Canvas Size</h3>
        <p className="text-gray-500 text-xs mt-1">
          Current: {canvasSize.width}×{canvasSize.height}px
          {unit !== 'px' && (
            <span className="text-purple-400 ml-1">
              ({formatVal(canvasSize.width)}×{formatVal(canvasSize.height)} {unitSuffix})
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Unit Selector */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Unit</h4>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as SizeUnit)}
            className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%239ca3af' viewBox='0 0 20 20'%3E%3Cpath d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
          >
            {(Object.entries(unitInfo) as [SizeUnit, typeof unitInfo[SizeUnit]][]).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
          {unit !== 'px' && (
            <p className="text-gray-600 text-[10px] mt-1">
              Conversion at {DPI} DPI. 1 {unitSuffix} = {unitInfo[unit].toPx.toFixed(2)} px
            </p>
          )}
        </div>

        {/* Custom Size */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Custom Size ({unitSuffix})
          </h4>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-gray-500 text-[10px] block mb-1">Width</label>
              <input
                type="number" value={inputW}
                onChange={(e) => setInputW(e.target.value)}
                className="w-full px-2 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded text-white text-sm text-center"
                step={unit === 'px' ? 1 : 0.1}
              />
            </div>
            <span className="text-gray-500 pb-2 text-sm">×</span>
            <div className="flex-1">
              <label className="text-gray-500 text-[10px] block mb-1">Height</label>
              <input
                type="number" value={inputH}
                onChange={(e) => setInputH(e.target.value)}
                className="w-full px-2 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded text-white text-sm text-center"
                step={unit === 'px' ? 1 : 0.1}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={applyCustomSize}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition-all">
              Apply
            </button>
          </div>
          {unit !== 'px' && (
            <p className="text-gray-600 text-[10px] mt-1.5 text-center">
              = {Math.round(unitToPx(parseFloat(inputW) || 0, unit))} × {Math.round(unitToPx(parseFloat(inputH) || 0, unit))} px
            </p>
          )}
        </div>

        {/* Preset Sizes */}
        {presets.map(group => (
          <div key={group.category}>
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{group.category}</h4>
            <div className="space-y-1.5">
              {group.sizes.map(size => (
                <button key={size.id} onClick={() => applyPreset(size.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    productType === size.id
                      ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300'
                      : 'bg-[#1e1e3a] border border-gray-700/20 text-gray-300 hover:bg-[#2a2a5a] hover:border-gray-600/30'
                  }`}>
                  <span className="text-xl">{size.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{size.label}</p>
                    <p className="text-[10px] text-gray-500">{size.sub}</p>
                  </div>
                  {productType === size.id && <span className="ml-auto text-purple-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizePanel;
