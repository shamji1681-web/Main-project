import React, { useEffect } from 'react';
import EditorHeader from './components/EditorHeader';
import Sidebar from './components/Sidebar';
import CanvasWorkspace from './components/CanvasWorkspace';
import EditorToolbar from './components/EditorToolbar';
import StatusBar from './components/StatusBar';
import FloatingToolbar from './components/FloatingToolbar';
import { useEditorStore } from './store/editorStore';

const App: React.FC = () => {
  const { canvas, undo, redo, saveToHistory } = useEditorStore();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y') && (e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      // Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvas) {
        const active = canvas.getActiveObject();
        // Don't delete if editing text
        if (active && !(active as any).isEditing) {
          e.preventDefault();
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.renderAll();
          saveToHistory();
        }
      }
      // Duplicate: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && canvas) {
        e.preventDefault();
        const active = canvas.getActiveObject();
        if (active) {
          active.clone().then((cloned: any) => {
            cloned.set({
              left: (cloned.left || 0) + 20,
              top: (cloned.top || 0) + 20,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            saveToHistory();
          });
        }
      }
      // Select All: Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && canvas) {
        e.preventDefault();
        canvas.discardActiveObject();
        const objs = canvas.getObjects().filter(o => o.selectable);
        if (objs.length > 0) {
          const { ActiveSelection } = require('fabric');
          const sel = new ActiveSelection(objs, { canvas });
          canvas.setActiveObject(sel);
          canvas.renderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, undo, redo, saveToHistory]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#1a1a2e]">
      {/* Header */}
      <EditorHeader />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <EditorToolbar />
          
          {/* Canvas */}
          <CanvasWorkspace />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />
      {/* Floating Toolbar — renders as fixed overlay */}
      <FloatingToolbar />
    </div>
  );
};

export default App;
