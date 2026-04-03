export interface PhraseItem {
  ru: string;
  en: string;
  note?: string;
}

export interface PhraseCategory {
  id: string;
  title: string;
  phrases: PhraseItem[];
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    id: 'greetings',
    title: 'Greetings',
    phrases: [
      { ru: 'Здравствуйте', en: 'Hello (formal)', note: 'literally “wish you health”' },
      { ru: 'Привет', en: 'Hi (informal)' },
      { ru: 'Доброе утро', en: 'Good morning' },
      { ru: 'Добрый день', en: 'Good afternoon' },
      { ru: 'Добрый вечер', en: 'Good evening' },
      { ru: 'До свидания', en: 'Goodbye', note: '“until we meet again”' },
      { ru: 'Пока', en: 'Bye (informal)' },
    ],
  },
  {
    id: 'polite',
    title: 'Politeness',
    phrases: [
      { ru: 'Пожалуйста', en: 'Please / You’re welcome' },
      { ru: 'Спасибо', en: 'Thank you' },
      { ru: 'Извините', en: 'Excuse me / Sorry (formal)' },
      { ru: 'Простите', en: 'Sorry / Pardon' },
      { ru: 'Да', en: 'Yes' },
      { ru: 'Нет', en: 'No' },
    ],
  },
  {
    id: 'classroom',
    title: 'In class',
    phrases: [
      { ru: 'Я не понимаю', en: 'I don’t understand' },
      { ru: 'Повторите, пожалуйста', en: 'Please repeat' },
      { ru: 'Как это по-русски?', en: 'How do you say this in Russian?' },
      { ru: 'Можно вопрос?', en: 'May I ask a question?' },
    ],
  },
];
