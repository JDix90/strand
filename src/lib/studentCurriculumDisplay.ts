import type { ClassCurriculumRow, UnitRow } from './curriculumApi';
import { isRussianDeclensionModule, isVocabularyModule } from './contentModules';

export function getUnitFromRow(row: ClassCurriculumRow): UnitRow | null {
  const u = row.units;
  const unit = Array.isArray(u) ? u[0] : u;
  return unit ?? null;
}

export function isVocabularyCurriculumRow(row: ClassCurriculumRow): boolean {
  const u = getUnitFromRow(row);
  return u != null && isVocabularyModule(u.content_module);
}

export function isGrammarCasesRow(row: ClassCurriculumRow): boolean {
  const u = getUnitFromRow(row);
  return u != null && isRussianDeclensionModule(u.content_module);
}

/** One sidebar/home entry for all vocabulary units, one for grammar/cases rows, or a single unit row. */
export type CurriculumNavItem =
  | { kind: 'unit'; row: ClassCurriculumRow }
  | { kind: 'vocabulary_hub'; rows: ClassCurriculumRow[] }
  | { kind: 'cases_hub'; rows: ClassCurriculumRow[] };

/**
 * Collapses consecutive vocabulary rows (in `orderedRows` order) into one hub item
 * at the position of the first vocabulary row.
 */
export function buildCurriculumNavItems(orderedRows: ClassCurriculumRow[]): CurriculumNavItem[] {
  const vocabRows = orderedRows.filter(isVocabularyCurriculumRow);
  const casesRows = orderedRows.filter(isGrammarCasesRow);
  if (vocabRows.length === 0 && casesRows.length === 0) {
    return orderedRows.map(row => ({ kind: 'unit' as const, row }));
  }
  const out: CurriculumNavItem[] = [];
  let vocabHubAdded = false;
  let casesHubAdded = false;
  for (const row of orderedRows) {
    if (isVocabularyCurriculumRow(row)) {
      if (!vocabHubAdded) {
        out.push({ kind: 'vocabulary_hub', rows: vocabRows });
        vocabHubAdded = true;
      }
    } else if (isGrammarCasesRow(row)) {
      if (!casesHubAdded) {
        out.push({ kind: 'cases_hub', rows: casesRows });
        casesHubAdded = true;
      }
    } else {
      out.push({ kind: 'unit', row });
    }
  }
  return out;
}
