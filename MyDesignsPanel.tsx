import React, { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';

const MyDesignsPanel: React.FC = () => {
  const { savedDesigns, saveDesign, loadDesign, deleteDesign } = useEditorStore();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('prodesigner_designs');
      if (stored) {
        const designs = JSON.parse(stored);
        useEditorStore.setState({ savedDesigns: designs });
      }
    } catch (_e) { /* ignore */ }
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-3">My Designs</h3>
        <button
          onClick={saveDesign}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Save Current Design
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {savedDesigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📁</div>
            <p className="text-gray-400 text-sm font-medium">No saved designs</p>
            <p className="text-gray-600 text-xs mt-1">Save your work to access it later</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedDesigns.map((design) => (
              <div
                key={design.id}
                className="rounded-lg overflow-hidden border border-gray-700/30 hover:border-purple-500/50 transition-all group bg-[#1e1e3a]"
              >
                <button
                  onClick={() => loadDesign(design.id)}
                  className="w-full aspect-[4/3] bg-[#0f0f2a] flex items-center justify-center overflow-hidden"
                >
                  {design.thumbnail ? (
                    <img src={design.thumbnail} alt={design.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl">📄</span>
                  )}
                </button>
                <div className="p-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{design.name}</p>
                    <p className="text-gray-500 text-[10px]">{design.date}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDesign(design.id); }}
                    className="text-gray-500 hover:text-red-400 text-xs p-1 shrink-0"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDesignsPanel;
