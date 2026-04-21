import { caseOrder } from '../../data/caseMetadata';
import type { CaseId } from '../../types';
import { isRussianDeclensionModule } from '../contentModules';

const CASE_SET = new Set<string>(caseOrder);

/** Declension keys are `lemmaId:caseId` (see adaptiveEngine). */
export function parseDeclensionCaseId(formKey: string): CaseId | null {
  const parts = formKey.split(':');
  if (parts.length < 2) return null;
  const caseId = parts[parts.length - 1] as CaseId;
  return CASE_SET.has(caseId) ? caseId : null;
}

export function isVocabularyFormKey(formKey: string): boolean {
  return formKey.startsWith('vocab:');
}

export function isDeclensionContentModule(contentModule: string | null | undefined): boolean {
  return isRussianDeclensionModule(contentModule ?? 'russian_declension');
}
