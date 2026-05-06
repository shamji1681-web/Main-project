import React, { useRef, useState } from 'react';
import { FabricImage } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

const UploadsPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImages(prev => [...prev, dataUrl]);
        addImageToCanvas(dataUrl);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addImageToCanvas = (src: string) => {
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

      // Scale to fit within canvas
      const maxW = canvasSize.width * 0.6;
      const maxH = canvasSize.height * 0.6;
      const scaleX = maxW / (fabricImg.width || 1);
      const scaleY = maxH / (fabricImg.height || 1);
      const scale = Math.min(scaleX, scaleY, 1);
      fabricImg.scale(scale);

      (fabricImg as any).id = uuid();
      (fabricImg as any).name = 'Uploaded Image';

      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      saveToHistory();
    };
    imgEl.src = src;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg">Uploads</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 rounded-lg border-2 border-dashed border-purple-500/50 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 transition-all flex flex-col items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">Upload Image</span>
          <span className="text-xs text-gray-500">PNG, JPG, SVG, GIF</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 && (
          <div>
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Uploads</h4>
            <div className="grid grid-cols-2 gap-2">
              {uploadedImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => addImageToCanvas(src)}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-700/30 hover:border-purple-500 transition-all group bg-[#1e1e3a]"
                >
                  <img
                    src={src}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-600 text-4xl mb-3">🖼️</div>
            <p className="text-gray-500 text-sm">No images uploaded yet</p>
            <p className="text-gray-600 text-xs mt-1">Upload images to use in your design</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadsPanel;
