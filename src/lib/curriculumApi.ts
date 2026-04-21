import { supabase } from './supabase';

/** Optional embed from `units(..., topics(title))` selects. */
export interface UnitRow {
  id: string;
  topic_id: string;
  slug: string;
  title: string;
  description: string | null;
  content_module: string;
  content_config: unknown;
  sort_order: number;
  topics?: { title: string } | null;
}

export interface ClassCurriculumRow {
  id: string;
  class_id: string;
  unit_id: string;
  sort_order: number;
  is_visible: boolean;
  unlock_at: string | null;
  lock_policy: unknown | null;
  units?: UnitRow;
}

export async function fetchUnitById(unitId: string): Promise<UnitRow | null> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('id', unitId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UnitRow;
}

export async function fetchUnitsByIds(unitIds: string[]): Promise<UnitRow[]> {
  const ids = [...new Set(unitIds)].filter(Boolean);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('units').select('*').in('id', ids);
  if (error || !data) return [];
  return data as UnitRow[];
}

export interface FetchClassCurriculumResult {
  rows: ClassCurriculumRow[];
  error: string | null;
}

/** Loads class rows with unit + topic title for student/teacher UI. */
export async function fetchClassCurriculum(classId: string): Promise<FetchClassCurriculumResult> {
  const { data, error } = await supabase
    .from('class_curriculum')
    .select('*, units(*, topics(title))')
    .eq('class_id', classId)
    .order('sort_order', { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }
  if (!data) {
    return { rows: [], error: null };
  }
  return { rows: data as ClassCurriculumRow[], error: null };
}

export async function upsertClassCurriculumRow(
  row: Pick<ClassCurriculumRow, 'class_id' | 'unit_id'> &
    Partial<Pick<ClassCurriculumRow, 'sort_order' | 'is_visible' | 'unlock_at' | 'lock_policy'>>
): Promise<void> {
  const { error } = await supabase.from('class_curriculum').upsert(
    {
      class_id: row.class_id,
      unit_id: row.unit_id,
      sort_order: row.sort_order ?? 0,
      is_visible: row.is_visible ?? true,
      unlock_at: row.unlock_at ?? null,
      lock_policy: row.lock_policy ?? null,
    },
    { onConflict: 'class_id,unit_id' }
  );
  if (error) throw error;
}

export async function deleteClassCurriculumRow(classId: string, unitId: string): Promise<void> {
  await supabase.from('class_curriculum').delete().eq('class_id', classId).eq('unit_id', unitId);
}

export async function fetchAllCatalogUnits(): Promise<UnitRow[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data as UnitRow[];
}

export interface FetchCatalogUnitsOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

/** Paginated / filtered catalog for teacher dropdowns (default cap 500). */
export async function fetchCatalogUnitsPage(
  opts: FetchCatalogUnitsOptions = {}
): Promise<{ rows: UnitRow[]; error: string | null }> {
  const limit = Math.min(opts.limit ?? 500, 1000);
  const offset = Math.max(opts.offset ?? 0, 0);
  let q = supabase
    .from('units')
    .select('*')
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  const search = opts.search?.trim();
  if (search) {
    q = q.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error } = await q;
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as UnitRow[], error: null };
}
