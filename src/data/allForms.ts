import type { DeclensionForm, WordCategory, PronounLemmaId } from '../types';
import { pronounForms } from './pronounForms';
import { nameForms } from './nameForms';
import { nounForms } from './nounForms';

export const allForms: DeclensionForm[] = [
  ...pronounForms,
  ...nameForms,
  ...nounForms,
];

const formByLemmaCase = new Map<string, DeclensionForm>();
const formsByCategory = new Map<WordCategory, DeclensionForm[]>();
const formsByLemma = new Map<string, DeclensionForm[]>();
const formsByCase = new Map<string, DeclensionForm[]>();

for (const form of allForms) {
  formByLemmaCase.set(`${form.lemmaId}:${form.caseId}`, form);

  const byCategory = formsByCategory.get(form.category);
  if (byCategory) byCategory.push(form);
  else formsByCategory.set(form.category, [form]);

  const byLemma = formsByLemma.get(form.lemmaId);
  if (byLemma) byLemma.push(form);
  else formsByLemma.set(form.lemmaId, [form]);

  const byCase = formsByCase.get(form.caseId);
  if (byCase) byCase.push(form);
  else formsByCase.set(form.caseId, [form]);
}

export function getFormsByCategory(category: WordCategory): DeclensionForm[] {
  return formsByCategory.get(category) ?? [];
}

export function getFormsByCategories(categories: WordCategory[]): DeclensionForm[] {
  const out: DeclensionForm[] = [];
  for (const category of categories) {
    const forms = formsByCategory.get(category);
    if (forms) out.push(...forms);
  }
  return out;
}

export function getForm(lemmaId: string, caseId: string): DeclensionForm | undefined {
  return formByLemmaCase.get(`${lemmaId}:${caseId}`);
}

export function getFormsForLemma(lemmaId: string): DeclensionForm[] {
  return formsByLemma.get(lemmaId) ?? [];
}

export function getFormsForCase(caseId: string): DeclensionForm[] {
  return formsByCase.get(caseId) ?? [];
}

export interface LemmaInfo {
  lemmaId: string;
  lemmaDisplay: string;
  englishGloss: string;
  category: WordCategory;
  gender?: string;
}

export function getLemmasByCategory(category: WordCategory): LemmaInfo[] {
  const seen = new Set<string>();
  const result: LemmaInfo[] = [];
  for (const f of allForms) {
    if (f.category === category && !seen.has(f.lemmaId)) {
      seen.add(f.lemmaId);
      result.push({
        lemmaId: f.lemmaId,
        lemmaDisplay: f.lemmaDisplay,
        englishGloss: f.englishGloss,
        category: f.category,
        gender: f.gender,
      });
    }
  }
  return result;
}

export function getLemmasByCategories(categories: WordCategory[]): LemmaInfo[] {
  const seen = new Set<string>();
  const result: LemmaInfo[] = [];
  for (const f of allForms) {
    if (categories.includes(f.category) && !seen.has(f.lemmaId)) {
      seen.add(f.lemmaId);
      result.push({
        lemmaId: f.lemmaId,
        lemmaDisplay: f.lemmaDisplay,
        englishGloss: f.englishGloss,
        category: f.category,
        gender: f.gender,
      });
    }
  }
  return result;
}

export function getAllLemmaIds(): string[] {
  return [...new Set(allForms.map(f => f.lemmaId))];
}

export function getTotalFormCount(categories: WordCategory[]): number {
  return allForms.filter(f => categories.includes(f.category)).length;
}

export const PRONOUN_LEMMA_ORDER: PronounLemmaId[] = ['ya', 'ty', 'on', 'ona', 'ono', 'my', 'vy', 'oni'];

export const LEMMA_LABELS: Record<string, string> = Object.fromEntries(
  allForms
    .filter(f => f.caseId === 'nominative')
    .map(f => [f.lemmaId, f.lemmaDisplay])
);

export const LEMMA_GLOSS: Record<string, string> = Object.fromEntries(
  allForms
    .filter(f => f.caseId === 'nominative')
    .map(f => [f.lemmaId, f.englishGloss])
);

export const CATEGORY_LABELS: Record<WordCategory, { label: string; icon: string }> = {
  pronoun: { label: 'Pronouns', icon: '👤' },
  name: { label: 'Names', icon: '🏷️' },
  noun: { label: 'Nouns', icon: '📦' },
};
