export interface TypingPrompt {
  id: string;
  /** What we show the user (English gloss or Latin) */
  prompt: string;
  /** Accept these Cyrillic strings after normalize */
  accepted: string[];
}

export const INTRO_TYPING_PROMPTS: TypingPrompt[] = [
  { id: 't1', prompt: 'Type the Russian for “thank you”', accepted: ['спасибо'] },
  { id: 't2', prompt: 'Type the Russian for “hello” (informal)', accepted: ['привет'] },
  { id: 't3', prompt: 'Type the Russian for “yes”', accepted: ['да'] },
  { id: 't4', prompt: 'Type the Russian for “no”', accepted: ['нет'] },
  { id: 't5', prompt: 'Type the lowercase letter for /m/ sound', accepted: ['м'] },
  { id: 't6', prompt: 'Type the lowercase letter for /sh/ sound', accepted: ['ш'] },
  { id: 't7', prompt: 'Type the Russian for “please” (one word)', accepted: ['пожалуйста'] },
  { id: 't8', prompt: 'Type the Russian for “goodbye” (formal, one word)', accepted: ['до свидания', 'досвидания'] },
];
