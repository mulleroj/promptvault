export enum PromptType {
  TEXT = 'Text',
  IMAGE = 'Generování Obrázků',
  VIDEO = 'Video',
  AUDIO = 'Audio',
  OTHER = 'Ostatní',
}

export interface PromptData {
  id: string;
  title: string;
  content: string;
  type: PromptType;
  model: string;
  tags: string[];
  imageBase64: string | null;
  notes: string;
  createdAt: number;
}

export interface PromptFilter {
  type: string; // 'All' or PromptType
  model: string; // 'All' or specific model
  search: string;
}
