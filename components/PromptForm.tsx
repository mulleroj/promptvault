import React, { useState, useRef, useEffect } from 'react';
import { PromptData, PromptType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Upload, X, Save, FileText, Loader2 } from 'lucide-react';
import { importFileContent } from '../services/documentImporter';

interface PromptFormProps {
  onSave: (prompt: PromptData) => void;
  onCancel: () => void;
  initialPrompt?: PromptData | null; // For editing
}

export const PromptForm: React.FC<PromptFormProps> = ({ onSave, onCancel, initialPrompt }) => {
  const [title, setTitle] = useState(initialPrompt?.title || '');
  const [content, setContent] = useState(initialPrompt?.content || '');
  const [type, setType] = useState<PromptType>(initialPrompt?.type || PromptType.TEXT);
  const [model, setModel] = useState(initialPrompt?.model || '');
  const [tags, setTags] = useState(initialPrompt ? initialPrompt.tags.join(', ') : '');
  const [notes, setNotes] = useState(initialPrompt?.notes || '');
  const [imageBase64, setImageBase64] = useState<string | null>(initialPrompt?.imageBase64 || null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Update form when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      setTitle(initialPrompt.title);
      setContent(initialPrompt.content);
      setType(initialPrompt.type);
      setModel(initialPrompt.model);
      setTags(initialPrompt.tags.join(', '));
      setNotes(initialPrompt.notes || '');
      setImageBase64(initialPrompt.imageBase64);
    }
  }, [initialPrompt]);

  const handleDocImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importFileContent(file);
      setContent(prev => prev ? prev + '\n\n' + result.content : result.content);

      // Auto-fill title if empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Nepodařilo se importovat soubor. Ujistěte se, že jde o platný .docx, .pdf nebo .txt soubor.");
    } finally {
      setIsImporting(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check size (limit to 1MB for localStorage safety)
      if (file.size > 1024 * 1024) {
        alert("Obrázek je příliš velký. Maximální velikost je 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !model) {
      alert("Vyplňte prosím Název, Prompt a Model.");
      return;
    }

    const newPrompt: PromptData = {
      id: initialPrompt?.id || uuidv4(), // Keep existing ID if editing
      title,
      content,
      type,
      model,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      imageBase64,
      notes,
      createdAt: initialPrompt?.createdAt || Date.now(), // Keep original createdAt if editing
      isFavorite: initialPrompt?.isFavorite || false, // Preserve favorite status
    };

    onSave(newPrompt);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-h-[85vh] flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-slate-200 flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">
          {initialPrompt ? 'Upravit prompt' : 'Přidat nový prompt'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-6 flex-1">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Název promptu *</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="např. Generátor sci-fi příběhů"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-700">Text promptu (Multiline) *</label>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
              disabled={isImporting}
            >
              {isImporting ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              Importovat z dokumentu
            </button>
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocImport}
              accept=".docx,.pdf,.txt,.md"
              className="hidden"
            />
          </div>
          <textarea
            className="w-full p-2 border border-slate-300 rounded-md h-32 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Zde vložte text promptu..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
            <select
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={type}
              onChange={(e) => setType(e.target.value as PromptType)}
            >
              {Object.values(PromptType).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="např. Midjourney v6"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Štítky (oddělené čárkou)</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="kreativita, psaní, studenti..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ukázkový obrázek</label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 flex items-center gap-2 border border-slate-300 transition-colors"
            >
              <Upload size={18} /> Nahrát obrázek
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            {imageBase64 && (
              <div className="relative group">
                <img src={imageBase64} alt="Preview" className="h-12 w-12 object-cover rounded-md border border-slate-300" />
                <button
                  type="button"
                  onClick={() => setImageBase64(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (max 1MB)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Poznámky pro studenty</label>
          <textarea
            className="w-full p-2 border border-slate-300 rounded-md h-20 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tipy k nastavení parametrů..."
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Zrušit
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save size={18} /> Uložit prompt
          </button>
        </div>
      </form>
    </div>
  );
};
