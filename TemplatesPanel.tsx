import React, { useState } from 'react';
import { Rect, Textbox, Circle } from 'fabric';
import { useEditorStore, PRODUCT_SIZES, type ProductType } from '../../store/editorStore';
import { templates, type TemplateData } from '../../data/templates';
import { v4 as uuid } from 'uuid';

const categories: { id: ProductType; label: string; icon: string }[] = [
  { id: 'visiting-card', label: 'Visiting Card', icon: '💳' },
  { id: 'letterhead', label: 'Letterhead', icon: '📄' },
  { id: 'brochure', label: 'Brochure', icon: '📰' },
  { id: 'sign-board', label: 'Sign Board', icon: '🪧' },
  { id: 'poster', label: 'Poster', icon: '🖼️' },
  { id: 'flyer', label: 'Flyer', icon: '📋' },
  { id: 'social-media', label: 'Social Media', icon: '📱' },
];

const TemplatesPanel: React.FC = () => {
  const { canvas, setProductType, setCanvasSize, saveToHistory } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('visiting-card');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = t.category === selectedCategory;
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const applyTemplate = async (template: TemplateData) => {
    if (!canvas) return;

    // Set product type and canvas size
    const productType = template.category as ProductType;
    setProductType(productType);
    
    const size = PRODUCT_SIZES[productType] || { width: template.canvasWidth, height: template.canvasHeight };
    setCanvasSize(size);
    
    // Clear canvas
    canvas.clear();
    canvas.setDimensions({ width: template.canvasWidth, height: template.canvasHeight });
    canvas.backgroundColor = template.background;

    // Add objects from template
    for (const obj of template.objects) {
      let fabricObj: any = null;
      const id = uuid();

      switch (obj.type) {
        case 'Rect':
          fabricObj = new Rect({
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            fill: obj.fill || '#000000',
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth || 0,
            rx: obj.rx || 0,
            ry: obj.ry || 0,
            selectable: obj.selectable !== false,
            evented: obj.evented !== false,
          });
          break;
        case 'Circle':
          fabricObj = new Circle({
            left: obj.left,
            top: obj.top,
            radius: obj.radius,
            fill: obj.fill || '#000000',
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth || 0,
            selectable: obj.selectable !== false,
            evented: obj.evented !== false,
          });
          break;
        case 'Textbox':
          fabricObj = new Textbox(obj.text, {
            left: obj.left,
            top: obj.top,
            width: obj.width || 200,
            fontSize: obj.fontSize || 24,
            fontFamily: obj.fontFamily || 'Inter',
            fontWeight: obj.fontWeight || 'normal',
            fill: obj.fill || '#000000',
            textAlign: obj.textAlign || 'left',
            lineHeight: obj.lineHeight || 1.2,
            selectable: obj.selectable !== false,
            evented: obj.evented !== false,
          });
          break;
      }

      if (fabricObj) {
        (fabricObj as any).id = id;
        (fabricObj as any).name = obj.type === 'Textbox' ? obj.text?.substring(0, 20) : obj.type;
        canvas.add(fabricObj);
      }
    }

    canvas.renderAll();
    saveToHistory();
  };

  // Generate preview color block for template
  const getPreviewStyle = (template: TemplateData) => {
    return { backgroundColor: template.background };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-3">Templates</h3>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Category Pills */}
      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-700/50">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-[#1e1e3a] text-gray-400 hover:text-white hover:bg-[#2a2a5a]'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Blank template */}
          <button
            onClick={() => {
              if (!canvas) return;
              const pt = selectedCategory as ProductType;
              const size = PRODUCT_SIZES[pt];
              if (size) {
                setProductType(pt);
                setCanvasSize(size);
                canvas.clear();
                canvas.setDimensions({ width: size.width, height: size.height });
                canvas.backgroundColor = '#ffffff';
                canvas.renderAll();
                saveToHistory();
              }
            }}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-600 hover:border-purple-500 flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 transition-all group"
          >
            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">+</span>
            <span className="text-xs font-medium">Blank</span>
          </button>

          {filteredTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-700/50 hover:border-purple-500 transition-all group cursor-pointer"
              style={getPreviewStyle(template)}
            >
              {/* Mini preview of template */}
              <div className="absolute inset-0 flex flex-col items-start justify-center p-3">
                {template.objects.slice(0, 4).map((obj, i) => {
                  if (obj.type === 'Textbox') {
                    return (
                      <div
                        key={i}
                        className="truncate max-w-full"
                        style={{
                          color: obj.fill,
                          fontSize: Math.min(obj.fontSize * 0.08, 14),
                          fontFamily: obj.fontFamily,
                          fontWeight: obj.fontWeight || 'normal',
                        }}
                      >
                        {obj.text?.split('\n')[0]}
                      </div>
                    );
                  }
                  if (obj.type === 'Rect' && i > 0) {
                    return (
                      <div
                        key={i}
                        style={{
                          width: Math.min(obj.width * 0.08, 80),
                          height: Math.max(obj.height * 0.08, 2),
                          backgroundColor: obj.fill === 'transparent' ? 'transparent' : obj.fill,
                          border: obj.stroke ? `1px solid ${obj.stroke}` : 'none',
                          marginTop: 2,
                          marginBottom: 2,
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <span className="text-white text-xs font-medium">{template.name}</span>
              </div>
              <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 transition-all" />
            </button>
          ))}
        </div>
        {filteredTemplates.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            No templates found for this category
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesPanel;
