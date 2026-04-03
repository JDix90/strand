export interface IntroQuizItem {
  prompt: string;
  choices: string[];
  correct: string;
  explanation?: string;
}

export interface IntroQuizDeck {
  id: string;
  title: string;
  description: string;
  questions: IntroQuizItem[];
}

export const INTRO_QUIZ_DECKS: IntroQuizDeck[] = [
  {
    id: 'cyrillic-latin',
    title: 'Cyrillic → Latin',
    description: 'Pick the usual Latin letter or digraph for each Cyrillic letter.',
    questions: [
      { prompt: 'Which Latin matches Б?', choices: ['B', 'V', 'D', 'P'], correct: 'B' },
      { prompt: 'Which Latin matches Ж?', choices: ['Zh', 'Sh', 'Z', 'Ch'], correct: 'Zh' },
      { prompt: 'Which Latin matches Ш?', choices: ['Sh', 'Ch', 'Sch', 'Zh'], correct: 'Sh' },
      { prompt: 'Which Latin matches Ы?', choices: ['Y', 'I', 'U', 'E'], correct: 'Y' },
      { prompt: 'Which Latin matches Ю?', choices: ['Yu', 'Ya', 'U', 'O'], correct: 'Yu' },
      { prompt: 'Which Latin matches Ц?', choices: ['Ts', 'S', 'Z', 'Ch'], correct: 'Ts' },
    ],
  },
  {
    id: 'phrase-en',
    title: 'Russian → English',
    description: 'Choose the best English meaning.',
    questions: [
      { prompt: 'Спасибо', choices: ['Thank you', 'Please', 'Hello', 'Sorry'], correct: 'Thank you' },
      { prompt: 'Пожалуйста', choices: ['Please / You’re welcome', 'Goodbye', 'Excuse me', 'Thanks'], correct: 'Please / You’re welcome' },
      { prompt: 'Здравствуйте', choices: ['Hello (formal)', 'Goodbye', 'Good night', 'See you'], correct: 'Hello (formal)' },
      { prompt: 'До свидания', choices: ['Goodbye', 'Hello', 'Thank you', 'Please'], correct: 'Goodbye' },
      { prompt: 'Извините', choices: ['Excuse me / Sorry', 'Thank you', 'Welcome', 'Maybe'], correct: 'Excuse me / Sorry' },
    ],
  },
];
