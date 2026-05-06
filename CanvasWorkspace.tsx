import React, { useRef, useEffect, useCallback } from 'react';
import { Canvas, type FabricObject } from 'fabric';
import { useEditorStore } from '../store/editorStore';
import { reattachArcHandlersAfterLoad } from './panels/EffectsPanel';

const CanvasWorkspace: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const {
    canvasSize, zoom, setZoom, setCanvas, setSelectedObjectId, saveToHistory,
    pages, currentPageIndex, switchPage, addPage, duplicatePage, deletePage,
    movePageUp, movePageDown,
  } = useEditorStore();

  // Initialize canvas — runs ONCE, never re-created
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
    });

    const cs = {
      cornerColor: '#7c3aed', cornerStrokeColor: '#fff', cornerSize: 10,
      cornerStyle: 'circle' as const, transparentCorners: false,
      borderColor: '#7c3aed', borderScaleFactor: 2, padding: 5,
    };
    canvas.on('object:added', () => canvas.getObjects().forEach((o: FabricObject) => o.set(cs)));
    canvas.on('selection:created', (e) => { const s = e.selected?.[0]; if (s) setSelectedObjectId((s as any).id || null); });
    canvas.on('selection:updated', (e) => { const s = e.selected?.[0]; if (s) setSelectedObjectId((s as any).id || null); });
    canvas.on('selection:cleared', () => setSelectedObjectId(null));
    canvas.on('object:modified', () => saveToHistory());

    fabricRef.current = canvas;
    setCanvas(canvas);
    setTimeout(() => saveToHistory(), 100);

    // After every page load, re-attach the dbl-click edit handler to arc groups
    // so that switching back to a page with curved text keeps it functional
    const syncLockShim = { current: false };
    const onPageLoaded = () => {
      const c = fabricRef.current;
      if (!c) return;
      reattachArcHandlersAfterLoad(c, syncLockShim);
    };
    window.addEventListener('__pageLoaded', onPageLoaded);

    return () => {
      window.removeEventListener('__pageLoaded', onPageLoaded);
      canvas.dispose();
      fabricRef.current = null;
      setCanvas(null);
    };
  }, []); // eslint-disable-line

  // Update canvas size when product type changes
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    c.setDimensions({ width: canvasSize.width, height: canvasSize.height });
    c.renderAll();
  }, [canvasSize]);

  // Auto-fit zoom
  const calcFitZoom = useCallback(() => {
    if (!containerRef.current) return 0.5;
    const ct = containerRef.current;
    const padding = 80;
    const aw = ct.clientWidth - padding;
    const ah = ct.clientHeight - padding;
    return Math.min(aw / canvasSize.width, ah / canvasSize.height, 1);
  }, [canvasSize]);

  useEffect(() => { setZoom(calcFitZoom()); }, [canvasSize, calcFitZoom, setZoom]);

  useEffect(() => {
    const h = () => setZoom(calcFitZoom());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [calcFitZoom, setZoom]);

  // Ctrl+wheel zoom
  useEffect(() => {
    const ct = containerRef.current;
    if (!ct) return;
    const h = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(zoom + (e.deltaY > 0 ? -0.05 : 0.05));
      }
    };
    ct.addEventListener('wheel', h, { passive: false });
    return () => ct.removeEventListener('wheel', h);
  }, [zoom, setZoom]);

  const zoomPct = Math.round(zoom * 100);
  const ic = 'w-4 h-4';
  const pgBtn = 'p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#1a1a2e]/80 backdrop-blur transition-all';

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* ── Canvas area — single active page centered ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center relative"
        style={{ background: '#2a2a4a' }}
      >
        {/* Page action buttons — top-right corner of canvas area */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#1a1a2e]/90 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-gray-700/40 shadow-lg" style={{ zIndex: 50 }}>
          {/* Move up */}
          {pages.length > 1 && currentPageIndex > 0 && (
            <button onClick={() => movePageUp(currentPageIndex)} title="Move page up" className={pgBtn}>
              <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
          )}
          {/* Move down */}
          {pages.length > 1 && currentPageIndex < pages.length - 1 && (
            <button onClick={() => movePageDown(currentPageIndex)} title="Move page down" className={pgBtn}>
              <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}
          {/* Duplicate */}
          <button onClick={duplicatePage} title="Duplicate page" className={pgBtn}>
            <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          {/* Delete */}
          {pages.length > 1 && (
            <button onClick={() => deletePage(currentPageIndex)} title="Delete current page" className={`${pgBtn} hover:!text-red-400 hover:!bg-red-500/10`}>
              <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
          {/* Add page */}
          <button onClick={addPage} title="Add new page" className={`${pgBtn} hover:!text-green-400 hover:!bg-green-500/10`}>
            <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {/* The canvas */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out',
          }}
        >
          <div className="relative" style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}>
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* ── Zoom — floating pill above page strip ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#1a1a2e]/95 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-700/40 shadow-xl"
        style={{ bottom: 62, zIndex: 60 }}
      >
        <button onClick={() => setZoom(zoom - 0.1)} className="text-gray-400 hover:text-white px-1 rounded transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
        <span className="text-gray-300 text-[11px] w-10 text-center font-mono">{zoomPct}%</span>
        <button onClick={() => setZoom(zoom + 0.1)} className="text-gray-400 hover:text-white px-1 rounded transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 8v6m-3-3h6" />
          </svg>
        </button>
      </div>

      {/* ── Bottom page strip — thumbnails only ── */}
      <div className="h-[50px] bg-[#12122a] border-t border-gray-700/30 flex items-center px-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
          <span className="text-gray-500 text-[10px] font-semibold shrink-0">▶ Pages</span>
          {pages.map((page, i) => (
            <div key={page.id} className="relative group shrink-0">
              <button
                onClick={() => switchPage(i)}
                className={`w-12 h-8 rounded border-2 overflow-hidden transition-all flex items-center justify-center ${
                  i === currentPageIndex
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700/40 hover:border-gray-500'
                }`}
                style={{ backgroundColor: '#1a1a3a' }}
              >
                {page.thumbnail ? (
                  <img src={page.thumbnail} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-gray-500 text-[8px]">{i + 1}</span>
                )}
              </button>
              {/* Delete on hover */}
              {pages.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); deletePage(i); }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  title="Delete page"
                >×</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CanvasWorkspace;
