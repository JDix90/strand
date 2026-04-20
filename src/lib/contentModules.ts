import type { CaseId, ModeId, WordCategory } from '../types';
import {
  RUSSIAN_DECLENSION_MODULE,
  VOCABULARY_MODULE,
  VOCABULARY_STUB_MODULE,
} from './curriculumConstants';

export interface RussianDeclensionUnitConfig {
  caseIds: CaseId[];
  categories: WordCategory[];
}

/** `units.content_config` for vocabulary (and legacy `deckId`). */
export interface VocabularyUnitConfig {
  vocabularySetId?: string;
  /** @deprecated use vocabularySetId */
  deckId?: string;
  sessionLength?: number;
  direction?: 'ru-en' | 'en-ru';
}

export type UnitContentConfig = RussianDeclensionUnitConfig | VocabularyUnitConfig | Record<string, unknown>;

const ALL_CASES: CaseId[] = [
  'nominative',
  'genitive',
  'dative',
  'accusative',
  'instrumental',
  'prepositional',
];

const ALL_CATEGORIES: WordCategory[] = ['pronoun', 'name', 'noun'];

export function parseRussianDeclensionConfig(raw: unknown): RussianDeclensionUnitConfig {
  if (!raw || typeof raw !== 'object') {
    return { caseIds: ALL_CASES, categories: ALL_CATEGORIES };
  }
  const o = raw as Record<string, unknown>;
  const caseIds = Array.isArray(o.caseIds)
    ? (o.caseIds.filter(c => typeof c === 'string') as CaseId[])
    : ALL_CASES;
  const categories = Array.isArray(o.categories)
    ? (o.categories.filter(c => typeof c === 'string') as WordCategory[])
    : ALL_CATEGORIES;
  return {
    caseIds: caseIds.length > 0 ? caseIds : ALL_CASES,
    categories: categories.length > 0 ? categories : ALL_CATEGORIES,
  };
}

export function isVocabularyModule(moduleId: string): boolean {
  return moduleId === VOCABULARY_MODULE || moduleId === VOCABULARY_STUB_MODULE;
}

/** Modes supported per module (vocabulary: practice + learn placeholder). */
export function modesForContentModule(moduleId: string): ModeId[] {
  if (isVocabularyModule(moduleId)) {
    return ['practice', 'learn_table'];
  }
  return ['learn_table', 'practice', 'speed_round', 'boss_battle', 'memory_match', 'grid_challenge'];
}

export function isRussianDeclensionModule(moduleId: string): boolean {
  return moduleId === RUSSIAN_DECLENSION_MODULE;
}
