import { create } from 'zustand';
import type { Canvas as FabricCanvas } from 'fabric';

export type ProductType = 'visiting-card' | 'letterhead' | 'brochure' | 'sign-board' | 'poster' | 'flyer' | 'social-media' | 'custom';
export type PanelType = 'mydesigns' | 'templates' | 'text' | 'photos' | 'icons' | 'shapes' | 'draw' | 'uploads' | 'backgrounds' | 'layers' | 'size' | 'quotes' | 'qrcode' | 'aiimg' | 'effects' | null;

export interface CanvasSize {
  width: number;
  height: number;
  label: string;
}

export const PRODUCT_SIZES: Record<ProductType, CanvasSize> = {
  'visiting-card': { width: 1050, height: 600, label: 'Visiting Card (3.5×2")' },
  'letterhead': { width: 2480, height: 3508, label: 'Letterhead (A4)' },
  'brochure': { width: 2480, height: 3508, label: 'Brochure (A4)' },
  'sign-board': { width: 3600, height: 2400, label: 'Sign Board (36×24")' },
  'poster': { width: 2400, height: 3600, label: 'Poster (24×36")' },
  'flyer': { width: 1275, height: 1875, label: 'Flyer (4.25×6.25")' },
  'social-media': { width: 1080, height: 1080, label: 'Social Media (1080×1080)' },
  'custom': { width: 1920, height: 1080, label: 'Custom (1920×1080)' },
};

interface HistoryEntry {
  json: string;
  timestamp: number;
}

export interface PageData {
  id: string;
  name: string;
  json: string;
  thumbnail: string;
}

interface EditorState {
  canvas: FabricCanvas | null;
  activePanel: PanelType;
  productType: ProductType;
  canvasSize: CanvasSize;
  zoom: number;
  selectedObjectId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  designName: string;
  isLoadingHistory: boolean;

  // Multi-page
  pages: PageData[];
  currentPageIndex: number;

  // Saved designs
  savedDesigns: { id: string; name: string; json: string; thumbnail: string; date: string }[];

  setCanvas: (canvas: FabricCanvas | null) => void;
  setActivePanel: (panel: PanelType) => void;
  setProductType: (type: ProductType) => void;
  setCanvasSize: (size: CanvasSize) => void;
  setZoom: (zoom: number) => void;
  setSelectedObjectId: (id: string | null) => void;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setDesignName: (name: string) => void;

  // Page actions
  addPage: () => void;
  duplicatePage: () => void;
  deletePage: (index: number) => void;
  switchPage: (index: number) => void;
  updateCurrentPageData: () => void;
  movePageUp: (index: number) => void;
  movePageDown: (index: number) => void;

  // Design actions
  saveDesign: () => void;
  loadDesign: (id: string) => void;
  deleteDesign: (id: string) => void;
}

let pageCounter = 1;

// Custom properties that must persist across page switches and serialization.
// Fabric strips unknown props by default — this list tells toObject() to keep them.
export const EXTRA_PROPS = [
  'id', 'name', '__uid',
  // Curved-text owner textbox flags
  '__curvePower', '__curveBlurPx', '__curveStrokeColor', '__curveStrokeWidth',
  '__curveShadow', '__curveBgColor', '__curveBgOpacity', '__curveBgPad',
  // Arc group flags
  '__isArcGroup', '__arcOwnerId',
];

