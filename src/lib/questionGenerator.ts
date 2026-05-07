import type { QuestionTemplate, ModeId, DifficultyId, CaseId, WordCategory, DeclensionForm } from '../types';
import { getQuestionTemplateById, questionTemplates } from '../data/questionTemplates';
import { getFormsByCategories } from '../data/allForms';
import { sentenceFrames } from '../data/sentenceFrames';
import { markPerfEnd, markPerfStart } from './observability';

export interface GeneratedQuestion {
  template: QuestionTemplate;
  choices: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateDistractors(
  correctForm: DeclensionForm,
  pool: DeclensionForm[],
  count: number
): string[] {
  const distractors = new Set<string>();

  // Strategy 1: same lemma, other cases
  const sameLemmaOtherCase = pool.filter(
    f => f.lemmaId === correctForm.lemmaId &&
         f.caseId !== correctForm.caseId &&
         f.surfaceForm !== correctForm.surfaceForm
  );
  for (const f of shuffle(sameLemmaOtherCase)) {
    if (distractors.size >= count) break;
    distractors.add(f.surfaceForm);
  }

  // Strategy 2: same case, other lemmas in same category
  if (distractors.size < count) {
    const sameCaseOtherLemma = pool.filter(
      f => f.caseId === correctForm.caseId &&
           f.lemmaId !== correctForm.lemmaId &&
           f.surfaceForm !== correctForm.surfaceForm &&
           f.category === correctForm.category
    );
    for (const f of shuffle(sameCaseOtherLemma)) {
      if (distractors.size >= count) break;
      distractors.add(f.surfaceForm);
    }
  }

  // Strategy 3: same case, any category
  if (distractors.size < count) {
    const sameCaseAny = pool.filter(
      f => f.caseId === correctForm.caseId &&
           f.lemmaId !== correctForm.lemmaId &&
           f.surfaceForm !== correctForm.surfaceForm
    );
    for (const f of shuffle(sameCaseAny)) {
      if (distractors.size >= count) break;
      distractors.add(f.surfaceForm);
    }
  }

  return [...distractors].slice(0, count);
}

function generateDynamicQuestion(
  categories: WordCategory[],
  difficulty: DifficultyId,
  filterCaseIds?: CaseId[],
  excludeFormKeys?: string[],
  targetFormKey?: string,
  excludedLemmaIds?: Set<string>
): GeneratedQuestion | null {
  const categoryForms = getFormsByCategories(categories);
  if (categoryForms.length === 0) return null;

  let targetForm: DeclensionForm | undefined;

  if (targetFormKey) {
    const [lemmaId, caseId] = targetFormKey.split(':');
    targetForm = categoryForms.find(
      f =>
        f.lemmaId === lemmaId &&
        f.caseId === caseId &&
        (!excludedLemmaIds || !excludedLemmaIds.has(f.lemmaId))
    );
  }

  if (!targetForm) {
    // In free-practice mode (no explicit case filter) nominative is excluded to keep
    // drills focused on inflected forms. When a focused drill explicitly sets filterCaseIds
    // (including a nominative-only round), we respect the caller's intent.
    let pool = (filterCaseIds && filterCaseIds.length > 0)
      ? categoryForms
      : categoryForms.filter(f => f.caseId !== 'nominative');
    if (filterCaseIds && filterCaseIds.length > 0) {
      pool = pool.filter(f => filterCaseIds.includes(f.caseId));
    }
    if (excludeFormKeys && excludeFormKeys.length > 0) {
      const filtered = pool.filter(f => !excludeFormKeys.includes(`${f.lemmaId}:${f.caseId}`));
      if (filtered.length > 0) pool = filtered;
    }
    if (excludedLemmaIds && excludedLemmaIds.size > 0) {
      const lemmaFiltered = pool.filter(f => !excludedLemmaIds.has(f.lemmaId));
      if (lemmaFiltered.length > 0) pool = lemmaFiltered;
    }
    if (pool.length === 0) return null;
    targetForm = pool[Math.floor(Math.random() * pool.length)];
  }

  const frames = sentenceFrames.filter(sf => {
    if (sf.caseId !== targetForm!.caseId) return false;
    if (difficulty === 'beginner' && sf.difficulty === 'advanced') return false;
    // Frames may be restricted to specific word categories (e.g. verb-conjugated nominative
    // frames that only work grammatically for names/nouns, not pronouns).
    if (sf.categories && !sf.categories.includes(targetForm!.category)) return false;
    if (sf.animacy === 'any') return true;
    // Forms with no animacy set (pronouns) only use 'any' animacy frames; this avoids
    // generating sentences like "Я идёт домой." where the verb disagrees with the subject.
    if (!targetForm!.animacy) return false;
    return sf.animacy === targetForm!.animacy;
  });

  if (frames.length === 0) return null;
  const frame = frames[Math.floor(Math.random() * frames.length)];

  const usePostPrep = frame.requiresPreposition && !!targetForm.postPrepositionForm;
  const correctAnswer = usePostPrep ? targetForm.postPrepositionForm! : targetForm.surfaceForm;
  const acceptedAnswers = usePostPrep
    ? [targetForm.postPrepositionForm!, ...(targetForm.postPrepositionVariants ?? [])]
    : targetForm.acceptedVariants;

  const distractors = generateDistractors(targetForm, categoryForms, 3);

  if (usePostPrep && targetForm.surfaceForm !== targetForm.postPrepositionForm) {
    distractors.unshift(targetForm.surfaceForm);
    const unique = [...new Set(distractors)].filter(d => d !== correctAnswer);
    distractors.length = 0;
    distractors.push(...unique);
  }

  if (distractors.length < 2) return null;

  while (distractors.length < 3) {
    const filler = categoryForms.filter(
      f => f.surfaceForm !== correctAnswer && !distractors.includes(f.surfaceForm)
    );
    if (filler.length === 0) break;
    distractors.push(filler[Math.floor(Math.random() * filler.length)].surfaceForm);
  }

  const template: QuestionTemplate = {
    id: `dyn_${targetForm.lemmaId}_${targetForm.caseId}_${frame.id}`,
    type: 'multiple_choice',
    modeIds: ['practice', 'speed_round', 'boss_battle'],
    prompt: frame.frame,
    sentenceFrame: frame.frame,
    targetCaseId: targetForm.caseId,
    targetLemmaId: targetForm.lemmaId,
    targetCategory: targetForm.category,
    targetMeaning: targetForm.englishGloss,
    helperWord: frame.helperWord,
    questionPrompt: frame.questionPrompt,
    correctAnswer,
    acceptedAnswers,
    distractors,
    explanation: usePostPrep
      ? `${frame.explanation} After a preposition: ${targetForm.lemmaDisplay} → ${correctAnswer} (${targetForm.caseId}).`
      : `${frame.explanation} ${targetForm.lemmaDisplay} → ${correctAnswer} (${targetForm.caseId}).`,
    difficulty,
    tags: [targetForm.category, targetForm.caseId, targetForm.lemmaId, ...(usePostPrep ? ['n_prefix'] : [])],
  };

  const allChoices = shuffle([template.correctAnswer, ...distractors.slice(0, 3)]);
  const correctIndex = allChoices.indexOf(template.correctAnswer);

  return { template, choices: allChoices, correctIndex };
}

export function generateQuestion(
  modeId: ModeId,
  difficulty: DifficultyId,
  filterCaseIds?: CaseId[],
  excludeIds: string[] = [],
  targetFormKey?: string,
  categories?: WordCategory[]
): GeneratedQuestion | null {
  markPerfStart('question_generation');
  // Build a unified set of excluded lemma×case form keys from all previously asked
  // questions — both dynamic (dyn_*) and hand-authored template IDs. This prevents
  // the same pronoun/noun/name in the same case from appearing twice in a round,
  // regardless of how many templates or dynamic frames exist for it.
  const excludedFormKeys = new Set<string>();
  const lemmaCounts = new Map<string, number>();
  for (const id of excludeIds) {
    if (id.startsWith('dyn_')) {
      const parts = id.replace('dyn_', '').split('_');
      if (parts.length >= 2) {
        excludedFormKeys.add(`${parts[0]}:${parts[1]}`);
        const lemmaId = parts[0];
        lemmaCounts.set(lemmaId, (lemmaCounts.get(lemmaId) ?? 0) + 1);
      }
    } else {
      const t = getQuestionTemplateById(id);
      if (t?.targetLemmaId && t?.targetCaseId) {
        excludedFormKeys.add(`${t.targetLemmaId}:${t.targetCaseId}`);
        lemmaCounts.set(t.targetLemmaId, (lemmaCounts.get(t.targetLemmaId) ?? 0) + 1);
      }
    }
  }
  const maxRepeatsPerLemma = 2;
  const excludedLemmaIds = new Set(
    [...lemmaCounts.entries()]
      .filter(([, count]) => count >= maxRepeatsPerLemma)
      .map(([lemmaId]) => lemmaId),
  );

  // Try hand-authored templates first
  const categorySet = categories && categories.length > 0 ? new Set(categories) : null;
  const excludedIdSet = excludeIds.length > 0 ? new Set(excludeIds) : null;
  const filterCaseSet = filterCaseIds && filterCaseIds.length > 0 ? new Set(filterCaseIds) : null;
  let pool: QuestionTemplate[] = [];

  for (const q of questionTemplates) {
    if (!q.modeIds.includes(modeId)) continue;
    if (excludedIdSet?.has(q.id)) continue;
    if (q.targetLemmaId && excludedFormKeys.has(`${q.targetLemmaId}:${q.targetCaseId}`)) continue;
    if (q.targetLemmaId && excludedLemmaIds.has(q.targetLemmaId)) continue;

    if (categorySet) {
      const hasTagMatch = q.tags.some(t => categorySet.has(t as WordCategory));
      if (!hasTagMatch && q.targetCategory && !categorySet.has(q.targetCategory)) continue;
    }

    if (difficulty === 'beginner' && q.difficulty !== 'beginner') continue;
    if (difficulty === 'standard' && q.difficulty === 'advanced') continue;
    if (filterCaseSet && !filterCaseSet.has(q.targetCaseId)) continue;

    pool.push(q);
  }

  if (targetFormKey) {
    // If the requested form key has already been served in the current round,
    // reject the targeted path so the caller can fall through to a fresh dynamic pick.
    if (excludedFormKeys.has(targetFormKey)) {
      markPerfEnd('question_generation');
      return null;
    }
    const [lemmaId, caseId] = targetFormKey.split(':');
    if (excludedLemmaIds.has(lemmaId)) {
      markPerfEnd('question_generation');
      return null;
    }
    const targeted = pool.filter(q => q.targetLemmaId === lemmaId && q.targetCaseId === caseId);
    if (targeted.length > 0) {
      pool = targeted;
    }
  }

  // Hand-authored templates have polished prompts/explanations but a fixed lemma roster.
  // In free-practice mode we lean on them (~60%), but for focused drills (single-case rounds)
  // we lean harder on the dynamic generator so the full lemma pool gets uniform play and
  // a single round of 8 questions doesn't keep cycling through the same handful of templates.
  const isFocusedDrill = !!(filterCaseIds && filterCaseIds.length === 1);
  const dynamicThreshold = isFocusedDrill ? 0.3 : 0.6;
  const useDynamic = pool.length === 0 || (categories && Math.random() > dynamicThreshold);

  if (!useDynamic && pool.length > 0) {
    const template = pool[Math.floor(Math.random() * pool.length)];
    const wrongChoices = shuffle(template.distractors).slice(0, 3);
    const allChoices = shuffle([template.correctAnswer, ...wrongChoices]);
    const correctIndex = allChoices.indexOf(template.correctAnswer);
    const result = { template, choices: allChoices, correctIndex };
    markPerfEnd('question_generation');
    return result;
  }

  const cats = categories && categories.length > 0 ? categories : ['pronoun', 'name', 'noun'] as WordCategory[];

  const dynamic = generateDynamicQuestion(
    cats,
    difficulty,
    filterCaseIds,
    [...excludedFormKeys],
    targetFormKey,
    excludedLemmaIds,
  );
  markPerfEnd('question_generation');
  return dynamic;
}

export function generateQuestionSet(
  modeId: ModeId,
  difficulty: DifficultyId,
  count: number,
  filterCaseIds?: CaseId[],
  categories?: WordCategory[]
): GeneratedQuestion[] {
  const results: GeneratedQuestion[] = [];
  const usedIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const q = generateQuestion(modeId, difficulty, filterCaseIds, usedIds, undefined, categories);
    if (!q) break;
    results.push(q);
    usedIds.push(q.template.id);
  }

  return results;
}
