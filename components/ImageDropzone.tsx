import React, { useState } from 'react';
import { IconUpload, IconCamera, IconTrash, IconCrop } from './Icons';
import type { CardData, CardSide } from '../types';

const ImageDropzone: React.FC<{
    card: CardData;
    side: CardSide;
    onFileSelect: (file: File, cardId: string, side: CardSide) => void;
    onCameraOpen: (cardId: string, side: CardSide) => void;
    onRemove: (cardId: string, side: CardSide) => void;
    onEdit: (cardId: string, side: CardSide) => void;
}> = ({ card, side, onFileSelect, onCameraOpen, onRemove, onEdit }) => {
    const [isDragging, setIsDragging] = useState(false);
    const preview = side === 'front' ? card.frontImagePreview : card.backImagePreview;

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0] && files[0].type.startsWith('image/')) {
            onFileSelect(files[0], card.id, side);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    };

    if (preview) {
        return (
            <div className="relative w-full aspect-[10/6] group">
                <img src={preview} alt={`${side} preview`} className="w-full h-full object-cover rounded-xl shadow-inner" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-xl">
                    <button
                        onClick={() => onEdit(card.id, side)}
                        className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors shadow-lg"
                        aria-label={`Edit ${side} image`}
                    >
                        <IconCrop className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onRemove(card.id, side)}
                        className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        aria-label={`Remove ${side} image`}
                    >
                        <IconTrash className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onDrop={handleDrop}
            onDragEnter={handleDragEvents}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragEvents}
            className={`relative w-full aspect-[10/6] flex flex-col items-center justify-center p-4 text-center rounded-xl transition-colors duration-300 border-2 border-dashed ${isDragging ? 'bg-blue-50 border-blue-400' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
        >
            <input
                id={`file-upload-${card.id}-${side}`}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFileChange(e.target.files)}
            />
            <label htmlFor={`file-upload-${card.id}-${side}`} className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-slate-500 hover:text-slate-700 transition-colors">
                <IconUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-3 text-slate-400" />
                <p className="text-sm font-semibold capitalize tracking-wide">{side} Side</p>
                <p className="text-xs text-slate-400">Tap or drag file</p>
            </label>
            <button
                onClick={() => onCameraOpen(card.id, side)}
                className="absolute bottom-2.5 right-2.5 bg-white text-slate-600 rounded-full p-1.5 sm:p-2 hover:bg-slate-50 transition-colors border border-slate-300 shadow"
                aria-label={`Scan ${side} with camera`}
            >
                <IconCamera className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );
};

export default ImageDropzone;