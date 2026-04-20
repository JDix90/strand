import type { VocabEntry, VocabPos } from '../../data/vocabulary/types';

export interface VocabMcQuestion {
  lemmaId: string;
  /** Full line for logging / fallback display: `Translate: {target}`. */
  prompt: string;
  /** Static label, e.g. `Translate:` */
  promptPrefix: string;
  /** Word or phrase the student hears and translates (matches visible clickable segment). */
  promptTarget: string;
  /** Which TTS path to use for click-to-hear. */
  speakLang: 'ru' | 'en';
  correctAnswer: string;
  choices: string[];
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function samePos(a: VocabPos, b: VocabPos): boolean {
  return a === b;
}

/**
 * Pick up to 3 distractor English glosses: prefer same subcategory + same POS,
 * then same subcategory, then same POS in pool, then random from pool.
 */
export function pickDistractorEn(
  target: VocabEntry,
  pool: VocabEntry[],
  count: number,
): string[] {
  const out: string[] = [];
  const used = new Set<string>([target.en.toLowerCase()]);

  const tryAdd = (en: string) => {
    const k = en.toLowerCase();
    if (used.has(k)) return false;
    used.add(k);
    out.push(en);
    return true;
  };

  const sameSubPos = pool.filter(
    e =>
      e.lemmaId !== target.lemmaId &&
      e.vocabularySetId === target.vocabularySetId &&
      samePos(e.pos, target.pos),
  );
  const sameSub = pool.filter(
    e => e.lemmaId !== target.lemmaId && e.vocabularySetId === target.vocabularySetId,
  );
  const samePosPool = pool.filter(
    e => e.lemmaId !== target.lemmaId && samePos(e.pos, target.pos),
  );

  for (const e of shuffle(sameSubPos)) {
    if (out.length >= count) break;
    tryAdd(e.en);
  }
  for (const e of shuffle(sameSub)) {
    if (out.length >= count) break;
    tryAdd(e.en);
  }
  for (const e of shuffle(samePosPool)) {
    if (out.length >= count) break;
    tryAdd(e.en);
  }
  for (const e of shuffle(pool)) {
    if (out.length >= count) break;
    if (e.lemmaId !== target.lemmaId) tryAdd(e.en);
  }

  return out.slice(0, count);
}

function pickDistractorRu(target: VocabEntry, pool: VocabEntry[], count: number): string[] {
  const others = pool.filter(e => e.lemmaId !== target.lemmaId);
  const ru = shuffle(others)
    .map(e => e.ru)
    .filter((r, i, a) => a.findIndex(x => x === r) === i);
  const out: string[] = [];
  const used = new Set<string>([target.ru]);
  for (const r of ru) {
    if (out.length >= count) break;
    if (!used.has(r)) {
      used.add(r);
      out.push(r);
    }
  }
  while (out.length < count && others.length > 0) {
    out.push(others[out.length % others.length]!.ru);
  }
  return out.slice(0, count);
}

/** Build N unique MC questions from a lemma list. */
export function buildVocabularySession(
  lemmas: VocabEntry[],
  questionCount: number,
  direction: 'ru-en' | 'en-ru',
): VocabMcQuestion[] {
  if (lemmas.length === 0) return [];
  const n = Math.min(questionCount, lemmas.length);
  const picked = shuffle(lemmas).slice(0, n);
  return picked.map(target => {
    if (direction === 'ru-en') {
      const distractors = pickDistractorEn(target, lemmas, 3);
      const pad = ['option A', 'option B', 'option C'];
      while (distractors.length < 3) distractors.push(pad[distractors.length]!);
      const choices = shuffle([target.en, ...distractors.slice(0, 3)]);
      const promptPrefix = 'Translate:';
      const promptTarget = target.ru;
      return {
        lemmaId: target.lemmaId,
        prompt: `${promptPrefix} ${promptTarget}`,
        promptPrefix,
        promptTarget,
        speakLang: 'ru',
        correctAnswer: target.en,
        choices,
        explanation: `${target.ru} means “${target.en}”.`,
      };
    }
    const distractors = pickDistractorRu(target, lemmas, 3);
    const choices = shuffle([target.ru, ...distractors.slice(0, 3)]);
    const promptPrefix = 'Translate:';
    const promptTarget = target.en;
    return {
      lemmaId: target.lemmaId,
      prompt: `${promptPrefix} ${promptTarget}`,
      promptPrefix,
      promptTarget,
      speakLang: 'en',
      correctAnswer: target.ru,
      choices,
      explanation: `“${target.en}” in Russian is ${target.ru}.`,
    };
  });
}
