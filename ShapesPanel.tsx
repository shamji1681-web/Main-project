import React, { useState } from 'react';
import { Rect, Circle, Triangle, Polygon, Ellipse, Line, Group, Textbox } from 'fabric';
import { util as fabricUtil } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

type SectionTab = 'shapes' | 'lines' | 'tables';

const ShapesPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const [tab, setTab] = useState<SectionTab>('shapes');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const addShape = (createFn: (cx: number, cy: number) => any, name?: string) => {
    if (!canvas) return;
    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2;
    const obj = createFn(cx, cy);
    (obj as any).id = uuid();
    (obj as any).name = name || obj.type || 'Shape';
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    saveToHistory();
  };

  // ===================== SHAPES =====================
  const shapes = [
    {
      name: 'Rectangle',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><rect x="4" y="8" width="32" height="24" fill="currentColor" rx="2" /></svg>,
      create: (cx: number, cy: number) => new Rect({ left: cx-100, top: cy-75, width: 200, height: 150, fill: '#7c3aed', strokeWidth: 0 }),
    },
    {
      name: 'Square',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><rect x="6" y="6" width="28" height="28" fill="currentColor" rx="2" /></svg>,
      create: (cx: number, cy: number) => new Rect({ left: cx-75, top: cy-75, width: 150, height: 150, fill: '#3b82f6', strokeWidth: 0 }),
    },
    {
      name: 'Circle',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="16" fill="currentColor" /></svg>,
      create: (cx: number, cy: number) => new Circle({ left: cx-75, top: cy-75, radius: 75, fill: '#ef4444', strokeWidth: 0 }),
    },
    {
      name: 'Ellipse',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><ellipse cx="20" cy="20" rx="18" ry="12" fill="currentColor" /></svg>,
      create: (cx: number, cy: number) => new Ellipse({ left: cx-100, top: cy-60, rx: 100, ry: 60, fill: '#f59e0b', strokeWidth: 0 }),
    },
    {
      name: 'Triangle',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><polygon points="20,4 36,36 4,36" fill="currentColor" /></svg>,
      create: (cx: number, cy: number) => new Triangle({ left: cx-75, top: cy-75, width: 150, height: 150, fill: '#10b981', strokeWidth: 0 }),
    },
    {
      name: 'Diamond',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><polygon points="20,4 36,20 20,36 4,20" fill="currentColor" /></svg>,
      create: (cx: number, cy: number) => new Polygon([{x:75,y:0},{x:150,y:75},{x:75,y:150},{x:0,y:75}], { left: cx-75, top: cy-75, fill: '#ec4899', strokeWidth: 0 }),
    },
    {
      name: 'Pentagon',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><polygon points="20,3 37,15 31,35 9,35 3,15" fill="currentColor" /></svg>,
      create: (cx: number, cy: number) => { const r=75; const pts=Array.from({length:5},(_,i)=>{const a=(Math.PI*2*i)/5-Math.PI/2;return{x:r+r*Math.cos(a),y:r+r*Math.sin(a)};}); return new Polygon(pts,{left:cx-r,top:cy-r,fill:'#06b6d4',strokeWidth:0}); },
    },
    {
      name: 'Hexagon',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><polygon points="20,3 36,11 36,27 20,35 4,27 4,11" fill="currentColor" /></svg>,
      create: (cx: number, cy: number) => { const r=75; const pts=Array.from({length:6},(_,i)=>{const a=(Math.PI*2*i)/6-Math.PI/6;return{x:r+r*Math.cos(a),y:r+r*Math.sin(a)};}); return new Polygon(pts,{left:cx-r,top:cy-r,fill:'#8b5cf6',strokeWidth:0}); },
    },
    {
      name: 'Star',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><polygon points="20,2 25,15 38,15 27,23 31,37 20,28 9,37 13,23 2,15 15,15" fill="currentColor" /></svg>,
      create: (cx: number, cy: number) => { const or2=75,ir=35; const pts=Array.from({length:10},(_,i)=>{const r=i%2===0?or2:ir;const a=(Math.PI*2*i)/10-Math.PI/2;return{x:or2+r*Math.cos(a),y:or2+r*Math.sin(a)};}); return new Polygon(pts,{left:cx-or2,top:cy-or2,fill:'#fbbf24',strokeWidth:0}); },
    },
    {
      name: 'Rounded Rect',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><rect x="4" y="8" width="32" height="24" fill="currentColor" rx="8" /></svg>,
      create: (cx: number, cy: number) => new Rect({ left: cx-100, top: cy-60, width: 200, height: 120, fill: '#14b8a6', rx: 20, ry: 20, strokeWidth: 0 }),
    },
    {
      name: 'Outline Rect',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><rect x="4" y="8" width="32" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" rx="2" /></svg>,
      create: (cx: number, cy: number) => new Rect({ left: cx-100, top: cy-75, width: 200, height: 150, fill: 'transparent', stroke: '#7c3aed', strokeWidth: 4 }),
    },
    {
      name: 'Outline Circle',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>,
      create: (cx: number, cy: number) => new Circle({ left: cx-75, top: cy-75, radius: 75, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 4 }),
    },
  ];

  // ===================== LINES =====================
  const lines = [
    {
      name: 'Horizontal',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="3" /></svg>,
      create: (cx: number, cy: number) => new Line([cx-120, cy, cx+120, cy], { stroke: '#f43f5e', strokeWidth: 4 }),
    },
    {
      name: 'Vertical',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="3" /></svg>,
      create: (cx: number, cy: number) => new Line([cx, cy-120, cx, cy+120], { stroke: '#3b82f6', strokeWidth: 4 }),
    },
    {
      name: 'Diagonal ↘',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="4" x2="36" y2="36" stroke="currentColor" strokeWidth="3" /></svg>,
      create: (cx: number, cy: number) => new Line([cx-100, cy-100, cx+100, cy+100], { stroke: '#f59e0b', strokeWidth: 4 }),
    },
    {
      name: 'Diagonal ↗',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="36" x2="36" y2="4" stroke="currentColor" strokeWidth="3" /></svg>,
      create: (cx: number, cy: number) => new Line([cx-100, cy+100, cx+100, cy-100], { stroke: '#8b5cf6', strokeWidth: 4 }),
    },
    {
      name: 'Thin Line',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="1" /></svg>,
      create: (cx: number, cy: number) => new Line([cx-150, cy, cx+150, cy], { stroke: '#64748b', strokeWidth: 1 }),
    },
    {
      name: 'Thick Line',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="6" /></svg>,
      create: (cx: number, cy: number) => new Line([cx-150, cy, cx+150, cy], { stroke: '#1e293b', strokeWidth: 10 }),
    },
    {
      name: 'Dashed',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="3" strokeDasharray="4 3" /></svg>,
      create: (cx: number, cy: number) => new Line([cx-150, cy, cx+150, cy], { stroke: '#ef4444', strokeWidth: 3, strokeDashArray: [12, 8] }),
    },
    {
      name: 'Dotted',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="3" strokeDasharray="2 4" /></svg>,
      create: (cx: number, cy: number) => new Line([cx-150, cy, cx+150, cy], { stroke: '#10b981', strokeWidth: 4, strokeDashArray: [2, 8] }),
    },
    {
      name: 'Divider',
      icon: <svg viewBox="0 0 40 40" className="w-8 h-8"><line x1="4" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1.5" /><line x1="4" y1="22" x2="36" y2="22" stroke="currentColor" strokeWidth="1.5" /></svg>,
      create: (cx: number, cy: number) => {
        const l1 = new Line([0, 0, 300, 0], { stroke: '#94a3b8', strokeWidth: 2 });
        const l2 = new Line([0, 8, 300, 8], { stroke: '#94a3b8', strokeWidth: 2 });
        return new Group([l1, l2], { left: cx - 150, top: cy });
      },
    },
  ];

  const addTable = () => {
    if (!canvas) return;
    const cellW = 120;
    const cellH = 40;
    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2;
    const startX = cx - (cellW * tableCols) / 2;
    const startY = cy - (cellH * tableRows) / 2;

    const tableId = uuid();
    const objects: any[] = [];

    // Create cells (rect background + text) - locked to prevent individual dragging
    for (let r = 0; r < tableRows; r++) {
      for (let c = 0; c < tableCols; c++) {
        const isHeader = r === 0;
        
        // Cell background - selectable for selection, locked to prevent individual dragging
        const cell = new Rect({
          left: c * cellW,
          top: r * cellH,
          width: cellW,
          height: cellH,
          fill: isHeader ? '#7c3aed' : 'rgba(0,0,0,0)',
          stroke: '#374151',
          strokeWidth: 1,
          originX: 'left',
          originY: 'top',
          // Selectable for selection but movement locked
          selectable: true,
          evented: true,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          objectCaching: false,
        });
        (cell as any).__tableRow = r;
        (cell as any).__tableCol = c;
        (cell as any).__isTableCell = true;
        (cell as any).__tableId = tableId;
        objects.push(cell);

        // Cell text - selectable and editable, but movement locked
        const label = new Textbox('', {
          left: c * cellW + 4,
          top: r * cellH + 8,
          width: cellW - 8,
          height: cellH - 16,
          fontSize: 13,
          fontFamily: 'Inter',
          fontWeight: isHeader ? 'bold' : 'normal',
          fill: isHeader ? '#ffffff' : '#1e293b',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          editable: true,
          // Selectable for editing but movement locked
          selectable: true,
          evented: true,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          objectCaching: false,
        });
        (label as any).__tableRow = r;
        (label as any).__tableCol = c;
        (label as any).__isTableLabel = true;
        (label as any).__tableId = tableId;
        (label as any).__parentCell = cell;
        objects.push(label);
      }
    }

    // Store column widths and row heights for resizing
    const colWidths = Array(tableCols).fill(cellW);
    const rowHeights = Array(tableRows).fill(cellH);
    
    // Group - the group is draggable, cells inside are selectable but locked
    const group = new Group(objects, {
      left: startX,
      top: startY,
      subTargetCheck: true,
      interactive: true,
      selectable: true,
      evented: true,
      objectCaching: false,
    });
    
    // Store table metadata on group
    (group as any).__isTable = true;
    (group as any).__tableId = tableId;
    (group as any).__tableRows = tableRows;
    (group as any).__tableCols = tableCols;
    (group as any).__colWidths = colWidths;
    (group as any).__rowHeights = rowHeights;
    (group as any).__cellObjects = objects;
    
    // Add double-click handler on cells to enter edit mode
    objects.forEach((o: any) => {
      if (o.__isTableLabel) {
        o.on('mousedblclick', (e: any) => {
          e.e.stopPropagation();
          if (!canvas) return;
          o.set({ editable: true });
          canvas.setActiveObject(o);
          o.enterEditing();
          o.selectAll();
          canvas.renderAll();
          o.on('editing:exited', () => {
            o.set({ editable: false });
            canvas.renderAll();
          }, { once: true });
        });
      }
    });

    // ─────────────────────────────────────────────────────────────
    // RESIZE HANDLES: Use group's mouse events directly (no invisible handles).
    // This ensures cursor changes exactly on border lines, exactly like Polotno/Excel.
    // ─────────────────────────────────────────────────────────────

    let isResizing = false;
    let resizeTarget: { type: 'col' | 'row'; index: number } | null = null;
    let initialColWidths = [...colWidths];
    let initialRowHeights = [...rowHeights];

    // Detect when mouse is near a column border line
    group.on('mousemove', (e: any) => {
      if (isResizing) return;
      
      const pointer = canvas!.getScenePoint(e.e);
      const matrix = group.calcTransformMatrix();
      const invMatrix = fabricUtil.invertTransform(matrix);
      const localPoint = fabricUtil.transformPoint({ x: pointer.x, y: pointer.y }, invMatrix);
      
      // Check if mouse is near a column border (within 5px)
      let cumW = 0;
      for (let c = 1; c < tableCols; c++) {
        cumW += colWidths[c - 1];
        if (Math.abs(localPoint.x - cumW) < 5) {
          canvas!.defaultCursor = 'col-resize';
          return;
        }
      }
      
      // Check if mouse is near a row border (within 5px)
      let cumH = 0;
      for (let r = 1; r < tableRows; r++) {
        cumH += rowHeights[r - 1];
        if (Math.abs(localPoint.y - cumH) < 5) {
          canvas!.defaultCursor = 'row-resize';
          return;
        }
      }
      
      // Reset cursor
      canvas!.defaultCursor = 'default';
    });

    // Start resize on mousedown
    group.on('mousedown', (e: any) => {
      const pointer = canvas!.getScenePoint(e.e);
      const matrix = group.calcTransformMatrix();
      const invMatrix = fabricUtil.invertTransform(matrix);
      const localPoint = fabricUtil.transformPoint({ x: pointer.x, y: pointer.y }, invMatrix);
      
      // Check column borders
      let cumW = 0;
      for (let c = 1; c < tableCols; c++) {
        cumW += colWidths[c - 1];
        if (Math.abs(localPoint.x - cumW) < 10) {
          isResizing = true;
          resizeTarget = { type: 'col', index: c };
          initialColWidths = [...colWidths];
          initialRowHeights = [...rowHeights];
          e.e?.stopPropagation();
          return;
        }
      }
      
      // Check row borders
      let cumH = 0;
      for (let r = 1; r < tableRows; r++) {
        cumH += rowHeights[r - 1];
        if (Math.abs(localPoint.y - cumH) < 10) {
          isResizing = true;
          resizeTarget = { type: 'row', index: r };
          initialColWidths = [...colWidths];
          initialRowHeights = [...rowHeights];
          e.e?.stopPropagation();
          return;
        }
      }
    });

    // Handle resize on mousemove
    canvas.on('mouse:move', (e: any) => {
      if (!isResizing || !resizeTarget || !canvas) return;
      
      const pointer = canvas.getScenePoint(e.e);
      const matrix = group.calcTransformMatrix();
      const invMatrix = fabricUtil.invertTransform(matrix);
      const localPoint = fabricUtil.transformPoint({ x: pointer.x, y: pointer.y }, invMatrix);
      
      if (resizeTarget.type === 'col') {
        const colIdx = resizeTarget.index;
        const targetCol = colIdx - 1;
        const beforeTarget = initialColWidths.slice(0, targetCol).reduce((a: number, b: number) => a + b, 0);
        const newColW = Math.max(40, localPoint.x - beforeTarget);
        const delta = newColW - initialColWidths[targetCol];
        colWidths[targetCol] = newColW;
        (group as any).__colWidths = colWidths;

        // Update all cells
        objects.forEach((o: any) => {
          const col = o.__tableCol || 0;
          if (col > targetCol) {
            o.set('left', (o.left || 0) + delta);
          } else if (col === targetCol && o.__isTableCell) {
            o.set('width', newColW);
          } else if (col === targetCol && o.__isTableLabel) {
            o.set('width', newColW - 8);
          }
          o.setCoords?.();
        });
      } else {
        const rowIdx = resizeTarget.index;
        const targetRow = rowIdx - 1;
        const beforeTarget = initialRowHeights.slice(0, targetRow).reduce((a: number, b: number) => a + b, 0);
        const newRowH = Math.max(20, localPoint.y - beforeTarget);
        const delta = newRowH - initialRowHeights[targetRow];
        rowHeights[targetRow] = newRowH;
        (group as any).__rowHeights = rowHeights;

        // Update all cells
        objects.forEach((o: any) => {
          const row = o.__tableRow || 0;
          if (row > targetRow) {
            o.set('top', (o.top || 0) + delta);
          } else if (row === targetRow && o.__isTableCell) {
            o.set('height', newRowH);
          } else if (row === targetRow && o.__isTableLabel) {
            o.set('height', newRowH - 16);
          }
          o.setCoords?.();
        });
      }
      
      (group as any).dirty = true;
      group.setCoords();
      canvas.renderAll();
    });

    // End resize on mouseup
    canvas.on('mouse:up', () => {
      if (isResizing) {
        isResizing = false;
        resizeTarget = null;
        saveToHistory();
      }
    });
    
    (group as any).id = uuid();
    (group as any).name = `Table ${tableRows}×${tableCols}`;
    (group as any).__isTable = true;
    (group as any).__tableId = tableId;
    (group as any).__tableRows = tableRows;
    (group as any).__tableCols = tableCols;
    (group as any).__cellW = cellW;
    (group as any).__cellH = cellH;

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    saveToHistory();
  };

  const tablePresets = [
    { rows: 2, cols: 2, label: '2×2' },
    { rows: 3, cols: 3, label: '3×3' },
    { rows: 4, cols: 4, label: '4×4' },
    { rows: 5, cols: 3, label: '5×3' },
    { rows: 3, cols: 5, label: '3×5' },
    { rows: 6, cols: 4, label: '6×4' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-3">Elements</h3>
        <div className="flex gap-1.5">
          {([
            { id: 'shapes' as SectionTab, label: 'Shapes' },
            { id: 'lines' as SectionTab, label: 'Lines' },
            { id: 'tables' as SectionTab, label: 'Tables' },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.id ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* ===== SHAPES TAB ===== */}
        {tab === 'shapes' && (
          <div className="grid grid-cols-3 gap-3">
            {shapes.map((shape, i) => (
              <button
                key={i}
                onClick={() => addShape(shape.create, shape.name)}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#1e1e3a] hover:bg-[#2a2a5a] border border-gray-700/30 hover:border-purple-500/50 transition-all text-gray-400 hover:text-purple-400 group"
              >
                <div className="mb-1.5 group-hover:scale-110 transition-transform">{shape.icon}</div>
                <span className="text-[10px] font-medium">{shape.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ===== LINES TAB ===== */}
        {tab === 'lines' && (
          <div className="grid grid-cols-3 gap-3">
            {lines.map((line, i) => (
              <button
                key={i}
                onClick={() => addShape(line.create, line.name)}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#1e1e3a] hover:bg-[#2a2a5a] border border-gray-700/30 hover:border-purple-500/50 transition-all text-gray-400 hover:text-purple-400 group"
              >
                <div className="mb-1.5 group-hover:scale-110 transition-transform">{line.icon}</div>
                <span className="text-[10px] font-medium">{line.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ===== TABLES TAB ===== */}
        {tab === 'tables' && (
          <div className="space-y-5">
            {/* Quick presets */}
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Quick Add</h4>
              <div className="grid grid-cols-3 gap-2">
                {tablePresets.map((tp, i) => (
                  <button
                    key={i}
                    onClick={() => { setTableRows(tp.rows); setTableCols(tp.cols); setTimeout(addTable, 50); }}
                    className="py-3 rounded-lg bg-[#1e1e3a] hover:bg-[#2a2a5a] border border-gray-700/30 hover:border-purple-500/50 transition-all text-center group"
                  >
                    {/* Mini table preview */}
                    <div className="flex flex-col items-center gap-0.5 mb-1.5">
                      {Array.from({ length: Math.min(tp.rows, 4) }).map((_, r) => (
                        <div key={r} className="flex gap-0.5">
                          {Array.from({ length: Math.min(tp.cols, 5) }).map((_, c) => (
                            <div
                              key={c}
                              className="rounded-[1px]"
                              style={{
                                width: 6, height: 5,
                                backgroundColor: r === 0 ? '#7c3aed' : '#475569',
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <span className="text-gray-400 group-hover:text-purple-300 text-[11px] font-medium">{tp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive grid selector */}
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Select Size</h4>
              <div className="bg-[#1e1e3a] rounded-lg p-3 border border-gray-700/30">
                <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(8, 1fr)` }}>
                  {Array.from({ length: 48 }).map((_, idx) => {
                    const r = Math.floor(idx / 8);
                    const c = idx % 8;
                    const isActive = r < tableRows && c < tableCols;
                    return (
                      <button
                        key={idx}
                        className={`aspect-square rounded-sm transition-all ${isActive ? 'bg-purple-500' : 'bg-gray-700/50 hover:bg-gray-600'}`}
                        onMouseEnter={() => { setTableRows(r + 1); setTableCols(c + 1); }}
                        onClick={() => { setTableRows(r + 1); setTableCols(c + 1); setTimeout(addTable, 50); }}
                        style={{ width: 20, height: 16 }}
                      />
                    );
                  })}
                </div>
                <p className="text-center text-gray-400 text-xs mt-2 font-medium">{tableRows} × {tableCols}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShapesPanel;
