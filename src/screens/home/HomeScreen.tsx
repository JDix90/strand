import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { useAuth } from '../../contexts/AuthContext';
import { useEffectiveRole } from '../../lib/authRoles';
import { supabase } from '../../lib/supabase';
import { getTotalFormCount, CATEGORY_LABELS } from '../../data/allForms';
import { computeDueReviewCount } from '../../lib/adaptiveEngine';
import type { WordCategory, ModeId, MasteryRecord } from '../../types';
import type { NavigateFunction } from 'react-router-dom';
import {
  resolveDefaultUnitId,
  buildClassUnitModePath,
  SELECTED_CLASS_STORAGE_KEY,
} from '../../lib/studentNavigation';
import { fetchUnitById } from '../../lib/curriculumApi';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { StreakNudgeBanner } from '../../components/home/StreakNudgeBanner';

interface ClassMembership {
  id: string;
  name: string;
}

interface AssignmentPreview {
  id: string;
  title: string;
  due_date: string | null;
  class_name: string;
  mode_id: string;
}

const modes: {
  id: ModeId;
  path: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tag: string;
}[] = [
  {
    id: 'learn_table',
    path: '/learn',
    title: 'Learn Table',
    description: 'Study the full declension table with interactive highlighting.',
    icon: '📋',
    color: '#3b82f6',
    tag: 'Study',
  },
  {
    id: 'practice',
    path: '/practice',
    title: 'Practice',
    description: 'Adaptive fill-in-the-blank questions that focus on your weak spots.',
    icon: '🎯',
    color: '#22c55e',
    tag: 'Core',
  },
  {
    id: 'speed_round',
    path: '/speed',
    title: 'Speed Round',
    description: 'Race the clock. Answer as many as you can in 60 seconds.',
    icon: '⚡',
    color: '#f59e0b',
    tag: 'Timed',
  },
  {
    id: 'boss_battle',
    path: '/boss',
    title: 'Boss Battle',
    description: 'Team vs. boss. Deal damage with correct answers before time runs out.',
    icon: '⚔️',
    color: '#ef4444',
    tag: 'Multiplayer',
  },
  {
    id: 'memory_match',
    path: '/memory',
    title: 'Memory Match',
    description: 'Flip cards to match words with their declined forms.',
    icon: '🃏',
    color: '#a855f7',
    tag: 'Recognition',
  },
  {
    id: 'grid_challenge',
    path: '/grid',
    title: 'Grid Challenge',
    description: 'Complete the full declension grid from memory.',
    icon: '🔲',
    color: '#14b8a6',
    tag: 'Mastery',
  },
];

const FLAT_PATH_BY_MODE: Record<ModeId, string> = {
  learn_table: '/learn',
  practice: '/practice',
  speed_round: '/speed',
  boss_battle: '/boss',
  memory_match: '/memory',
  grid_challenge: '/grid',
};

function currentClassLabelFromStorage(classes: ClassMembership[]): string | undefined {
  if (classes.length === 0) return undefined;
  try {
    const sid = localStorage.getItem(SELECTED_CLASS_STORAGE_KEY);
    const hit = classes.find(c => c.id === sid);
    return hit?.name ?? classes[0].name;
  } catch {
    return classes[0].name;
  }
}

async function navigateToMode(
  navigate: NavigateFunction,
  modeId: ModeId,
  opts: {
    effectiveRole: string;
    myClasses: ClassMembership[];
    masteryRecords: Record<string, MasteryRecord>;
  }
) {
  const { effectiveRole, myClasses, masteryRecords } = opts;
  if (effectiveRole === 'student' && myClasses.length > 0) {
    let classId: string;
    try {
      const stored = localStorage.getItem(SELECTED_CLASS_STORAGE_KEY);
      classId =
        stored && myClasses.some(c => c.id === stored) ? stored : myClasses[0].id;
    } catch {
      classId = myClasses[0].id;
    }
    const uid = await resolveDefaultUnitId(classId, masteryRecords);
    if (uid) {
      navigate(buildClassUnitModePath(classId, uid, modeId));
      return;
    }
  }
  navigate(FLAT_PATH_BY_MODE[modeId] ?? '/practice');
}

