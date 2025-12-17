import { PromptData } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'promptvault_db';

// --- Local Storage Helpers ---

export const savePromptsLocal = (prompts: PromptData[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.warn("Failed to save to local storage (quota might be full)", error);
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

