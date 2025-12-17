import React, { useState, useEffect, useMemo } from 'react';
import { PromptForm } from './components/PromptForm';
import { PromptCard } from './components/PromptCard';
import { PromptDetail } from './components/PromptDetail';
import { PromptData, PromptType } from './types';
import { savePromptsLocal, loadPromptsLocal, fetchPromptsFromSupabase, savePromptToSupabase, deletePromptFromSupabase } from './services/storage';
import { exportPromptsToDocx } from './services/docxGenerator';
import { Plus, Download, Search, LayoutGrid, FileText, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewedPromptId, setViewedPromptId] = useState<string | null>(null);

  // Filtering state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterModel, setFilterModel] = useState<string>('All');

  // Load data on mount (Local + Cloud)
  useEffect(() => {
    // 1. Load local immediately for speed
    const local = loadPromptsLocal();
    setPrompts(local);

    // 2. Fetch from cloud and update (cloud is source of truth)
    fetchPromptsFromSupabase().then(cloudPrompts => {
      // Always update with cloud data (even if empty) - cloud is source of truth
      setPrompts(cloudPrompts);
      savePromptsLocal(cloudPrompts); // Update local cache
    });
  }, []);

  // Save data on change (only local cache, cloud save is explicit in handlers)
  useEffect(() => {
    if (prompts.length > 0) {
      savePromptsLocal(prompts);
    }
  }, [prompts]);

  const handleSavePrompt = async (newPrompt: PromptData) => {
    // Optimistic update
    const updated = [newPrompt, ...prompts];
    setPrompts(updated);
    savePromptsLocal(updated);
    setShowAddForm(false);

    // Cloud save
    try {
      await savePromptToSupabase(newPrompt);
    } catch (error: any) {
      alert("Pozor: Prompt se uložil jen lokálně, nahrávání do cloudu selhalo.\nChyba: " + error.message);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (window.confirm('Opravdu chcete smazat tento prompt?')) {
      // Optimistic update
      const updated = prompts.filter(p => p.id !== id);
      setPrompts(updated);
      savePromptsLocal(updated);

      // Cloud delete
      try {
        await deletePromptFromSupabase(id);
      } catch (error) {
        console.error("Cloud delete failed", error);
      }

      // Remove from selection if selected
      if (selectedIds.has(id)) {
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      }
    }
  };

  const handleViewPrompt = (id: string) => {
    setViewedPromptId(id);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    const toExport = prompts.filter(p => selectedIds.has(p.id));
    if (toExport.length === 0) return;

    await exportPromptsToDocx(toExport);
    alert('Export dokončen! Soubor by se měl začít stahovat.');
    setSelectedIds(new Set()); // Clear selection after export
  };

  const handleMigrateLocalData = async () => {
    const localPrompts = loadPromptsLocal();
    if (localPrompts.length === 0) {
      alert('Žádná lokální data k migraci.');
      return;
    }

    // Get current Supabase data to avoid duplicates
    const supabasePrompts = await fetchPromptsFromSupabase();
    const supabaseIds = new Set(supabasePrompts.map(p => p.id));

    // Find prompts that are only in local storage
    const promptsToMigrate = localPrompts.filter(p => !supabaseIds.has(p.id));

    if (promptsToMigrate.length === 0) {
      alert('Všechny lokální prompty jsou již v databázi.');
      return;
    }

    if (!window.confirm(`Přenést ${promptsToMigrate.length} promptů z lokálního úložiště do Supabase?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const prompt of promptsToMigrate) {
      try {
        await savePromptToSupabase(prompt);
        successCount++;
      } catch (error) {
        console.error('Chyba při migraci promptu:', prompt.title, error);
        errorCount++;
      }
    }

    alert(`Migrace dokončena!\nÚspěšně: ${successCount}\nChyby: ${errorCount}`);

    // Reload data from Supabase
    const updatedPrompts = await fetchPromptsFromSupabase();
    setPrompts(updatedPrompts);
    savePromptsLocal(updatedPrompts);
  };

  // Derived state for filtering
  const uniqueModels = useMemo(() => {
    const models = new Set(prompts.map(p => p.model));
    return Array.from(models);
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = filterType === 'All' || p.type === filterType;
      const matchesModel = filterModel === 'All' || p.model === filterModel;
      return matchesSearch && matchesType && matchesModel;
    });
  }, [prompts, search, filterType, filterModel]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">

      {/* Mobile Header / Sidebar Toggle could go here */}

      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">Prompt</span>Vault
          </h1>
          <p className="text-xs text-slate-400 mt-1">Správa učebních promptů</p>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg hover:shadow-indigo-500/20 mb-6"
          >
            <Plus size={20} />
            Přidat nový prompt
          </button>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filtrování</h3>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Hledat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Kategorie</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="All">Všechny kategorie</option>
                    {Object.values(PromptType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Model</label>
                  <select
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="All">Všechny modely</option>
                    {uniqueModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
              <h3 className="text-sm font-semibold mb-2">Migrace dat</h3>
              <p className="text-xs text-slate-400 mb-3">
                Přeneste lokálně uložené prompty do cloudu (Supabase).
              </p>
              <button
                onClick={handleMigrateLocalData}
                className="w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-emerald-700 hover:bg-emerald-600 text-white"
              >
                <Upload size={16} />
                Migrovat lokální data
              </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Export</h3>
                <span className="text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded-full">
                  {selectedIds.size} vybráno
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Vyberte karty v knihovně a exportujte je do Wordu pro studenty.
              </p>
              <button
                onClick={handleExport}
                disabled={selectedIds.size === 0}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors
                  ${selectedIds.size > 0
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
              >
                <Download size={16} />
                Exportovat do .docx
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">

        {/* Modal Overlay for Add Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-200">
              <PromptForm
                onSave={handleSavePrompt}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}

        {/* Modal Overlay for Viewing Prompt Detail */}
        {viewedPromptId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full animate-in fade-in zoom-in duration-200">
              <PromptDetail
                prompt={prompts.find(p => p.id === viewedPromptId)!}
                onClose={() => setViewedPromptId(null)}
              />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="text-indigo-600" />
              Knihovna Promptů
            </h2>
            <div className="text-sm text-slate-500">
              Zobrazeno {filteredPrompts.length} z {prompts.length}
            </div>
          </div>

          {prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <FileText className="text-slate-300 mb-4" size={64} />
              <h3 className="text-lg font-medium text-slate-600">Zatím zde nejsou žádné prompty</h3>
              <p className="text-slate-400 mb-6">Začněte přidáním prvního promptu do knihovny.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Přidat první prompt
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPrompts.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isSelected={selectedIds.has(prompt.id)}
                  onToggleSelect={toggleSelection}
                  onDelete={handleDeletePrompt}
                  onView={handleViewPrompt}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