export function HomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { masteryRecords, sessionHistory, settings, toggleCategory } = useGameStore();
  const { profile } = useAuth();
  const effectiveRole = useEffectiveRole();

  const [myClasses, setMyClasses] = useState<ClassMembership[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<AssignmentPreview[]>([]);
  const [primaryUnitLabel, setPrimaryUnitLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || effectiveRole !== 'student') return;

    const loadStudentData = async () => {
      const { data: memberships } = await supabase
        .from('class_memberships')
        .select('class_id')
        .eq('student_id', profile.id);

      const classIds = (memberships ?? []).map(m => m.class_id);
      if (classIds.length === 0) return;

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds);
      setMyClasses(classes ?? []);
      const classMap = Object.fromEntries((classes ?? []).map(c => [c.id, c.name]));

      const { data: assigns } = await supabase
        .from('assignments')
        .select('id, title, due_date, class_id, mode_id')
        .in('class_id', classIds)
        .order('due_date', { ascending: true });

      if (!assigns || assigns.length === 0) return;

      const assignIds = assigns.map(a => a.id);
      const { data: completions } = await supabase
        .from('assignment_completions')
        .select('assignment_id')
        .eq('student_id', profile.id)
        .in('assignment_id', assignIds);
      const completedSet = new Set((completions ?? []).map(c => c.assignment_id));

      setPendingAssignments(
        assigns.filter(a => !completedSet.has(a.id)).map(a => ({
          id: a.id,
          title: a.title,
          due_date: a.due_date,
          class_name: classMap[a.class_id] ?? '',
          mode_id: a.mode_id,
        }))
      );
    };

    loadStudentData();
  }, [profile, effectiveRole]);

  useEffect(() => {
    if (!profile || effectiveRole !== 'student' || myClasses.length === 0) {
      setPrimaryUnitLabel(null);
      return;
    }
    let cancelled = false;
    (async () => {
      let classId: string;
      try {
        const stored = localStorage.getItem(SELECTED_CLASS_STORAGE_KEY);
        classId =
          stored && myClasses.some(c => c.id === stored) ? stored : myClasses[0].id;
      } catch {
        classId = myClasses[0].id;
      }
      const uid = await resolveDefaultUnitId(classId, masteryRecords);
      if (cancelled || !uid) {
        if (!cancelled) setPrimaryUnitLabel(null);
        return;
      }
      const row = await fetchUnitById(uid);
      if (cancelled || !row) {
        if (!cancelled) setPrimaryUnitLabel(null);
        return;
      }
      setPrimaryUnitLabel(row.title);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, effectiveRole, myClasses, masteryRecords]);

  const totalAttempts = Object.values(masteryRecords).reduce((s, r) => s + r.attempts, 0);
  const masteredCount = Object.values(masteryRecords).filter(r => r.status === 'mastered').length;
  const totalForms = getTotalFormCount(settings.activeCategories);
  const recentSession = sessionHistory[0];
  const dueCount = computeDueReviewCount(masteryRecords, settings.activeCategories);
  const bestStreakEver = sessionHistory.length
    ? Math.max(...sessionHistory.map(s => s.bestStreak), 0)
    : 0;
  const displayName = profile?.displayName?.trim() || 'there';
  const isEnrolledStudent = effectiveRole === 'student' && myClasses.length > 0;
  const currentClassLabel = isEnrolledStudent ? currentClassLabelFromStorage(myClasses) : undefined;
  const showStreakStrip =
    settings.streakCurrent > 0 || settings.streakBest > 0 || bestStreakEver >= 2;

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface border-b border-border shadow-[var(--shadow-card)] px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            <BrandLogo size="sm" to="/home" className="gap-1.5 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight leading-snug">
                {t('home.welcome', { name: displayName })}
              </h1>
              {isEnrolledStudent && currentClassLabel && (
                <p className="text-ink-secondary text-xs mt-1">{t('home.currentClass', { name: currentClassLabel })}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-ink-secondary hover:text-ink p-2 rounded-xl hover:bg-surface-muted transition-colors shrink-0 -mr-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={t('nav.settings')}
            type="button"
            aria-label={t('nav.settings')}
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {effectiveRole === 'student' && <StreakNudgeBanner />}

        {showStreakStrip && (
          <div className="rounded-xl border border-border bg-surface px-3 py-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
            {settings.streakCurrent > 0 && (
              <span className="text-ink font-medium">{t('home.streakLabel', { count: settings.streakCurrent })}</span>
            )}
            {settings.streakCurrent > 0 && settings.streakBest > 0 && (
              <span className="text-ink-secondary" aria-hidden>
                ·
              </span>
            )}
            {settings.streakBest > 0 && (
              <span className="text-ink-secondary">{t('home.streakBest', { count: settings.streakBest })}</span>
            )}
            {bestStreakEver >= 2 && (
              <>
                <span className="text-ink-secondary hidden sm:inline" aria-hidden>
                  ·
                </span>
                <span className="text-ink-secondary">{t('home.sessionBestInline', { count: bestStreakEver })}</span>
              </>
            )}
          </div>
        )}

        {isEnrolledStudent && primaryUnitLabel && (
          <button
            type="button"
            onClick={() => navigateToMode(navigate, 'practice', { effectiveRole, myClasses, masteryRecords })}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-brand/40 bg-brand/10 hover:bg-brand/16 px-4 py-3.5 sm:py-4 text-left shadow-[var(--shadow-card)] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0" aria-hidden>
                🎯
              </span>
              <div className="min-w-0">
                <p className="font-bold text-ink text-sm sm:text-base">{t('home.continuePractice')}</p>
                <p className="text-ink-secondary text-xs mt-0.5 truncate">{primaryUnitLabel}</p>
              </div>
            </div>
            <span className="text-ink-secondary text-xl shrink-0" aria-hidden>
              ›
            </span>
          </button>
        )}

        {effectiveRole === 'student' && (
          <div className="flex flex-wrap gap-2">
            {myClasses.length > 0 && (
              <Link
                to="/home/calendar"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:bg-surface-muted transition-colors"
              >
                <span aria-hidden>📅</span>
                {t('home.calendarShort')}
              </Link>
            )}
            <Link
              to="/home/progress"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:bg-surface-muted transition-colors"
            >
              <span aria-hidden>📊</span>
              {t('home.progressShort')}
            </Link>
          </div>
        )}

        {sessionHistory.length === 0 && (
          <p className="text-ink-secondary text-xs max-w-xl leading-relaxed">
            {t('home.goalsHint')}{' '}
            <Link to="/settings" className="text-link font-semibold hover:underline underline-offset-2">
              {t('nav.settings')}
            </Link>
            .
          </p>
        )}

        {/* Category Quick-Toggles */}
        <div className="flex flex-wrap gap-2">
          {(['pronoun', 'name', 'noun'] as WordCategory[]).map(cat => {
            const info = CATEGORY_LABELS[cat];
            const active = settings.activeCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  active
                    ? 'bg-brand text-white'
                    : 'bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink border border-border'
                }`}
              >
                {info.icon} {info.label}
              </button>
            );
          })}
        </div>
        {effectiveRole === 'student' && primaryUnitLabel && isEnrolledStudent && (
          <p className="text-ink-secondary text-xs leading-relaxed -mt-1">
            {t('home.categoryHint', { unit: primaryUnitLabel })}
          </p>
        )}

        {/* Mode Grid — primary exercises (moved up) */}
        <div>
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-1">
            {effectiveRole === 'student' && myClasses.length === 0 ? t('home.modesHeadingGuest') : t('home.modesHeadingStudent')}
          </h2>
          <p className="text-ink-secondary text-xs mb-3 max-w-2xl">{t('home.modesSubtext')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {modes.map(mode => (
              <button
                type="button"
                key={mode.id}
                onClick={() =>
                  navigateToMode(navigate, mode.id, {
                    effectiveRole,
                    myClasses,
                    masteryRecords,
                  })
                }
                className="group bg-surface hover:bg-surface-muted border border-border hover:border-border-strong rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 hover:shadow-lg"
                style={{ '--mode-color': mode.color } as React.CSSProperties}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <span className="text-2xl sm:text-3xl">{mode.icon}</span>
                  <span
                    className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: mode.color + '22', color: mode.color }}
                  >
                    {mode.tag}
                  </span>
                </div>
                <h3 className="text-ink font-bold text-sm sm:text-base mb-1">{mode.title}</h3>
                <p className="text-ink-secondary text-xs sm:text-sm leading-relaxed">{mode.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Review due — before stats so it stays near practice actions */}
        {dueCount > 0 && (
          <button
            type="button"
            onClick={() =>
              navigateToMode(navigate, 'practice', {
                effectiveRole,
                myClasses,
                masteryRecords,
              })
            }
            className="w-full flex items-center justify-between bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl sm:text-2xl shrink-0">🔔</span>
              <div className="text-left min-w-0">
                <p className="text-amber-900 font-bold text-sm">
                  {dueCount} {dueCount === 1 ? 'form' : 'forms'} due for review
                </p>
                <p className="text-amber-800/80 text-xs">Practice now to keep your memory fresh</p>
              </div>
            </div>
            <span className="text-amber-800 font-semibold text-sm shrink-0">Practice &rarr;</span>
          </button>
        )}

        {/* Stats Bar — compact */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-surface rounded-xl py-3 px-2 sm:px-3 text-center border border-border">
            <p className="text-lg sm:text-xl font-bold text-ink tabular-nums">{totalAttempts}</p>
            <p className="text-ink-secondary text-[10px] sm:text-xs mt-0.5 leading-tight">Total Answers</p>
          </div>
          <div className="bg-surface rounded-xl py-3 px-2 sm:px-3 text-center border border-border">
            <p className="text-lg sm:text-xl font-bold text-purple-700 tabular-nums">
              {masteredCount}/{totalForms}
            </p>
            <p className="text-ink-secondary text-[10px] sm:text-xs mt-0.5 leading-tight">Forms Mastered</p>
          </div>
          <div className="bg-surface rounded-xl py-3 px-2 sm:px-3 text-center border border-border">
            <p className="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums">
              {recentSession ? `${Math.round(recentSession.accuracy * 100)}%` : '—'}
            </p>
            <p className="text-ink-secondary text-[10px] sm:text-xs mt-0.5 leading-tight">Last Accuracy</p>
          </div>
        </div>

        {/* Assignments Due (students only) */}
        {pendingAssignments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider">
                Assignments Due
              </h2>
              <button onClick={() => navigate('/assignments')} className="text-link hover:text-link text-xs font-semibold">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {pendingAssignments.slice(0, 3).map(a => (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 shadow-[var(--shadow-card)]"
                >
                  <div>
                    <p className="text-ink text-sm font-medium">{a.title}</p>
                    <p className="text-link text-xs">{a.class_name}</p>
                  </div>
                  {a.due_date && (
                    <span className="text-amber-300 text-xs font-semibold">
                      Due {new Date(a.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Classes (students only) */}
        {myClasses.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-ink-secondary text-xs">Classes:</span>
            {myClasses.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/class/${c.id}`)}
                className="bg-surface text-ink-secondary text-xs px-3 py-1 rounded-lg border border-border hover:border-brand hover:text-ink transition-colors"
              >
                {c.name}
              </button>
            ))}
            <button onClick={() => navigate('/join-class')} className="text-link hover:text-link text-xs font-semibold">
              + Join
            </button>
          </div>
        )}

        {effectiveRole === 'student' && myClasses.length === 0 && (
          <>
            <div>
              <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-2">
                Getting started
              </h2>
              <p className="text-ink-secondary text-xs mb-4 max-w-xl">
                New to Russian? Explore the alphabet, useful phrases, and short games here. These are optional —
                whenever you are ready, join a class to work on case declensions with your teacher.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                <Link
                  to="/intro/alphabet"
                  className="rounded-2xl border border-border bg-surface-elevated hover:border-brand hover:bg-surface px-4 py-4 transition-colors"
                >
                  <span className="text-2xl">А</span>
                  <p className="text-ink font-semibold text-sm mt-2">Alphabet</p>
                  <p className="text-ink-secondary text-xs mt-1">Cyrillic letters and sounds</p>
                </Link>
                <Link
                  to="/intro/phrases"
                  className="rounded-2xl border border-border bg-surface-elevated hover:border-brand hover:bg-surface px-4 py-4 transition-colors"
                >
                  <span className="text-2xl">💬</span>
                  <p className="text-ink font-semibold text-sm mt-2">Phrases</p>
                  <p className="text-ink-secondary text-xs mt-1">Greetings and classroom Russian</p>
                </Link>
                <Link
                  to="/intro/play"
                  className="rounded-2xl border border-border bg-surface-elevated hover:border-brand hover:bg-surface px-4 py-4 transition-colors"
                >
                  <span className="text-2xl">🎮</span>
                  <p className="text-ink font-semibold text-sm mt-2">Games & drills</p>
                  <p className="text-ink-secondary text-xs mt-1">Quiz, match, typing</p>
                </Link>
              </div>
              <Link
                to="/intro"
                className="inline-block text-link hover:text-link text-xs font-semibold mb-6"
              >
                All getting started topics →
              </Link>
            </div>

            <button
              onClick={() => navigate('/join-class')}
              className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-muted border border-dashed border-border-strong hover:border-brand rounded-2xl px-5 py-4 transition-colors text-ink-secondary hover:text-link text-sm font-semibold"
            >
              🏫 Join a Class
            </button>
          </>
        )}

        {/* Recent Activity */}
        {sessionHistory.length > 0 && (
          <div>
            <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Recent Sessions
            </h2>
            <div className="space-y-2">
              {sessionHistory.slice(0, 3).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {modes.find(m => m.id === s.modeId)?.icon ?? '🎮'}
                    </span>
                    <div>
                      <p className="text-ink text-sm font-medium">
                        {modes.find(m => m.id === s.modeId)?.title ?? s.modeId}
                      </p>
                      <p className="text-ink-secondary text-xs">
                        {new Date(s.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-ink font-bold">{s.score.toLocaleString()}</p>
                    <p className="text-ink-secondary text-xs">{Math.round(s.accuracy * 100)}% acc</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
