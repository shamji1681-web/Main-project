import React, { useState, useEffect, useCallback } from 'react';
import { FabricImage } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

// Free stock photos from picsum
const PHOTO_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'business', label: 'Business' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'people', label: 'People' },
  { id: 'tech', label: 'Technology' },
];

const generatePhotos = (page: number, category: string) => {
  // Generate deterministic photo IDs based on category
  const baseIds: Record<string, number[]> = {
    all: [10, 20, 30, 40, 50, 60, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230],
    nature: [15, 16, 17, 18, 19, 28, 29, 36, 37, 39, 41, 42, 43, 44, 47, 48, 49, 54, 55, 56],
    business: [60, 119, 180, 201, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400],
    abstract: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 21, 22, 23, 24, 25, 26, 27],
    people: [64, 65, 66, 83, 84, 85, 91, 92, 96, 101, 102, 103, 177, 178, 179, 203, 237, 238, 239, 305],
    tech: [0, 1, 2, 3, 180, 60, 119, 201, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360],
  };

  const ids = baseIds[category] || baseIds.all;
  const start = (page - 1) * 8;
  return ids.slice(start, start + 8).map(id => ({
    id: id + page * 1000,
    thumb: `https://picsum.photos/id/${id}/300/200`,
    full: `https://picsum.photos/id/${id}/1200/800`,
  }));
};

const PhotosPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const [category, setCategory] = useState('all');
  const [photos, setPhotos] = useState<any[]>([]);
  // loading state reserved for API integration

  useEffect(() => {
    setPhotos(generatePhotos(1, category));
  }, [category]);

  const addPhotoToCanvas = useCallback((src: string) => {
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
      const scale = Math.min(scaleX, scaleY, 1);
      fabricImg.scale(scale);

      (fabricImg as any).id = uuid();
      (fabricImg as any).name = 'Stock Photo';

      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      saveToHistory();
    };
    imgEl.onerror = () => {
      console.log('Failed to load image');
    };
    imgEl.src = src;
  }, [canvas, canvasSize, saveToHistory]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-3">Photos</h3>
        <div className="flex flex-wrap gap-1.5">
          {PHOTO_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                category === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1e1e3a] text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gray-500 text-xs mb-3">Free photos from Picsum. Click to add.</p>
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => addPhotoToCanvas(photo.full)}
              className="aspect-[3/2] rounded-lg overflow-hidden border border-gray-700/30 hover:border-purple-500 transition-all group bg-[#1e1e3a]"
            >
              <img
                src={photo.thumb}
                alt="Stock photo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotosPanel;
