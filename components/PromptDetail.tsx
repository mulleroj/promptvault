import React, { useState } from 'react';
import { PromptData } from '../types';
import { X, Copy, Check, Calendar, Tag, Bot, FileStack, Edit, Trash2 } from 'lucide-react';

interface PromptDetailProps {
    prompt: PromptData;
    onClose: () => void;
    onClone: (prompt: PromptData) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    isAdmin: boolean;
}

export const PromptDetail: React.FC<PromptDetailProps> = ({ prompt, onClose, onClone, onEdit, onDelete, isAdmin }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(prompt.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-h-[85vh] flex flex-col max-w-3xl w-full">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-200 flex-shrink-0">
                <div className="flex-1 pr-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{prompt.title}</h2>
                    <div className="flex items-center gap-3 flex-wrap text-sm">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {prompt.type}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-600">
                            <Bot size={14} />
                            {prompt.model}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                            <Calendar size={14} />
                            {new Date(prompt.createdAt).toLocaleDateString('cs-CZ')}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 flex-1 space-y-6">

                {/* Image Preview */}
                {prompt.imageBase64 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Ukázkový obrázek</h3>
                        <img
                            src={prompt.imageBase64}
                            alt={prompt.title}
                            className="w-full rounded-lg border border-slate-200 shadow-sm"
                        />
                    </div>
                )}

                {/* Prompt Content */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Text promptu</h3>
                        <button
                            onClick={handleCopyPrompt}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check size={16} className="text-green-600" />
                                    Zkopírováno!
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    Kopírovat
                                </>
                            )}
                        </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
                            {prompt.content}
                        </pre>
                    </div>
                </div>

                {/* Tags */}
                {prompt.tags.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <Tag size={14} />
                            Štítky
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {prompt.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {prompt.notes && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Poznámky pro studenty</h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {prompt.notes}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => { onEdit(prompt.id); onClose(); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Edit size={16} />
                                Upravit
                            </button>
                            <button
                                onClick={() => { onDelete(prompt.id); onClose(); }}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Smazat
                            </button>
                            <button
                                onClick={() => { onClone(prompt); onClose(); }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <FileStack size={16} />
                                Klonovat
                            </button>
                        </>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                    Zavřít
                </button>
            </div>
        </div>
    );
};
