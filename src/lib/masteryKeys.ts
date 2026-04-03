import { DEFAULT_RUSSIAN_UNIT_ID } from './curriculumConstants';
import type { MasteryRecord } from '../types';

export function filterMasteryRecordsByUnit(
  records: Record<string, MasteryRecord>,
  unitId: string
): Record<string, MasteryRecord> {
  const prefix = `${unitId}::`;
  const out: Record<string, MasteryRecord> = {};
  for (const [k, r] of Object.entries(records)) {
    if (k.startsWith(prefix)) out[k] = r;
  }
  return out;
}

const SEP = '::';

export function masteryStorageKey(unitId: string | undefined | null, formKey: string): string {
  const u = unitId ?? DEFAULT_RUSSIAN_UNIT_ID;
  return `${u}${SEP}${formKey}`;
}

export function parseMasteryStorageKey(key: string): { unitId: string; formKey: string } {
  const i = key.indexOf(SEP);
  if (i === -1) {
    return { unitId: DEFAULT_RUSSIAN_UNIT_ID, formKey: key };
  }
  return { unitId: key.slice(0, i), formKey: key.slice(i + SEP.length) };
}

export function normalizeMasteryRecord(r: MasteryRecord): MasteryRecord {
  const unitId = r.unitId ?? DEFAULT_RUSSIAN_UNIT_ID;
  const contentModule = r.contentModule ?? 'russian_declension';
  if (unitId === r.unitId && contentModule === r.contentModule) return r;
  return { ...r, unitId, contentModule };
}
