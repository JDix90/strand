import type { ClassCurriculumRow } from '../curriculumApi';

/** Visible unit ids for a class (curriculum rows the student/teacher see). */
export function visibleClassUnitIds(rows: ClassCurriculumRow[]): Set<string> {
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.is_visible) ids.add(r.unit_id);
  }
  return ids;
}
