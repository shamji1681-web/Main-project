import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  index: number;
}

const LayersPanel: React.FC = () => {
  const { canvas, saveToHistory } = useEditorStore();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [, setRefresh] = useState(0);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects();
      const layerList: LayerItem[] = objects.map((obj, i) => ({
        id: (obj as any).id || `obj-${i}`,
        name: (obj as any).name || obj.type || 'Object',
        type: obj.type || 'unknown',
        visible: obj.visible !== false,
        locked: !obj.selectable,
        index: i,
      })).reverse(); // Reverse so top layer is first
      setLayers(layerList);
    };

    updateLayers();
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    canvas.on('selection:created', () => setRefresh(r => r + 1));
    canvas.on('selection:updated', () => setRefresh(r => r + 1));
    canvas.on('selection:cleared', () => setRefresh(r => r + 1));

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
    };
  }, [canvas]);

  const selectLayer = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj && obj.selectable) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };

  const toggleVisibility = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      obj.visible = !obj.visible;
      canvas.renderAll();
      setRefresh(r => r + 1);
      saveToHistory();
    }
  };

  const toggleLock = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      obj.selectable = !obj.selectable;
      obj.evented = obj.selectable;
      if (!obj.selectable) {
        canvas.discardActiveObject();
      }
      canvas.renderAll();
      setRefresh(r => r + 1);
      saveToHistory();
    }
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (!obj) return;
    
    if (direction === 'up') {
      canvas.bringObjectForward(obj);
    } else {
      canvas.sendObjectBackwards(obj);
    }
    canvas.renderAll();
    setRefresh(r => r + 1);
    saveToHistory();
  };

  const deleteLayer = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
      saveToHistory();
    }
  };

  const duplicateLayer = (layerId: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).id === layerId);
    if (obj) {
      obj.clone().then((cloned: any) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        cloned.id = `${layerId}-copy-${Date.now()}`;
        cloned.name = `${(obj as any).name || 'Object'} Copy`;
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        saveToHistory();
      });
    }
  };

  const activeObj = canvas?.getActiveObject();
  const activeId = activeObj ? (activeObj as any).id : null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'textbox': case 'text': case 'i-text': return '📝';
      case 'rect': return '⬜';
      case 'circle': return '⭕';
      case 'triangle': return '🔺';
      case 'polygon': return '⬡';
      case 'image': return '🖼️';
      case 'line': return '➖';
      case 'ellipse': return '⬮';
      default: return '📦';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg">Layers</h3>
        <p className="text-gray-500 text-xs mt-1">{layers.length} layers</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No layers yet. Add elements to your design.
          </div>
        ) : (
          <div className="py-1">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all border-l-2 ${
                  activeId === layer.id
                    ? 'bg-purple-500/10 border-purple-500'
                    : 'border-transparent hover:bg-[#1e1e3a]'
                }`}
                onClick={() => selectLayer(layer.id)}
              >
                <span className="text-sm">{getTypeIcon(layer.type)}</span>
                <span className={`flex-1 text-sm truncate ${
                  layer.visible ? 'text-gray-300' : 'text-gray-600'
                } ${layer.locked ? 'italic' : ''}`}>
                  {layer.name}
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                    className={`p-1 rounded text-xs transition-colors ${
                      layer.visible ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-400'
                    }`}
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                    className={`p-1 rounded text-xs transition-colors ${
                      layer.locked ? 'text-yellow-500' : 'text-gray-400 hover:text-white'
                    }`}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                </div>

                {/* Layer actions on hover */}
                {activeId === layer.id && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                      className="p-1 text-gray-400 hover:text-white text-xs"
                      title="Move up"
                    >▲</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                      className="p-1 text-gray-400 hover:text-white text-xs"
                      title="Move down"
                    >▼</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                      className="p-1 text-gray-400 hover:text-white text-xs"
                      title="Duplicate"
                    >📋</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                      className="p-1 text-gray-400 hover:text-red-400 text-xs"
                      title="Delete"
                    >🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
