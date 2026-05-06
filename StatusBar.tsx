import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

const StatusBar: React.FC = () => {
  const { canvas, canvasSize, zoom, productType, pages, currentPageIndex } = useEditorStore();
  const [objectCount, setObjectCount] = useState(0);
  const [selectedInfo, setSelectedInfo] = useState('');

  useEffect(() => {
    if (!canvas) return;
    const update = () => {
      setObjectCount(canvas.getObjects().length);
      const active = canvas.getActiveObject();
      if (active) {
        const w = Math.round(active.getScaledWidth());
        const h = Math.round(active.getScaledHeight());
        const x = Math.round(active.left || 0);
        const y = Math.round(active.top || 0);
        setSelectedInfo(`${active.type} | ${w}×${h}px | Pos: ${x}, ${y}`);
      } else {
        setSelectedInfo('');
      }
    };
    canvas.on('selection:created', update);
    canvas.on('selection:updated', update);
    canvas.on('selection:cleared', update);
    canvas.on('object:modified', update);
    canvas.on('object:moving', update);
    canvas.on('object:scaling', update);
    canvas.on('object:added', update);
    canvas.on('object:removed', update);
    return () => {
      canvas.off('selection:created', update);
      canvas.off('selection:updated', update);
      canvas.off('selection:cleared', update);
      canvas.off('object:modified', update);
      canvas.off('object:moving', update);
      canvas.off('object:scaling', update);
      canvas.off('object:added', update);
      canvas.off('object:removed', update);
    };
  }, [canvas]);

  return (
    <div className="h-6 bg-[#0f0f2a] border-t border-gray-800/50 flex items-center justify-between px-4 text-[10px] text-gray-500 select-none shrink-0">
      <div className="flex items-center gap-4">
        <span>{productType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        <span>{canvasSize.width} × {canvasSize.height}px</span>
        <span>{objectCount} objects</span>
        <span>Page {currentPageIndex + 1}/{pages.length}</span>
      </div>
      <div className="flex items-center gap-4">
        {selectedInfo && <span className="text-purple-400">{selectedInfo}</span>}
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default StatusBar;
