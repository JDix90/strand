import type { MasteryRecord } from '../types';
export function filterMasteryRecordsByUnit(records: Record<string, MasteryRecord>): Record<string, MasteryRecord> {
  return records;
}

export function masteryStorageKey(formKey: string): string {
  return formKey;
}

export function parseMasteryStorageKey(key: string): { formKey: string } {
  return { formKey: key };
}

export function normalizeMasteryRecord(r: MasteryRecord): MasteryRecord {
  return r;
}
