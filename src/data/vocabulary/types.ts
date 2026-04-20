/** Part of speech for distractor selection and future drills. */
export type VocabPos = 'noun' | 'verb' | 'adj' | 'other';

/** One learnable lemma in a vocabulary deck (repo source of truth). */
export interface VocabEntry {
  /** Unique across entire vocabulary corpus (ASCII slug). */
  lemmaId: string;
  /** Russian headword (include stress marks when pedagogically useful). */
  ru: string;
  /** Primary English gloss for MC prompts. */
  en: string;
  pos: VocabPos;
  /** Deck key — matches `units.content_config.vocabularySetId`. */
  vocabularySetId: string;
  /** Optional accepted variants for typing mode later. */
  acceptedEn?: string[];
}

export interface VocabSubcategoryMeta {
  id: string;
  label: string;
  /** Stable id for curriculum units and lazy deck chunks. */
  vocabularySetId: string;
}

export interface VocabCategoryMeta {
  id: string;
  label: string;
  sortOrder: number;
  subcategories: VocabSubcategoryMeta[];
}
