import type { ClassCurriculumRow, UnitRow } from './curriculumApi';
import { isVocabularyModule } from './contentModules';

export function getUnitFromRow(row: ClassCurriculumRow): UnitRow | null {
  const u = row.units;
  const unit = Array.isArray(u) ? u[0] : u;
  return unit ?? null;
}

export function isVocabularyCurriculumRow(row: ClassCurriculumRow): boolean {
  const u = getUnitFromRow(row);
  return u != null && isVocabularyModule(u.content_module);
}

/** One sidebar/home entry for all vocabulary units, or a single non-vocab unit row. */
export type CurriculumNavItem =
  | { kind: 'unit'; row: ClassCurriculumRow }
  | { kind: 'vocabulary_hub'; rows: ClassCurriculumRow[] };

/**
 * Collapses consecutive vocabulary rows (in `orderedRows` order) into one hub item
 * at the position of the first vocabulary row.
 */
export function buildCurriculumNavItems(orderedRows: ClassCurriculumRow[]): CurriculumNavItem[] {
  const vocabRows = orderedRows.filter(isVocabularyCurriculumRow);
  if (vocabRows.length === 0) {
    return orderedRows.map(row => ({ kind: 'unit' as const, row }));
  }
  const out: CurriculumNavItem[] = [];
  let hubAdded = false;
  for (const row of orderedRows) {
    if (isVocabularyCurriculumRow(row)) {
      if (!hubAdded) {
        out.push({ kind: 'vocabulary_hub', rows: vocabRows });
        hubAdded = true;
      }
    } else {
      out.push({ kind: 'unit', row });
    }
  }
  return out;
}
