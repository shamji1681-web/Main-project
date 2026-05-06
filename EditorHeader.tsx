import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

const EditorHeader: React.FC = () => {
  const {
    canvas, designName, setDesignName, saveToHistory,
  } = useEditorStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleExportPNG = () => { if (!canvas) return; canvas.discardActiveObject(); canvas.renderAll(); const d=canvas.toDataURL({format:'png',quality:1,multiplier:2}); const l=document.createElement('a'); l.download=`${designName}.png`; l.href=d; l.click(); };
  const handleExportJPG = () => { if (!canvas) return; canvas.discardActiveObject(); canvas.renderAll(); const d=canvas.toDataURL({format:'jpeg',quality:0.9,multiplier:2}); const l=document.createElement('a'); l.download=`${designName}.jpg`; l.href=d; l.click(); };
  const handleExportSVG = () => { if (!canvas) return; canvas.discardActiveObject(); canvas.renderAll(); const s=canvas.toSVG(); const b=new Blob([s],{type:'image/svg+xml'}); const u=URL.createObjectURL(b); const l=document.createElement('a'); l.download=`${designName}.svg`; l.href=u; l.click(); URL.revokeObjectURL(u); };
  const handleExportJSON = () => { if (!canvas) return; const j=JSON.stringify(canvas.toJSON(),null,2); const b=new Blob([j],{type:'application/json'}); const u=URL.createObjectURL(b); const l=document.createElement('a'); l.download=`${designName}.json`; l.href=u; l.click(); URL.revokeObjectURL(u); };
  const handleImportJSON = () => { const inp=document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange=(e)=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(!f||!canvas)return; const r=new FileReader(); r.onload=(ev)=>{ try{ const d=JSON.parse(ev.target?.result as string); canvas.loadFromJSON(d).then(()=>{canvas.renderAll();saveToHistory();}); }catch(_e){} }; r.readAsText(f); }; inp.click(); };

  return (
    <header className="h-12 bg-[#12122a] border-b border-gray-700/30 flex items-center justify-between px-4 select-none shrink-0">
      {/* Left: Logo + Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="text-white font-bold text-base hidden lg:block">ProDesigner</span>
        </div>

        <div className="w-px h-6 bg-gray-700/50 shrink-0" />

        {isEditingName ? (
          <input ref={nameInputRef} value={designName}
            onChange={e => setDesignName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
            className="bg-[#1e1e3a] text-white px-2 py-1 rounded text-sm border border-purple-500 outline-none w-40"
            autoFocus />
        ) : (
          <button onClick={() => setIsEditingName(true)}
            className="text-gray-300 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors truncate max-w-[200px]">
            {designName}
            <span className="text-gray-600 text-[10px] shrink-0">✏️</span>
          </button>
        )}
      </div>

      {/* Right: Import + Download */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={handleImportJSON}
          className="text-gray-400 hover:text-white text-[11px] px-2 py-1.5 rounded hover:bg-[#2a2a5a] transition-all border border-gray-700/30 hidden md:block">
          Import
        </button>

        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">Download</span>
            <span className="text-[10px] opacity-75">▼</span>
          </button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 bg-[#1e1e3a] rounded-lg shadow-xl border border-gray-700/50 w-48 py-1" style={{zIndex:99999}}>
              <button onClick={() => { handleExportPNG(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a5a] transition-all flex items-center gap-2"><span className="text-green-400">PNG</span> High Quality</button>
              <button onClick={() => { handleExportJPG(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a5a] transition-all flex items-center gap-2"><span className="text-blue-400">JPG</span> Compressed</button>
              <button onClick={() => { handleExportSVG(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a5a] transition-all flex items-center gap-2"><span className="text-orange-400">SVG</span> Vector</button>
              <div className="border-t border-gray-700/50 my-1" />
              <button onClick={() => { handleExportJSON(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a5a] transition-all flex items-center gap-2"><span className="text-purple-400">JSON</span> Project File</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default EditorHeader;