export const useEditorStore = create<EditorState>((set, get) => ({
  canvas: null,
  activePanel: 'templates',
  productType: 'visiting-card',
  canvasSize: PRODUCT_SIZES['visiting-card'],
  zoom: 1,
  selectedObjectId: null,
  history: [],
  historyIndex: -1,
  designName: 'Untitled Design',
  isLoadingHistory: false,
  pages: [{ id: 'page-1', name: 'Page 1', json: '', thumbnail: '' }],
  currentPageIndex: 0,
  savedDesigns: [],

  setCanvas: (canvas: FabricCanvas | null) => set({ canvas }),

  setActivePanel: (panel: PanelType) => set((state) => ({
    activePanel: state.activePanel === panel ? null : panel
  })),

  setProductType: (type: ProductType) => {
    const size = PRODUCT_SIZES[type];
    set({ productType: type, canvasSize: size });
  },

  setCanvasSize: (size: CanvasSize) => set({ canvasSize: size }),
  setZoom: (zoom: number) => set({ zoom: Math.max(0.05, Math.min(5, zoom)) }),
  setSelectedObjectId: (id: string | null) => set({ selectedObjectId: id }),

  saveToHistory: () => {
    const { canvas, history, historyIndex, isLoadingHistory } = get();
    if (!canvas || isLoadingHistory) return;
    const json = JSON.stringify(canvas.toObject(EXTRA_PROPS));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ json, timestamp: Date.now() });
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { historyIndex, history, canvas } = get();
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1;
      set({ isLoadingHistory: true });
      const jsonData: Record<string, unknown> = JSON.parse(history[newIndex].json);
      canvas.loadFromJSON(jsonData).then(() => {
        canvas.renderAll();
        set({ historyIndex: newIndex, isLoadingHistory: false });
      });
    }
  },

  redo: () => {
    const { historyIndex, history, canvas } = get();
    if (historyIndex < history.length - 1 && canvas) {
      const newIndex = historyIndex + 1;
      set({ isLoadingHistory: true });
      const jsonData: Record<string, unknown> = JSON.parse(history[newIndex].json);
      canvas.loadFromJSON(jsonData).then(() => {
        canvas.renderAll();
        set({ historyIndex: newIndex, isLoadingHistory: false });
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
  setDesignName: (name: string) => set({ designName: name }),

  // --- Multi-Page ---
  updateCurrentPageData: () => {
    const { canvas, pages, currentPageIndex } = get();
    if (!canvas) return;
    const json = JSON.stringify(canvas.toObject(EXTRA_PROPS));
    let thumbnail = '';
    try { thumbnail = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.15 }); } catch (_e) { /* ignore */ }
    const updated = [...pages];
    updated[currentPageIndex] = { ...updated[currentPageIndex], json, thumbnail };
    set({ pages: updated }, false); // false = don't replace, just merge
  },

  addPage: () => {
    const { canvas, pages, currentPageIndex } = get();
    if (!canvas) return;
    // Capture current page data BEFORE clearing
    const currentJson = JSON.stringify(canvas.toObject(EXTRA_PROPS));
    let currentThumb = '';
    try { currentThumb = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.15 }); } catch (_e) { /* ignore */ }
    
    pageCounter++;
    const newPage: PageData = { id: `page-${pageCounter}`, name: `Page ${pageCounter}`, json: '', thumbnail: '' };
    const updated = [...pages];
    // Save current page's data first
    updated[currentPageIndex] = { ...updated[currentPageIndex], json: currentJson, thumbnail: currentThumb };
    // Add new blank page after current
    updated.splice(currentPageIndex + 1, 0, newPage);
    // Clear canvas for new page
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    set({ pages: updated, currentPageIndex: currentPageIndex + 1, history: [], historyIndex: -1 });
    setTimeout(() => get().saveToHistory(), 50);
  },

  duplicatePage: () => {
    const { canvas, pages, currentPageIndex } = get();
    if (!canvas) return;
    // Capture current page data BEFORE any changes
    const currentJson = JSON.stringify(canvas.toObject(EXTRA_PROPS));
    let currentThumb = '';
    try { currentThumb = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.15 }); } catch (_e) { /* ignore */ }
    
    // Save current page's data
    const updated = [...pages];
    updated[currentPageIndex] = { ...updated[currentPageIndex], json: currentJson, thumbnail: currentThumb };
    
    pageCounter++;
    const newPage: PageData = {
      id: `page-${pageCounter}`,
      name: `Page ${pageCounter} (copy)`,
      json: currentJson,
      thumbnail: currentThumb,
    };
    updated.splice(currentPageIndex + 1, 0, newPage);
    
    const newIndex = currentPageIndex + 1;
    set({ pages: updated, currentPageIndex: newIndex, isLoadingHistory: true, history: [], historyIndex: -1 });
    
    const jsonData: Record<string, unknown> = JSON.parse(currentJson);
    canvas.loadFromJSON(jsonData).then(() => {
      canvas.renderAll();
      set({ isLoadingHistory: false });
      window.dispatchEvent(new CustomEvent('__pageLoaded'));
      setTimeout(() => get().saveToHistory(), 50);
    });
  },

  deletePage: (index: number) => {
    const { canvas, pages, currentPageIndex } = get();
    if (!canvas || pages.length <= 1) return;
    const updated = pages.filter((_, i) => i !== index);
    let newIndex = currentPageIndex;
    if (index <= currentPageIndex) {
      newIndex = Math.max(0, currentPageIndex - 1);
    }
    if (newIndex >= updated.length) newIndex = updated.length - 1;
    set({ pages: updated, currentPageIndex: newIndex, isLoadingHistory: true, history: [], historyIndex: -1 });
    const pageJson = updated[newIndex].json;
    if (pageJson) {
      const jsonData: Record<string, unknown> = JSON.parse(pageJson);
      canvas.loadFromJSON(jsonData).then(() => {
        canvas.renderAll();
        set({ isLoadingHistory: false });
        window.dispatchEvent(new CustomEvent('__pageLoaded'));
        setTimeout(() => get().saveToHistory(), 50);
      });
    } else {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      set({ isLoadingHistory: false });
      window.dispatchEvent(new CustomEvent('__pageLoaded'));
      setTimeout(() => get().saveToHistory(), 50);
    }
  },

  switchPage: (index: number) => {
    const { canvas, pages, currentPageIndex } = get();
    if (!canvas || index === currentPageIndex || index < 0 || index >= pages.length) return;
    // Save current
    get().updateCurrentPageData();
    const targetPage = pages[index];
    set({ currentPageIndex: index, isLoadingHistory: true, history: [], historyIndex: -1 });
    if (targetPage.json) {
      const jsonData: Record<string, unknown> = JSON.parse(targetPage.json);
      canvas.loadFromJSON(jsonData).then(() => {
        canvas.renderAll();
        set({ isLoadingHistory: false });
        // Tell consumers (EffectsPanel) to reattach arc/edit handlers
        window.dispatchEvent(new CustomEvent('__pageLoaded'));
        setTimeout(() => get().saveToHistory(), 50);
      });
    } else {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      set({ isLoadingHistory: false });
      window.dispatchEvent(new CustomEvent('__pageLoaded'));
      setTimeout(() => get().saveToHistory(), 50);
    }
  },

  movePageUp: (index: number) => {
    if (index <= 0) return;
    const { pages, currentPageIndex } = get();
    const updated = [...pages];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    let newCurrent = currentPageIndex;
    if (currentPageIndex === index) newCurrent = index - 1;
    else if (currentPageIndex === index - 1) newCurrent = index;
    set({ pages: updated, currentPageIndex: newCurrent });
  },

  movePageDown: (index: number) => {
    const { pages, currentPageIndex } = get();
    if (index >= pages.length - 1) return;
    const updated = [...pages];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    let newCurrent = currentPageIndex;
    if (currentPageIndex === index) newCurrent = index + 1;
    else if (currentPageIndex === index + 1) newCurrent = index;
    set({ pages: updated, currentPageIndex: newCurrent });
  },

  // --- Save / Load designs (localStorage) ---
  saveDesign: () => {
    const { canvas, designName, canvasSize, productType } = get();
    if (!canvas) return;
    get().updateCurrentPageData();
    const updatedPages = get().pages;
    let thumb = '';
    try { thumb = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.15 }); } catch (_e) { /* ignore */ }
    const design = {
      id: `design-${Date.now()}`,
      name: designName,
      json: JSON.stringify({ pages: updatedPages, canvasSize, productType }),
      thumbnail: thumb,
      date: new Date().toLocaleDateString(),
    };
    const saved = get().savedDesigns;
    const updated = [design, ...saved];
    set({ savedDesigns: updated });
    try { localStorage.setItem('prodesigner_designs', JSON.stringify(updated)); } catch (_e) { /* ignore */ }
  },

  loadDesign: (id: string) => {
    const { canvas, savedDesigns } = get();
    if (!canvas) return;
    const design = savedDesigns.find(d => d.id === id);
    if (!design) return;
    try {
      const data = JSON.parse(design.json);
      const pages: PageData[] = data.pages || [];
      const size: CanvasSize = data.canvasSize || PRODUCT_SIZES['visiting-card'];
      const pt: ProductType = data.productType || 'visiting-card';
      canvas.setDimensions({ width: size.width, height: size.height });
      set({ designName: design.name, pages, currentPageIndex: 0, canvasSize: size, productType: pt, isLoadingHistory: true, history: [], historyIndex: -1 });
      if (pages[0]?.json) {
        const jsonData: Record<string, unknown> = JSON.parse(pages[0].json);
        canvas.loadFromJSON(jsonData).then(() => {
          canvas.renderAll();
          set({ isLoadingHistory: false });
          setTimeout(() => get().saveToHistory(), 50);
        });
      } else {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
        set({ isLoadingHistory: false });
      }
    } catch (_e) { /* ignore */ }
  },

  deleteDesign: (id: string) => {
    const saved = get().savedDesigns.filter(d => d.id !== id);
    set({ savedDesigns: saved });
    try { localStorage.setItem('prodesigner_designs', JSON.stringify(saved)); } catch (_e) { /* ignore */ }
  },
}));
