export interface MatchPairSet {
  id: string;
  title: string;
  description: string;
  /** Left label → right label (pairs are matched by index) */
  pairs: { left: string; right: string }[];
}

export const INTRO_MATCH_SETS: MatchPairSet[] = [
  {
    id: 'letters-basic',
    title: 'Letters',
    description: 'Match Cyrillic to the usual Latin spelling.',
    pairs: [
      { left: 'Ж', right: 'Zh' },
      { left: 'Ш', right: 'Sh' },
      { left: 'Ч', right: 'Ch' },
      { left: 'Ц', right: 'Ts' },
      { left: 'Ю', right: 'Yu' },
      { left: 'Я', right: 'Ya' },
    ],
  },
  {
    id: 'greetings',
    title: 'Greetings',
    description: 'Match Russian to English.',
    pairs: [
      { left: 'Спасибо', right: 'Thank you' },
      { left: 'Пожалуйста', right: 'Please' },
      { left: 'Привет', right: 'Hi' },
      { left: 'Да', right: 'Yes' },
      { left: 'Нет', right: 'No' },
      { left: 'Пока', right: 'Bye' },
    ],
  },
];
