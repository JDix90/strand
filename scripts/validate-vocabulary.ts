/**
 * Validates vocabulary taxonomy ↔ lazy decks: every vocabularySetId has a non-empty deck
 * and lemmaId values are unique across the whole corpus.
 * Run: npx tsx scripts/validate-vocabulary.ts
 */
import { VOCABULARY_SET_IDS } from '../src/data/vocabulary/taxonomy';
import { loadVocabularyDeck } from '../src/lib/vocabulary/deckRegistry';
import { buildVocabularySession } from '../src/lib/vocabulary/questionGenerator';

async function main(): Promise<void> {
  const seen = new Map<string, string>();
  let total = 0;
  for (const setId of VOCABULARY_SET_IDS) {
    const lemmas = await loadVocabularyDeck(setId);
    if (lemmas.length === 0) {
      throw new Error(`Empty deck for vocabularySetId=${setId}`);
    }
    total += lemmas.length;
    for (const e of lemmas) {
      if (e.vocabularySetId !== setId) {
        throw new Error(`Lemma ${e.lemmaId} has vocabularySetId=${e.vocabularySetId}, expected ${setId}`);
      }
      const prev = seen.get(e.lemmaId);
      if (prev) {
        throw new Error(`Duplicate lemmaId "${e.lemmaId}" in ${prev} and ${setId}`);
      }
      seen.set(e.lemmaId, setId);
    }
    const session = buildVocabularySession(lemmas, Math.min(10, lemmas.length), 'ru-en');
    for (const q of session) {
      if (q.choices.length !== 4) throw new Error(`Expected 4 choices for ${q.lemmaId}`);
      if (!q.choices.includes(q.correctAnswer)) {
        throw new Error(`Correct answer missing from choices for ${q.lemmaId}`);
      }
    }
  }
  console.log(`OK: ${VOCABULARY_SET_IDS.length} decks, ${total} lemmas, ${seen.size} unique lemmaIds.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
