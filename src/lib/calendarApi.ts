import { supabase } from './supabase';
import { filterNotesVisibleNow, type ClassNote } from './classSocialApi';
import type { ClassCalendarConfig, ScheduleRow } from './calendar/generateOccurrences';

export interface ClassRow {
  id: string;
  name: string;
  timezone: string;
  level: string | null;
  term_starts_on: string | null;
  term_ends_on: string | null;
}

export async function fetchStudentClassesWithSchedules(studentId: string): Promise<{
  configs: ClassCalendarConfig[];
  error: string | null;
}> {
  const { data: mem, error: mErr } = await supabase
    .from('class_memberships')
    .select('class_id')
    .eq('student_id', studentId);
  if (mErr) return { configs: [], error: mErr.message };
  const ids = (mem ?? []).map(m => m.class_id);
  if (ids.length === 0) return { configs: [], error: null };

  const { data: classes, error: cErr } = await supabase
    .from('classes')
    .select('id, name, timezone, level, term_starts_on, term_ends_on')
    .in('id', ids);
  if (cErr) return { configs: [], error: cErr.message };

  const { data: schedules, error: sErr } = await supabase
    .from('class_schedules')
    .select('id, class_id, weekday, starts_at, ends_at')
    .in('class_id', ids);
  if (sErr) return { configs: [], error: sErr.message };

  const byClass = (classes ?? []) as ClassRow[];
  const sched = (schedules ?? []) as (ScheduleRow & { class_id: string })[];

  const configs: ClassCalendarConfig[] = byClass.map(c => ({
    classId: c.id,
    className: c.name,
    timezone: c.timezone || 'UTC',
    level: c.level,
    termStartsOn: c.term_starts_on,
    termEndsOn: c.term_ends_on,
    schedules: sched
      .filter(s => s.class_id === c.id)
      .map(s => ({
        id: s.id,
        weekday: s.weekday,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
      })),
  }));

  return { configs, error: null };
}

/**
 * Class notes anchored to a calendar day (`visible_on_date`) for the student’s enrollments.
 * Respects visibility windows via `filterNotesVisibleNow`.
 */
export async function fetchStudentCalendarNotes(
  studentId: string,
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<{ notes: ClassNote[]; error: string | null }> {
  const { data: mem, error: mErr } = await supabase
    .from('class_memberships')
    .select('class_id')
    .eq('student_id', studentId);
  if (mErr) return { notes: [], error: mErr.message };
  const classIds = [...new Set((mem ?? []).map(m => m.class_id))];
  if (classIds.length === 0) return { notes: [], error: null };

  const { data, error } = await supabase
    .from('class_notes')
    .select('*')
    .in('class_id', classIds)
    .not('visible_on_date', 'is', null)
    .gte('visible_on_date', rangeStartIso)
    .lte('visible_on_date', rangeEndIso)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return { notes: [], error: error.message };
  const raw = (data ?? []) as ClassNote[];
  return { notes: filterNotesVisibleNow(raw), error: null };
}

export async function fetchTeacherClassesWithSchedules(teacherId: string): Promise<{
  configs: ClassCalendarConfig[];
  error: string | null;
}> {
  const { data: classes, error: cErr } = await supabase
    .from('classes')
    .select('id, name, timezone, level, term_starts_on, term_ends_on')
    .eq('teacher_id', teacherId);
  if (cErr) return { configs: [], error: cErr.message };
  const ids = (classes ?? []).map(c => c.id);
  if (ids.length === 0) return { configs: [], error: null };

  const { data: schedules, error: sErr } = await supabase
    .from('class_schedules')
    .select('id, class_id, weekday, starts_at, ends_at')
    .in('class_id', ids);
  if (sErr) return { configs: [], error: sErr.message };

  const byClass = (classes ?? []) as ClassRow[];
  const sched = (schedules ?? []) as (ScheduleRow & { class_id: string })[];

  const configs: ClassCalendarConfig[] = byClass.map(c => ({
    classId: c.id,
    className: c.name,
    timezone: c.timezone || 'UTC',
    level: c.level,
    termStartsOn: c.term_starts_on,
    termEndsOn: c.term_ends_on,
    schedules: sched
      .filter(s => s.class_id === c.id)
      .map(s => ({
        id: s.id,
        weekday: s.weekday,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
      })),
  }));

  return { configs, error: null };
}

export interface AbsenceRow {
  id: string;
  student_id: string;
  class_id: string;
  absent_on: string;
  status: string;
  note: string | null;
}

export async function fetchStudentAbsences(studentId: string): Promise<{ rows: AbsenceRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('student_absences')
    .select('id, student_id, class_id, absent_on, status, note')
    .eq('student_id', studentId)
    .eq('status', 'absent')
    .order('absent_on', { ascending: true });
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as AbsenceRow[], error: null };
}

export async function fetchTeacherAbsencesForClasses(classIds: string[]): Promise<{
  rows: AbsenceRow[];
  namesByStudent: Record<string, string>;
  error: string | null;
}> {
  if (classIds.length === 0) return { rows: [], namesByStudent: {}, error: null };
  const { data, error } = await supabase
    .from('student_absences')
    .select('id, student_id, class_id, absent_on, status, note')
    .in('class_id', classIds)
    .eq('status', 'absent');
  if (error) return { rows: [], namesByStudent: {}, error: error.message };
  const rows = (data ?? []) as AbsenceRow[];
  const sids = [...new Set(rows.map(r => r.student_id))];
  let namesByStudent: Record<string, string> = {};
  if (sids.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', sids);
    namesByStudent = Object.fromEntries((profs ?? []).map(p => [p.id, p.display_name]));
  }
  return { rows, namesByStudent, error: null };
}

export async function upsertStudentAbsence(
  studentId: string,
  classId: string,
  absentOn: string,
  absent: boolean,
  note?: string | null,
): Promise<{ error: string | null }> {
  if (!absent) {
    const { error } = await supabase
      .from('student_absences')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('absent_on', absentOn);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from('student_absences').insert({
    student_id: studentId,
    class_id: classId,
    absent_on: absentOn,
    status: 'absent',
    note: note ?? null,
  });
  if (error?.code === '23505') {
    return { error: null };
  }
  return { error: error?.message ?? null };
}

export async function upsertClassScheduleRow(
  classId: string,
  row: { weekday: number; starts_at: string; ends_at: string },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('class_schedules').insert({
    class_id: classId,
    weekday: row.weekday,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  });
  return { error: error?.message ?? null };
}

export async function deleteClassScheduleRow(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('class_schedules').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function updateClassMeta(
  classId: string,
  meta: Partial<{
    level: string | null;
    timezone: string;
    term_starts_on: string | null;
    term_ends_on: string | null;
  }>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('classes').update(meta).eq('id', classId);
  return { error: error?.message ?? null };
}
