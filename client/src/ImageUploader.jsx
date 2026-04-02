import { useState, useRef } from 'react';
import * as api from './api.js';

export default function ImageUploader({ images, onChange, maxImages = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const slotsRemaining = maxImages - images.length;

  const handleFiles = async (fileList) => {
    let files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    // Clamp to available slots
    if (files.length > slotsRemaining) {
      files = files.slice(0, slotsRemaining);
    }
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await api.uploadImages(files);
      const newPaths = uploaded.map((f) => f.path);
      onChange([...images, ...newPaths]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = async (index) => {
    const imagePath = images[index];
    const filename = imagePath.split('/').pop();
    try {
      await api.deleteImage(filename);
    } catch {}
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleReorder = (fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= images.length) return;
    const reordered = [...images];
    [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={img + index}
              className="group relative rounded-xl overflow-hidden border border-gray-700 bg-discord-dark aspect-video"
            >
              <img
                src={`/${img}`}
                alt={`Room image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Reorder buttons */}
                <button
                  onClick={() => handleReorder(index, -1)}
                  disabled={index === 0}
                  className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center disabled:opacity-30 transition-colors"
                  title="Move left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemove(index)}
                  className="w-8 h-8 rounded-lg bg-discord-red/80 hover:bg-discord-red text-white flex items-center justify-center transition-colors"
                  title="Remove image"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={() => handleReorder(index, 1)}
                  disabled={index === images.length - 1}
                  className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center disabled:opacity-30 transition-colors"
                  title="Move right"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
              {/* Index badge */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — hidden when all slots are filled */}
      {slotsRemaining > 0 && <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-discord-blurple bg-discord-blurple/5'
            : 'border-gray-700 hover:border-gray-500'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading...
          </div>
        ) : (
          <>
            <svg className="mx-auto mb-3 text-gray-500" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <p className="text-gray-400 text-sm">
              Drag & drop images here, or <span className="text-discord-blurple">browse</span>
            </p>
            <p className="text-gray-600 text-xs mt-1">
              JPG, PNG, GIF, WEBP — up to 25 MB each — {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
            </p>
          </>
        )}
      </div>}
    </div>
  );
}
