import { VocabularyPractice } from '../components/game/VocabularyPractice';
import { useGameStore } from '../store/gameStore';
import { STARTER_VOCAB_DECK_IDS } from '../lib/starterDeck';

export function VocabularyScreen() {
  const addSessionSummary = useGameStore(s => s.addSessionSummary);

  return (
    <VocabularyPractice
      deckIds={[...STARTER_VOCAB_DECK_IDS]}
      sessionLength={15}
      direction="ru-en"
      backPath="/vocabulary"
      resultsPath="/results"
      addSessionSummary={addSessionSummary}
      title="Vocabulary"
    />
  );
}
