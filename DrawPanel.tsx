import React, { useState, useEffect } from 'react';
import { PencilBrush, CircleBrush, SprayBrush } from 'fabric';
import { useEditorStore } from '../../store/editorStore';

const colors = [
  '#000000','#ffffff','#ef4444','#f97316','#f59e0b','#22c55e',
  '#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7',
  '#d946ef','#ec4899','#f43f5e','#64748b','#1e293b','#0f172a',
];

const DrawPanel: React.FC = () => {
  const { canvas, saveToHistory } = useEditorStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState<'pencil' | 'circle' | 'spray'>('pencil');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(4);

  useEffect(() => {
    if (!canvas) return;
    if (isDrawing) {
      canvas.isDrawingMode = true;
      let brush;
      switch (brushType) {
        case 'circle':
          brush = new CircleBrush(canvas);
          break;
        case 'spray':
          brush = new SprayBrush(canvas);
          break;
        default:
          brush = new PencilBrush(canvas);
      }
      brush.color = brushColor;
      brush.width = brushWidth;
      canvas.freeDrawingBrush = brush;
    } else {
      canvas.isDrawingMode = false;
    }
    return () => {
      if (canvas) canvas.isDrawingMode = false;
    };
  }, [canvas, isDrawing, brushType, brushColor, brushWidth]);

  // Save after drawing path is added
  useEffect(() => {
    if (!canvas) return;
    const onPathCreated = () => saveToHistory();
    canvas.on('path:created', onPathCreated);
    return () => { canvas.off('path:created', onPathCreated); };
  }, [canvas, saveToHistory]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg">Draw</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Toggle Drawing */}
        <button
          onClick={() => setIsDrawing(!isDrawing)}
          className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            isDrawing
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
          }`}
        >
          {isDrawing ? (
            <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Stop Drawing</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Start Drawing</>
          )}
        </button>

        {isDrawing && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
            <p className="text-purple-300 text-xs">✏️ Drawing mode active — draw on the canvas!</p>
          </div>
        )}

        {/* Brush Type */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Brush Type</h4>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'pencil' as const, label: 'Pencil', icon: '✏️' },
              { id: 'circle' as const, label: 'Circle', icon: '⭕' },
              { id: 'spray' as const, label: 'Spray', icon: '💨' },
            ]).map(b => (
              <button
                key={b.id}
                onClick={() => setBrushType(b.id)}
                className={`py-2.5 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  brushType === b.id ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400 hover:bg-[#2a2a5a]'
                }`}
              >
                <span className="text-lg">{b.icon}</span>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brush Width */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Brush Size: {brushWidth}px</h4>
          <input
            type="range"
            min={1}
            max={80}
            value={brushWidth}
            onChange={(e) => setBrushWidth(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            {[2, 5, 10, 20, 40].map(s => (
              <button
                key={s}
                onClick={() => setBrushWidth(s)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${brushWidth === s ? 'bg-purple-600' : 'bg-[#1e1e3a] hover:bg-[#2a2a5a]'}`}
              >
                <div className="rounded-full bg-white" style={{ width: Math.min(s, 20), height: Math.min(s, 20) }} />
              </button>
            ))}
          </div>
        </div>

        {/* Brush Color */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Brush Color</h4>
          <div className="flex gap-2 items-center mb-2">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-gray-300 text-xs font-mono">{brushColor}</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {colors.map((c, i) => (
              <button
                key={i}
                onClick={() => setBrushColor(c)}
                className={`w-full aspect-square rounded-md border-2 transition-all hover:scale-110 ${
                  brushColor === c ? 'border-purple-400 scale-110' : 'border-gray-700/20'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawPanel;
