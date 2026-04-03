import type { CaseId, ModeId, WordCategory } from '../types';
import { RUSSIAN_DECLENSION_MODULE, VOCABULARY_STUB_MODULE } from './curriculumConstants';

export interface RussianDeclensionUnitConfig {
  caseIds: CaseId[];
  categories: WordCategory[];
}

export interface VocabularyStubUnitConfig {
  deckId?: string;
}

export type UnitContentConfig = RussianDeclensionUnitConfig | VocabularyStubUnitConfig | Record<string, unknown>;

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

/** Modes supported per module (vocabulary stub uses a subset for now). */
export function modesForContentModule(moduleId: string): ModeId[] {
  if (moduleId === VOCABULARY_STUB_MODULE) {
    return ['practice', 'learn_table'];
  }
  return ['learn_table', 'practice', 'speed_round', 'boss_battle', 'memory_match', 'grid_challenge'];
}

export function isRussianDeclensionModule(moduleId: string): boolean {
  return moduleId === RUSSIAN_DECLENSION_MODULE;
}
