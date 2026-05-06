import React from 'react';
import { Textbox } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

const textPresets = [
  { label: 'Add a heading', fontSize: 64, fontWeight: 'bold', fontFamily: 'Inter', text: 'Add a heading' },
  { label: 'Add a subheading', fontSize: 36, fontWeight: '600', fontFamily: 'Inter', text: 'Add a subheading' },
  { label: 'Add body text', fontSize: 20, fontWeight: 'normal', fontFamily: 'Inter', text: 'Add body text here. You can customize font, size, color and more.' },
  { label: 'Add a caption', fontSize: 14, fontWeight: 'normal', fontFamily: 'Inter', text: 'Caption text' },
];

const decorativeTexts = [
  // Row 1 — Bold & Impact
  { text: 'BOLD TITLE', fontSize: 72, fontFamily: 'Bebas Neue', fontWeight: 'normal', fill: '#ffffff', bg: '#ef4444', fontStyle: 'normal', textAlign: 'center' },
  { text: 'IMPACT', fontSize: 80, fontFamily: 'Oswald', fontWeight: '700', fill: '#fbbf24', bg: '#0f172a', fontStyle: 'normal', textAlign: 'center' },
  // Row 2 — Elegant & Serif
  { text: 'Elegant Text', fontSize: 56, fontFamily: 'Playfair Display', fontWeight: 'bold', fill: '#d4a853', bg: '#1a1a2e', fontStyle: 'normal', textAlign: 'center' },
  { text: 'Serif Class', fontSize: 52, fontFamily: 'Merriweather', fontWeight: '700', fill: '#ffffff', bg: '#1e3a5f', fontStyle: 'normal', textAlign: 'center' },
  // Row 3 — Script & Fun
  { text: 'Script Style', fontSize: 56, fontFamily: 'Dancing Script', fontWeight: '700', fill: '#ec4899', bg: '#1f2937', fontStyle: 'normal', textAlign: 'center' },
  { text: 'FUN STYLE', fontSize: 60, fontFamily: 'Lobster', fontWeight: 'normal', fill: '#10b981', bg: '#0f172a', fontStyle: 'normal', textAlign: 'center' },
  // Row 4 — Modern & Minimal
  { text: 'MODERN', fontSize: 72, fontFamily: 'Montserrat', fontWeight: '800', fill: '#3b82f6', bg: '#111827', fontStyle: 'normal', textAlign: 'center' },
  { text: 'MINIMAL', fontSize: 64, fontFamily: 'Oswald', fontWeight: '300', fill: '#f59e0b', bg: '#18181b', fontStyle: 'normal', textAlign: 'center' },
  // Row 5 — Gradient-feel & Neon
  { text: 'NEON GLOW', fontSize: 68, fontFamily: 'Bebas Neue', fontWeight: 'normal', fill: '#00ff88', bg: '#0a0a0a', fontStyle: 'normal', textAlign: 'center' },
  { text: 'RETRO', fontSize: 72, fontFamily: 'Abril Fatface', fontWeight: 'normal', fill: '#f97316', bg: '#292524', fontStyle: 'normal', textAlign: 'center' },
  // Row 6 — Handwritten & Casual
  { text: 'Handwritten', fontSize: 56, fontFamily: 'Pacifico', fontWeight: 'normal', fill: '#f472b6', bg: '#1c1917', fontStyle: 'normal', textAlign: 'center' },
  { text: 'Casual Vibes', fontSize: 48, fontFamily: 'Dancing Script', fontWeight: '400', fill: '#a78bfa', bg: '#1e1b4b', fontStyle: 'normal', textAlign: 'center' },
  // Row 7 — Professional & Corporate
  { text: 'PROFESSIONAL', fontSize: 48, fontFamily: 'Montserrat', fontWeight: '600', fill: '#e2e8f0', bg: '#1e293b', fontStyle: 'normal', textAlign: 'center' },
  { text: 'CORPORATE', fontSize: 52, fontFamily: 'Raleway', fontWeight: '700', fill: '#60a5fa', bg: '#0f172a', fontStyle: 'normal', textAlign: 'center' },
  // Row 8 — Italic & Quote styles
  { text: '"Quote Style"', fontSize: 44, fontFamily: 'Playfair Display', fontWeight: '400', fill: '#fcd34d', bg: '#292524', fontStyle: 'italic', textAlign: 'center' },
  { text: 'Italic Elegance', fontSize: 48, fontFamily: 'Merriweather', fontWeight: '300', fill: '#c4b5fd', bg: '#1e1b4b', fontStyle: 'italic', textAlign: 'center' },
  // Row 9 — All-caps variations
  { text: 'SHADOW', fontSize: 80, fontFamily: 'Bebas Neue', fontWeight: 'normal', fill: '#ffffff', bg: '#374151', fontStyle: 'normal', textAlign: 'center' },
  { text: 'OUTLINE', fontSize: 72, fontFamily: 'Oswald', fontWeight: '700', fill: '#38bdf8', bg: '#0c4a6e', fontStyle: 'normal', textAlign: 'center' },
  // Row 10 — Decorative & Display
  { text: 'DISPLAY', fontSize: 96, fontFamily: 'Abril Fatface', fontWeight: 'normal', fill: '#f43f5e', bg: '#18181b', fontStyle: 'normal', textAlign: 'center' },
  { text: 'HEADLINE', fontSize: 64, fontFamily: 'Poppins', fontWeight: '800', fill: '#22d3ee', bg: '#0e7490', fontStyle: 'normal', textAlign: 'center' },
  // Row 11 — Multiline / Stacked
  { text: 'BIG\nSALE', fontSize: 80, fontFamily: 'Bebas Neue', fontWeight: 'normal', fill: '#ffffff', bg: '#dc2626', fontStyle: 'normal', textAlign: 'center' },
  { text: 'COMING\nSOON', fontSize: 72, fontFamily: 'Montserrat', fontWeight: '900', fill: '#fbbf24', bg: '#1e293b', fontStyle: 'normal', textAlign: 'center' },
  // Row 12 — Misc accents
  { text: '✦ PREMIUM ✦', fontSize: 40, fontFamily: 'Montserrat', fontWeight: '600', fill: '#d4a853', bg: '#0d0d0d', fontStyle: 'normal', textAlign: 'center' },
  { text: '— STUDIO —', fontSize: 48, fontFamily: 'Raleway', fontWeight: '300', fill: '#94a3b8', bg: '#0f172a', fontStyle: 'normal', textAlign: 'center' },
];

const TextPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();

  const addText = (options: {
    text: string;
    fontSize: number;
    fontWeight: string;
    fontFamily: string;
    fill?: string;
    fontStyle?: string;
    textAlign?: string;
  }) => {
    if (!canvas) return;

    // Calculate center position
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    const textbox = new Textbox(options.text, {
      left: centerX,
      top: centerY,
      width: canvasSize.width * 0.8,
      fontSize: options.fontSize,
      fontWeight: options.fontWeight,
      fontFamily: options.fontFamily,
      fill: options.fill || '#000000',
      fontStyle: (options.fontStyle || 'normal') as '' | 'normal' | 'italic' | 'oblique',
      textAlign: (options.textAlign || 'center') as 'left' | 'center' | 'right' | 'justify',
      editable: true,
      originX: 'center',
      originY: 'center',
    });

    (textbox as any).id = uuid();
    (textbox as any).name = options.text.substring(0, 20);

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    saveToHistory();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg">Text</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Add */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Click to add</h4>
          <div className="space-y-2">
            {textPresets.map((preset, i) => (
              <button
                key={i}
                onClick={() => addText(preset)}
                className="w-full text-left p-3 rounded-lg bg-[#1e1e3a] hover:bg-[#2a2a5a] transition-all border border-gray-700/30 hover:border-purple-500/50 group"
              >
                <span
                  className="text-white group-hover:text-purple-300 transition-colors block truncate"
                  style={{
                    fontSize: Math.min(preset.fontSize * 0.4, 24),
                    fontWeight: preset.fontWeight,
                  }}
                >
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Decorative Text Styles — expanded */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Text Styles</h4>
          <div className="grid grid-cols-2 gap-2">
            {decorativeTexts.map((style, i) => (
              <button
                key={i}
                onClick={() => addText({
                  text: style.text,
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  fontFamily: style.fontFamily,
                  fill: style.fill,
                  fontStyle: style.fontStyle,
                  textAlign: style.textAlign,
                })}
                className="rounded-lg overflow-hidden border border-gray-700/30 hover:border-purple-500 transition-all h-20 flex items-center justify-center hover:scale-[1.03] active:scale-100"
                style={{ backgroundColor: style.bg }}
              >
                <span
                  className="px-2 leading-tight"
                  style={{
                    fontFamily: style.fontFamily,
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle,
                    color: style.fill,
                    fontSize: Math.min(style.fontSize * 0.18, 18),
                    textAlign: style.textAlign as any,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {style.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextPanel;
