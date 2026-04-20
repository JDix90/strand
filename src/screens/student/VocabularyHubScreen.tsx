import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchClassCurriculum,
  type ClassCurriculumRow,
} from '../../lib/curriculumApi';
import { useGameStore } from '../../store/gameStore';
import { describeRowLock } from '../../lib/studentNavigation';
import {
  getUnitFromRow,
  isVocabularyCurriculumRow,
} from '../../lib/studentCurriculumDisplay';

export function VocabularyHubScreen() {
  const { classId } = useParams<{ classId: string }>();
  const masteryRecords = useGameStore(s => s.masteryRecords);
  const [rows, setRows] = useState<ClassCurriculumRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetchClassCurriculum(classId);
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setRows([]);
      } else {
        const vocab = res.rows
          .filter(c => c.is_visible)
          .filter(isVocabularyCurriculumRow)
          .sort((a, b) => a.sort_order - b.sort_order);
        setRows(vocab);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const topicSubtitle = useMemo(() => {
    const first = rows[0];
    const u = first ? getUnitFromRow(first) : null;
    return u?.topics?.title?.trim() ?? 'Russian vocabulary';
  }, [rows]);

  if (!classId) {
    return (
      <div className="min-h-screen bg-page text-ink-secondary flex items-center justify-center p-6">
        Invalid class
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Vocabulary</h1>
          <p className="text-ink-secondary text-sm mt-1">{topicSubtitle}</p>
          <p className="text-ink-secondary text-sm mt-2">
            Choose a topic to practice Russian–English recognition.
          </p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">
            {error}
          </div>
        )}
        {loading && <p className="text-ink-secondary text-sm">Loading…</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-ink-secondary text-sm">
            No vocabulary units are published for this class yet.
          </p>
        )}
        <ul className="space-y-2">
          {!loading &&
            rows.map(row => {
              const u = getUnitFromRow(row);
              if (!u) return null;
              const { locked, reason } = describeRowLock(row, masteryRecords);
              if (locked) {
                return (
                  <li
                    key={row.unit_id}
                    title={reason}
                    className="rounded-xl border border-border/80 bg-surface-elevated/50 px-4 py-3 text-ink-secondary"
                  >
                    <span className="font-semibold block truncate">{u.title}</span>
                    <span className="text-xs">{reason ?? 'Locked'}</span>
                  </li>
                );
              }
              return (
                <li key={row.unit_id}>
                  <Link
                    to={`/class/${classId}/unit/${row.unit_id}/practice`}
                    className="block rounded-xl border border-border bg-surface-elevated hover:border-border-strong px-4 py-3 transition-colors"
                  >
                    <span className="font-semibold text-ink">{u.title}</span>
                    {u.description && (
                      <span className="block text-ink-secondary text-sm mt-1">{u.description}</span>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
