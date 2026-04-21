import { isVocabularyModule } from '../contentModules';

export type SuggestionAction =
  | { kind: 'class_unit_mode'; classId: string; unitId: string; mode: 'practice' | 'learn_table' }
  | { kind: 'vocabulary_hub'; classId: string }
  | { kind: 'cases_hub'; classId: string }
  | { kind: 'flat_practice' };

export interface StudySuggestion {
  id: string;
  title: string;
  reason: string;
  ctaLabel: string;
  priority: number;
  action: SuggestionAction;
}

export interface UnitProgressLite {
  unitId: string;
  title: string;
  contentModule: string;
  avgMastery: number | null;
  weakCount: number;
  lastSeenAtMs: number | null;
}

/**
 * Rule-based recommendations (v1). Caller maps `action` to routes.
 */
export function buildStudySuggestions(opts: {
  classId: string | null;
  units: UnitProgressLite[];
  sessionsLast14d: number;
  confusionPairLabels: string[];
}): StudySuggestion[] {
  const { classId, units, sessionsLast14d, confusionPairLabels } = opts;
  const out: StudySuggestion[] = [];

  if (!classId) {
    if (sessionsLast14d < 2) {
      out.push({
        id: 'more-sessions-global',
        title: 'Establish a practice rhythm',
        reason: 'Short, regular sessions beat occasional long cramming.',
        ctaLabel: 'Open practice',
        priority: 40,
        action: { kind: 'flat_practice' },
      });
    }
    return out.sort((a, b) => b.priority - a.priority);
  }

  const vocabUnits = units.filter(u => isVocabularyModule(u.contentModule));
  const declUnits = units.filter(u => !isVocabularyModule(u.contentModule));

  const weakestDecl = [...declUnits]
    .filter(u => u.avgMastery != null && u.weakCount > 0)
    .sort((a, b) => (a.avgMastery ?? 0) - (b.avgMastery ?? 0))[0];

  if (weakestDecl) {
    out.push({
      id: `focus-unit-${weakestDecl.unitId}`,
      title: `Review: ${weakestDecl.title}`,
      reason:
        weakestDecl.avgMastery != null && weakestDecl.avgMastery < 45
          ? 'Average mastery in this unit is low compared to your other topics.'
          : 'Several forms here still need reinforcement.',
      ctaLabel: 'Practice this unit',
      priority: 85,
      action: { kind: 'class_unit_mode', classId, unitId: weakestDecl.unitId, mode: 'practice' },
    });
  }

  const weakestVocab = [...vocabUnits]
    .filter(u => u.avgMastery != null)
    .sort((a, b) => (a.avgMastery ?? 0) - (b.avgMastery ?? 0))[0];

  if (weakestVocab && (weakestVocab.avgMastery ?? 100) < 55) {
    out.push({
      id: `vocab-${weakestVocab.unitId}`,
      title: `Vocabulary: ${weakestVocab.title}`,
      reason: 'Vocabulary recall looks weaker than your other decks in this class.',
      ctaLabel: 'Vocabulary topics',
      priority: 72,
      action: { kind: 'vocabulary_hub', classId },
    });
  }

  if (sessionsLast14d < 3) {
    out.push({
      id: 'steady-practice',
      title: 'Increase weekly touch points',
      reason: `You completed ${sessionsLast14d} practice session(s) in the last two weeks. Small daily goals help retention.`,
      ctaLabel: 'Practice a class unit',
      priority: 55,
      action: weakestDecl
        ? { kind: 'class_unit_mode', classId, unitId: weakestDecl.unitId, mode: 'practice' }
        : { kind: 'cases_hub', classId },
    });
  }

  if (confusionPairLabels.length > 0) {
    out.push({
      id: 'confusions',
      title: 'Slow down similar pairs',
      reason: `Confusion signals: ${confusionPairLabels.slice(0, 3).join(' · ')}`,
      ctaLabel: 'Practice',
      priority: 50,
      action: weakestDecl
        ? { kind: 'class_unit_mode', classId, unitId: weakestDecl.unitId, mode: 'practice' }
        : { kind: 'cases_hub', classId },
    });
  }

  if (declUnits.length > 1 && !weakestDecl) {
    out.push({
      id: 'cases-mix',
      title: 'Mix grammar cases',
      reason: 'Rotate nominative with oblique cases to build flexible recall.',
      ctaLabel: 'Grammar hub',
      priority: 35,
      action: { kind: 'cases_hub', classId },
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
}
