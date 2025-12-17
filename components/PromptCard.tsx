import React from 'react';
import { PromptData } from '../types';
import { Image as ImageIcon, FileText, CheckCircle, Star, Copy } from 'lucide-react';

interface PromptCardProps {
  prompt: PromptData;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (content: string) => void;
  onEdit: (id: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, isSelected, onToggleSelect, onDelete, onView, onToggleFavorite, onCopy, onEdit }) => {
  return (
    <div
      className={`prompt-card relative border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer
        ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}
      onClick={() => onToggleSelect(prompt.id)}
    >
      {/* Selection Checkbox Visual */}
      <div className="absolute top-3 right-3 z-10">
        {isSelected ? (
          <CheckCircle className="text-indigo-600 fill-white" size={24} />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white/80 hover:border-indigo-400 transition-colors" />
        )}
      </div>

      {/* Image Preview Area */}
      <div className="h-32 w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
        {prompt.imageBase64 ? (
          <img src={prompt.imageBase64} alt={prompt.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <ImageIcon size={32} />
            <span className="text-xs mt-1">Bez obrázku</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
              {prompt.type}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
              className="transition-colors"
              title={prompt.isFavorite ? 'Odstranit z oblíbených' : 'Přidat do oblíbených'}
            >
              <Star
                size={16}
                className={prompt.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}
              />
            </button>
          </div>
          <span className="text-xs text-slate-500font-medium">{prompt.model}</span>
        </div>

        <h3 className="font-bold text-slate-800 mb-1 truncate" title={prompt.title}>{prompt.title}</h3>

        <p className="text-sm text-slate-500 line-clamp-2 font-mono bg-slate-50 p-1.5 rounded border border-slate-100 mb-3">
          {prompt.content}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {prompt.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 text-slate-400">+{prompt.tags.length - 3}</span>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 mt-2">
          <div className="flex gap-2 mb-2">
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(prompt.content); }}
              className="text-xs text-slate-600 hover:text-indigo-600 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors flex items-center gap-1"
              title="Zkopírovat prompt"
            >
              <Copy size={12} />
              Kopírovat
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onView(prompt.id); }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
            >
              Zobrazit
            </button>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold">
            {new Date(prompt.createdAt).toLocaleDateString('cs-CZ')}
          </div>
        </div>
      </div>
    </div>
  );
};
