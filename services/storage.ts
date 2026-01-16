import { PromptData } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'promptvault_db';
const MAX_LOCAL_STORAGE_MB = 4; // Conservative limit (browser typically allows 5-10MB)

// --- Local Storage Helpers ---

export const savePromptsLocal = (prompts: PromptData[]): void => {
  try {
    const dataString = JSON.stringify(prompts);
    const sizeInMB = new Blob([dataString]).size / (1024 * 1024);

    // If data is too large, warn and skip
    if (sizeInMB > MAX_LOCAL_STORAGE_MB) {
      console.warn(
        `⚠️ Data příliš velká pro localStorage (${sizeInMB.toFixed(2)}MB). ` +
        `Používejte cloud storage (Supabase) pro velké knihovny.`
      );
      return;
    }

    localStorage.setItem(STORAGE_KEY, dataString);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.warn(
        "⚠️ LocalStorage je plný. Cloud (Supabase) je hlavní úložiště. " +
        "Lokální kopie slouží jen pro rychlé načtení."
      );
      // Clear old data to prevent repeated errors
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.info("✓ Vyčistil jsem starý cache");
      } catch (e) {
        // If even removal fails, ignore
      }
    } else {
      console.warn("Failed to save to local storage", error);
    }
  }
};

export const loadPromptsLocal = (): PromptData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// --- Supabase Helpers ---

export const fetchPromptsFromSupabase = async (): Promise<PromptData[]> => {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  // Convert snake_case from DB to camelCase for App
  return data.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    type: item.type,
    model: item.model,
    tags: item.tags || [],
    imageBase64: item.image_base64,
    notes: item.notes || '',
    createdAt: new Date(item.created_at).getTime(), // Parse ISO string to timestamp
    isFavorite: item.is_favorite || false
  }));
};


export const savePromptToSupabase = async (prompt: PromptData): Promise<void> => {
  // Convert timestamp to ISO string for timestamptz column
  const createdAtDate = typeof prompt.createdAt === 'number'
    ? new Date(prompt.createdAt)
    : new Date(prompt.createdAt);

  const dbItem = {
    id: prompt.id,
    title: prompt.title,
    content: prompt.content,
    type: prompt.type,
    model: prompt.model,
    tags: prompt.tags || [], // Ensure array
    image_base64: prompt.imageBase64 || null, // Explicit null
    notes: prompt.notes || null,
    created_at: createdAtDate.toISOString(), // ISO string for timestamptz
    is_favorite: prompt.isFavorite || false
  };

  const { error } = await supabase
    .from('prompts')
    .upsert(dbItem, { onConflict: 'id' });

  if (error) {
    console.error('Error saving prompt to Supabase:', error);
    throw new Error(error.message + ' (' + error.details + ')');
  }
};


export const deletePromptFromSupabase = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting prompt from Supabase:', error);
    throw error;
  }
};


export const toggleFavoriteInSupabase = async (id: string, isFavorite: boolean): Promise<void> => {
  const { error } = await supabase
    .from('prompts')
    .update({ is_favorite: isFavorite })
    .eq('id', id);

  if (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};


export const exportAllPrompts = (prompts: PromptData[]): string => {
  return JSON.stringify(prompts, null, 2);
};


export const importPromptsData = (jsonData: string): PromptData[] => {
  try {
    const parsed = JSON.parse(jsonData);
    if (Array.isArray(parsed)) {
      return parsed as PromptData[];
    }
    throw new Error('Invalid format: expected array');
  } catch (error) {
    console.error('Error parsing import data:', error);
    throw new Error('Neplatný formát JSON souboru');
  }
};

