import React from 'react';
import type { CardData, CardSide, Priority } from '../types';
import { IconChevronUp, IconChevronDown, IconTrash } from './Icons';
import ImageDropzone from './ImageDropzone';


const CardForm: React.FC<{
  card: CardData;
  index: number;
  onUpdate: (id: string, field: keyof CardData, value: any) => void;
  onRemove: (id:string) => void;
  onFileSelect: (file: File, cardId: string, side: CardSide) => void;
  onCameraOpen: (cardId: string, side: CardSide) => void;
  onRemoveImage: (cardId: string, side: CardSide) => void;
  onEditImage: (cardId: string, side: CardSide) => void;
}> = ({ card, index, onUpdate, onRemove, onFileSelect, onCameraOpen, onRemoveImage, onEditImage }) => {
    const priorities: Priority[] = ['Low', 'Medium', 'High'];
    const priorityColors: Record<Priority, string> = {
        Low:    'bg-green-100 text-green-800 ring-green-500',
        Medium: 'bg-yellow-100 text-yellow-800 ring-yellow-500',
        High:   'bg-red-100 text-red-800 ring-red-500',
    };

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-lg shadow-slate-200/50 border border-slate-200/80">
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-base sm:text-lg text-slate-700 tracking-wide">Card #{index + 1}</h3>
                <button onClick={() => onRemove(card.id)} className="text-slate-400 hover:text-red-500 transition-colors" aria-label={`Remove Card ${index + 1}`}>
                    <IconTrash className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>

            <ImageDropzone card={card} side="front" onFileSelect={onFileSelect} onCameraOpen={onCameraOpen} onRemove={onRemoveImage} onEdit={onEditImage} />

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${card.showBack ? 'max-h-96 opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
                <ImageDropzone card={card} side="back" onFileSelect={onFileSelect} onCameraOpen={onCameraOpen} onRemove={onRemoveImage} onEdit={onEditImage} />
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6 text-sm text-blue-600 font-medium pt-1">
                <button onClick={() => onUpdate(card.id, 'showBack', !card.showBack)} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                    {card.showBack ? <IconChevronUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/> : <IconChevronDown className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/>}
                    <span>{card.showBack ? 'Hide Back' : 'Add Back Side'}</span>
                </button>
                <button onClick={() => onUpdate(card.id, 'showDetails', !card.showDetails)} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                    {card.showDetails ? <IconChevronUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/> : <IconChevronDown className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/>}
                    <span>{card.showDetails ? 'Hide Details' : 'Add Details'}</span>
                </button>
            </div>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${card.showDetails ? 'max-h-96 opacity-100 visible pt-4 border-t border-slate-200/80' : 'max-h-0 opacity-0 invisible'}`}>
                <div className="space-y-4">
                     <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Priority</label>
                        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                            {priorities.map(p => (
                                <button
                                    key={p}
                                    onClick={() => onUpdate(card.id, 'priority', p)}
                                    className={`w-full py-1.5 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-100 ${card.priority === p ? `${priorityColors[p]} shadow-sm` : 'text-slate-500 hover:bg-white/70'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor={`notes-${card.id}`} className="text-sm font-medium text-slate-600 mb-2 block">Notes</label>
                        <textarea
                            id={`notes-${card.id}`}
                            value={card.notes}
                            onChange={(e) => onUpdate(card.id, 'notes', e.target.value)}
                            placeholder="e.g., Follow up next week..."
                            rows={3}
                            className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-800 text-sm placeholder-slate-400 placeholder:text-xs sm:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
};

export default CardForm;