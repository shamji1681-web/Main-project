import React, { useState } from 'react';
import { FabricImage } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

const stylePresets = [
  { label: 'Photo Realistic', prompt: 'photorealistic, 4k, high quality' },
  { label: 'Digital Art', prompt: 'digital art, illustration, vibrant colors' },
  { label: 'Watercolor', prompt: 'watercolor painting, artistic, soft colors' },
  { label: 'Flat Design', prompt: 'flat design, vector art, minimalist, clean' },
  { label: '3D Render', prompt: '3d render, cinema4d, octane render, detailed' },
  { label: 'Sketch', prompt: 'pencil sketch, hand drawn, black and white' },
  { label: 'Anime', prompt: 'anime style, japanese animation, colorful' },
  { label: 'Oil Painting', prompt: 'oil painting, classical art, brush strokes' },
];

const placeholderImages = [
  { prompt: 'Abstract colorful background', url: 'https://picsum.photos/id/1/400/300' },
  { prompt: 'Nature landscape', url: 'https://picsum.photos/id/15/400/300' },
  { prompt: 'Business office', url: 'https://picsum.photos/id/180/400/300' },
  { prompt: 'Technology concept', url: 'https://picsum.photos/id/0/400/300' },
  { prompt: 'Food photography', url: 'https://picsum.photos/id/292/400/300' },
  { prompt: 'City skyline', url: 'https://picsum.photos/id/274/400/300' },
];

const AIImgPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    // Simulate AI image generation with placeholder images
    // In production, this would call your AI image generation API
    setTimeout(() => {
      const randomIds = [
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100) + 100,
        Math.floor(Math.random() * 100) + 200,
        Math.floor(Math.random() * 100) + 300,
      ];
      const urls = randomIds.map(id => `https://picsum.photos/id/${id}/800/600`);
      setGeneratedImages(urls);
      setIsGenerating(false);
    }, 2000);
  };

  const addToCanvas = (url: string) => {
    if (!canvas) return;
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      const fabricImg = new FabricImage(imgEl, {
        left: canvasSize.width / 2,
        top: canvasSize.height / 2,
        originX: 'center',
        originY: 'center',
      });
      const maxW = canvasSize.width * 0.6;
      const maxH = canvasSize.height * 0.6;
      const scaleX = maxW / (fabricImg.width || 1);
      const scaleY = maxH / (fabricImg.height || 1);
      fabricImg.scale(Math.min(scaleX, scaleY, 1));
      (fabricImg as any).id = uuid();
      (fabricImg as any).name = 'AI Generated Image';
      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      saveToHistory();
    };
    imgEl.src = url;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">✨ AI Image</span>
        </h3>
        <p className="text-gray-500 text-xs mt-1">Generate images with AI</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Prompt Input */}
        <div>
          <label className="text-gray-400 text-xs font-semibold block mb-1.5">Describe your image</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
            placeholder="A beautiful sunset over mountains with vibrant colors..."
          />
        </div>

        {/* Style Presets */}
        <div>
          <label className="text-gray-400 text-xs font-semibold block mb-2">Style</label>
          <div className="grid grid-cols-2 gap-1.5">
            {stylePresets.map((style, i) => (
              <button
                key={i}
                onClick={() => setSelectedStyle(style.prompt)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  selectedStyle === style.prompt
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1e1e3a] text-gray-400 hover:bg-[#2a2a5a] hover:text-gray-300'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            isGenerating || !prompt.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>✨ Generate Image</>
          )}
        </button>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div>
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Generated Results</h4>
            <div className="grid grid-cols-2 gap-2">
              {generatedImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => addToCanvas(url)}
                  className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-700/30 hover:border-purple-500 transition-all group bg-[#1e1e3a]"
                >
                  <img src={url} alt={`AI Generated ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Suggestions */}
        <div>
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Quick Add</h4>
          <p className="text-gray-600 text-[10px] mb-2">Stock photos as AI placeholders</p>
          <div className="grid grid-cols-2 gap-2">
            {placeholderImages.map((img, i) => (
              <button
                key={i}
                onClick={() => addToCanvas(img.url)}
                className="rounded-lg overflow-hidden border border-gray-700/30 hover:border-purple-500 transition-all group"
              >
                <div className="aspect-[4/3] bg-[#1e1e3a] overflow-hidden">
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <p className="text-gray-400 text-[9px] p-1.5 truncate">{img.prompt}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1e1e3a] rounded-lg p-3 border border-gray-700/20">
          <p className="text-gray-500 text-[10px] leading-relaxed">
            💡 <strong className="text-gray-400">Tip:</strong> Connect your own AI image generation API (DALL·E, Stable Diffusion, Midjourney) for real AI-generated images. Currently showing stock photo placeholders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIImgPanel;
