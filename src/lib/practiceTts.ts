/**
 * Practice prompts use `___` as the blank (see {@link QuestionCard} / sentence frames).
 * Builds the full Russian sentence for display or text-to-speech after the answer is known.
 */
export function buildCompletedPracticeSentence(prompt: string, correctAnswer: string): string {
  const t = prompt.trim();
  if (!t.includes('___')) return t;
  return t.split('___').join(correctAnswer);
}

/**
 * Text for Web Speech (Russian voice): drops trailing English glosses in parentheses
 * like `(to her)`, `(it)`, `(you pl)` that appear in some {@link questionTemplates} prompts.
 * Parentheses whose content has no Latin letters are kept (e.g. Cyrillic-only notes).
 */
export function russianTextForPracticeTts(completedSentence: string): string {
  let t = completedSentence.trim();
  const trailingParen = /\s*\(([^)]*)\)\s*$/;
  while (true) {
    const m = trailingParen.exec(t);
    if (!m) break;
    const inner = m[1] ?? '';
    if (/[a-zA-Z]/.test(inner)) {
      t = t.slice(0, m.index).trimEnd();
    } else {
      break;
    }
  }
  return t.trim();
}
