import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { IconX, IconCrop as IconCropTool } from './Icons';

// --- Utility functions for react-image-crop ---

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  const mediaAspect = mediaWidth / mediaHeight;
  let width, height;

  if (mediaAspect > aspect) {
    width = mediaHeight * aspect;
    height = mediaHeight;
  } else {
    width = mediaWidth;
    height = mediaWidth / aspect;
  }

  const x = (mediaWidth - width) / 2;
  const y = (mediaHeight - height) / 2;

  return {
    unit: '%',
    x: (x / mediaWidth) * 100,
    y: (y / mediaHeight) * 100,
    width: (width / mediaWidth) * 100,
    height: (height / mediaHeight) * 100,
  };
}

async function getCroppedImg(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  originalFile: File,
): Promise<File | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }
  
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(pixelCrop.width * scaleX);
  canvas.height = Math.floor(pixelCrop.height * scaleY);

  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const croppedFile = new File([blob], `cropped_${originalFile.name}`, {
        type: originalFile.type,
        lastModified: Date.now(),
      });
      resolve(croppedFile);
    }, originalFile.type, 0.92);
  });
}


// --- Component ---

interface CropModalProps {
  onClose: () => void;
  onConfirm: (file: File) => void;
  imageSrc: string;
  originalFile: File;
}

const PRESETS = [
    { name: 'Free', value: undefined },
    { name: 'Card', value: 3.5 / 2 },
    { name: '16:9', value: 16 / 9 },
    { name: '4:3', value: 4 / 3 },
    { name: '1:1', value: 1 },
];

export const CropModal: React.FC<CropModalProps> = ({ onClose, onConfirm, imageSrc, originalFile }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(3.5/2);
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, aspect || (width/height));
    setCrop(initialCrop);
    setCompletedCrop({ // Manually set initial completed crop
        ...initialCrop,
        unit: 'px',
        width: (initialCrop.width / 100) * width,
        height: (initialCrop.height / 100) * height,
        x: (initialCrop.x / 100) * width,
        y: (initialCrop.y / 100) * height,
    });
  }
  
  const handleConfirmCrop = async () => {
    if (completedCrop && imgRef.current) {
        try {
            const croppedFile = await getCroppedImg(imgRef.current, completedCrop, originalFile);
            if (croppedFile) {
                onConfirm(croppedFile);
            }
        } catch(e) {
            console.error('Error cropping image:', e);
            // Optionally, show an error to the user
        }
    }
  };

  const handleResetCrop = () => {
    if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, aspect || width / height);
        setCrop(newCrop);
        // Also update the completed crop state to reflect the reset
        setCompletedCrop({
            ...newCrop,
            unit: 'px',
            width: (newCrop.width / 100) * width,
            height: (newCrop.height / 100) * height,
            x: (newCrop.x / 100) * width,
            y: (newCrop.y / 100) * height,
        });
    }
  };

  const handlePresetClick = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, newAspect || width / height);
        setCrop(newCrop);
        // Manually trigger a completed crop update
        setCompletedCrop({
            ...newCrop,
            unit: 'px',
            width: (newCrop.width / 100) * width,
            height: (newCrop.height / 100) * height,
            x: (newCrop.x / 100) * width,
            y: (newCrop.y / 100) * height,
        });
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
        
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2 text-white">
                <IconCropTool className="w-5 h-5 text-blue-400"/>
                <h2 className="text-lg font-bold">Crop Image</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 bg-slate-700/50 rounded-full p-2 hover:bg-slate-600 transition-colors">
                <IconX className="w-5 h-5" />
            </button>
        </header>

        <main className="p-4 flex-grow overflow-y-auto">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="w-full h-full [&>div]:flex [&>div]:justify-center"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                onLoad={onImageLoad}
                className="max-h-[55vh] object-contain"
              />
            </ReactCrop>
        </main>
        
        <footer className="p-4 bg-slate-900/50 border-t border-slate-700 flex-shrink-0 space-y-4">
            <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Aspect Ratio</p>
                <div className="flex bg-slate-700 rounded-xl p-1 border border-slate-600 space-x-1">
                    {PRESETS.map(p => (
                        <button
                            key={p.name}
                            onClick={() => handlePresetClick(p.value)}
                            className={`w-full py-1.5 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-700 ${aspect === p.value ? `bg-blue-600 text-white shadow-sm ring-blue-500` : 'text-slate-300 hover:bg-slate-600'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-end gap-3">
                <button onClick={handleResetCrop} className="py-2.5 px-5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-600/50 text-sm mr-auto">
                    Reset
                </button>
                <button onClick={onClose} className="py-2.5 px-5 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-500/50 text-sm">
                    Cancel
                </button>
                <button
                    onClick={handleConfirmCrop}
                    disabled={!completedCrop?.width || !completedCrop?.height}
                    className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Confirm Crop
                </button>
            </div>
        </footer>

      </div>
    </div>
  );
};