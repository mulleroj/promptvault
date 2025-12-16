import { PromptData } from '../types';

const STORAGE_KEY = 'promptvault_db';

export const savePrompts = (prompts: PromptData[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error("Failed to save prompts to local storage", error);
    alert("Chyba: Data se nepodařilo uložit. Pravděpodobně je obrázek příliš velký pro prohlížeč.");
  }
};

export const loadPrompts = (): PromptData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load prompts", error);
    return [];
  }
};
