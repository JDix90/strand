import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchClassCurriculum,
  type ClassCurriculumRow,
} from '../../lib/curriculumApi';
import { useGameStore } from '../../store/gameStore';
import { describeRowLock } from '../../lib/studentNavigation';
import { getSubcategoryMeta } from '../../data/vocabulary/taxonomy';
import { parseVocabularyUnitConfig } from '../../lib/vocabulary/parseVocabularyUnitConfig';
import {
  getUnitFromRow,
  isVocabularyCurriculumRow,
} from '../../lib/studentCurriculumDisplay';

export function VocabularyHubScreen() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const masteryRecords = useGameStore(s => s.masteryRecords);
  const [rows, setRows] = useState<ClassCurriculumRow[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
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
        setSelectedSetIds([]);
      } else {
        const vocab = res.rows
          .filter(c => c.is_visible)
          .filter(isVocabularyCurriculumRow)
          .sort((a, b) => a.sort_order - b.sort_order);
        setRows(vocab);
        const unlockedSetIds = vocab
          .filter(r => !describeRowLock(r, masteryRecords).locked)
          .map(r => {
            const u = getUnitFromRow(r);
            if (!u) return null;
            return parseVocabularyUnitConfig(u.content_config).vocabularySetId;
          })
          .filter((s): s is string => !!s);
        setSelectedSetIds([...new Set(unlockedSetIds)]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, masteryRecords]);

  const topicSubtitle = useMemo(() => {
    const first = rows[0];
    const u = first ? getUnitFromRow(first) : null;
    return u?.topics?.title?.trim() ?? 'Russian vocabulary';
  }, [rows]);

  const availableOptions = useMemo(() => {
    return rows
      .map(row => {
        const u = getUnitFromRow(row);
        if (!u) return null;
        const { locked, reason } = describeRowLock(row, masteryRecords);
        const cfg = parseVocabularyUnitConfig(u.content_config);
        return {
          row,
          unit: u,
          locked,
          reason,
          setId: cfg.vocabularySetId,
          subLabel: getSubcategoryMeta(cfg.vocabularySetId)?.label ?? u.title,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v != null);
  }, [rows, masteryRecords]);

  const unlockedOptions = availableOptions.filter(o => !o.locked);
  const unlockedSetIds = unlockedOptions.map(o => o.setId);
  const selectedValidSetIds = selectedSetIds.filter(id => unlockedSetIds.includes(id));

  const toggleSelected = (setId: string) => {
    setSelectedSetIds(prev => (prev.includes(setId) ? prev.filter(s => s !== setId) : [...prev, setId]));
  };

  const startPractice = (setIds: string[]) => {
    const ids = [...new Set(setIds)].filter(id => unlockedSetIds.includes(id));
    if (ids.length === 0) return;
    navigate(`/class/${classId}/vocabulary/practice?sets=${encodeURIComponent(ids.join(','))}`);
  };

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
        {!loading && unlockedOptions.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startPractice(unlockedSetIds)}
                className="px-3 py-2 rounded-lg bg-brand/20 text-ink text-sm font-semibold hover:bg-brand/30"
              >
                Practice all ({unlockedSetIds.length})
              </button>
              <button
                type="button"
                disabled={selectedValidSetIds.length === 0}
                onClick={() => startPractice(selectedValidSetIds)}
                className="px-3 py-2 rounded-lg bg-surface-muted text-ink text-sm font-semibold disabled:opacity-50"
              >
                Practice selected ({selectedValidSetIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSetIds([...new Set(unlockedSetIds)])}
                className="text-xs text-link underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedSetIds([])}
                className="text-xs text-link underline"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-ink-secondary">
              Include specific subcategories in one mixed practice round:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unlockedOptions.map(o => (
                <label key={`pick-${o.setId}`} className="flex items-center gap-2 text-sm text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={selectedSetIds.includes(o.setId)}
                    onChange={() => toggleSelected(o.setId)}
                    className="accent-blue-500"
                  />
                  <span className="truncate">{o.subLabel}</span>
                </label>
              ))}
            </div>
          </div>
        )}
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
            availableOptions.map(item => {
              const u = item.unit;
              if (item.locked) {
                return (
                  <li
                    key={item.row.unit_id}
                    title={item.reason}
                    className="rounded-xl border border-border/80 bg-surface-elevated/50 px-4 py-3 text-ink-secondary"
                  >
                    <span className="font-semibold block truncate">{u.title}</span>
                    <span className="text-xs">{item.reason ?? 'Locked'}</span>
                  </li>
                );
              }
              return (
                <li key={item.row.unit_id}>
                  <Link
                    to={`/class/${classId}/unit/${item.row.unit_id}/practice`}
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
