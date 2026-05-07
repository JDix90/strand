import type { DeclensionForm } from '../types';

export const pronounForms: DeclensionForm[] = [
  // Я (I)
  { lemmaId: 'ya', lemmaDisplay: 'я', englishGloss: 'I', category: 'pronoun', animacy: 'animate', caseId: 'nominative', surfaceForm: 'я', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это я.', afterPreposition: false, acceptedVariants: ['я'] },
  { lemmaId: 'ya', lemmaDisplay: 'я', englishGloss: 'I', category: 'pronoun', animacy: 'animate', caseId: 'genitive', surfaceForm: 'меня', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'У меня нет книги.', afterPreposition: false, acceptedVariants: ['меня'] },
  { lemmaId: 'ya', lemmaDisplay: 'я', englishGloss: 'I', category: 'pronoun', animacy: 'animate', caseId: 'dative', surfaceForm: 'мне', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Дай мне книгу.', afterPreposition: false, acceptedVariants: ['мне'] },
  { lemmaId: 'ya', lemmaDisplay: 'я', englishGloss: 'I', category: 'pronoun', animacy: 'animate', caseId: 'accusative', surfaceForm: 'меня', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Он любит меня.', afterPreposition: false, acceptedVariants: ['меня'] },
  { lemmaId: 'ya', lemmaDisplay: 'я', englishGloss: 'I', category: 'pronoun', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'мной', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Он идёт со мной.', afterPreposition: false, acceptedVariants: ['мной', 'мною'] },
  { lemmaId: 'ya', lemmaDisplay: 'я', englishGloss: 'I', category: 'pronoun', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'мне', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Он думает обо мне.', afterPreposition: true, acceptedVariants: ['мне'] },

  // ТЫ (you singular)
  { lemmaId: 'ty', lemmaDisplay: 'ты', englishGloss: 'you (sg)', category: 'pronoun', animacy: 'animate', caseId: 'nominative', surfaceForm: 'ты', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это ты.', afterPreposition: false, acceptedVariants: ['ты'] },
  { lemmaId: 'ty', lemmaDisplay: 'ты', englishGloss: 'you (sg)', category: 'pronoun', animacy: 'animate', caseId: 'genitive', surfaceForm: 'тебя', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'У меня нет тебя.', afterPreposition: false, acceptedVariants: ['тебя'] },
  { lemmaId: 'ty', lemmaDisplay: 'ты', englishGloss: 'you (sg)', category: 'pronoun', animacy: 'animate', caseId: 'dative', surfaceForm: 'тебе', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Я дам тебе книгу.', afterPreposition: false, acceptedVariants: ['тебе'] },
  { lemmaId: 'ty', lemmaDisplay: 'ты', englishGloss: 'you (sg)', category: 'pronoun', animacy: 'animate', caseId: 'accusative', surfaceForm: 'тебя', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Я люблю тебя.', afterPreposition: false, acceptedVariants: ['тебя'] },
  { lemmaId: 'ty', lemmaDisplay: 'ты', englishGloss: 'you (sg)', category: 'pronoun', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'тобой', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Я иду с тобой.', afterPreposition: false, acceptedVariants: ['тобой', 'тобою'] },
  { lemmaId: 'ty', lemmaDisplay: 'ты', englishGloss: 'you (sg)', category: 'pronoun', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'тебе', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Я думаю о тебе.', afterPreposition: true, acceptedVariants: ['тебе'] },

  // ОН (he)
  { lemmaId: 'on', lemmaDisplay: 'он', englishGloss: 'he', category: 'pronoun', gender: 'masculine', animacy: 'animate', caseId: 'nominative', surfaceForm: 'он', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это он.', afterPreposition: false, acceptedVariants: ['он'] },
  { lemmaId: 'on', lemmaDisplay: 'он', englishGloss: 'he', category: 'pronoun', gender: 'masculine', animacy: 'animate', caseId: 'genitive', surfaceForm: 'его', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'Я не вижу его.', afterPreposition: false, acceptedVariants: ['его'], postPrepositionForm: 'него' },
  { lemmaId: 'on', lemmaDisplay: 'он', englishGloss: 'he', category: 'pronoun', gender: 'masculine', animacy: 'animate', caseId: 'dative', surfaceForm: 'ему', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Дай ему книгу.', afterPreposition: false, acceptedVariants: ['ему'], postPrepositionForm: 'нему' },
  { lemmaId: 'on', lemmaDisplay: 'он', englishGloss: 'he', category: 'pronoun', gender: 'masculine', animacy: 'animate', caseId: 'accusative', surfaceForm: 'его', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Я вижу его.', afterPreposition: false, acceptedVariants: ['его'], postPrepositionForm: 'него' },
  { lemmaId: 'on', lemmaDisplay: 'он', englishGloss: 'he', category: 'pronoun', gender: 'masculine', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'им', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Все довольны им.', afterPreposition: false, acceptedVariants: ['им'], postPrepositionForm: 'ним' },
  { lemmaId: 'on', lemmaDisplay: 'он', englishGloss: 'he', category: 'pronoun', gender: 'masculine', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'нём', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Я думаю о нём.', afterPreposition: true, acceptedVariants: ['нём'], postPrepositionForm: 'нём' },

  // ОНА (she)
  { lemmaId: 'ona', lemmaDisplay: 'она', englishGloss: 'she', category: 'pronoun', gender: 'feminine', animacy: 'animate', caseId: 'nominative', surfaceForm: 'она', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это она.', afterPreposition: false, acceptedVariants: ['она'] },
  { lemmaId: 'ona', lemmaDisplay: 'она', englishGloss: 'she', category: 'pronoun', gender: 'feminine', animacy: 'animate', caseId: 'genitive', surfaceForm: 'её', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'Я не вижу её.', afterPreposition: false, acceptedVariants: ['её', 'ее'], postPrepositionForm: 'неё', postPrepositionVariants: ['нее'] },
  { lemmaId: 'ona', lemmaDisplay: 'она', englishGloss: 'she', category: 'pronoun', gender: 'feminine', animacy: 'animate', caseId: 'dative', surfaceForm: 'ей', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Я дал ей книгу.', afterPreposition: false, acceptedVariants: ['ей'], postPrepositionForm: 'ней' },
  { lemmaId: 'ona', lemmaDisplay: 'она', englishGloss: 'she', category: 'pronoun', gender: 'feminine', animacy: 'animate', caseId: 'accusative', surfaceForm: 'её', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Я вижу её.', afterPreposition: false, acceptedVariants: ['её', 'ее'], postPrepositionForm: 'неё', postPrepositionVariants: ['нее'] },
  { lemmaId: 'ona', lemmaDisplay: 'она', englishGloss: 'she', category: 'pronoun', gender: 'feminine', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'ей', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Все довольны ей.', afterPreposition: false, acceptedVariants: ['ей', 'ею'], postPrepositionForm: 'ней', postPrepositionVariants: ['ней', 'нею'] },
  { lemmaId: 'ona', lemmaDisplay: 'она', englishGloss: 'she', category: 'pronoun', gender: 'feminine', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'ней', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Я думаю о ней.', afterPreposition: true, acceptedVariants: ['ней'], postPrepositionForm: 'ней' },

  // ОНО (it)
  { lemmaId: 'ono', lemmaDisplay: 'оно', englishGloss: 'it', category: 'pronoun', gender: 'neuter', animacy: 'animate', caseId: 'nominative', surfaceForm: 'оно', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это оно.', afterPreposition: false, acceptedVariants: ['оно'] },
  { lemmaId: 'ono', lemmaDisplay: 'оно', englishGloss: 'it', category: 'pronoun', gender: 'neuter', animacy: 'animate', caseId: 'genitive', surfaceForm: 'его', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'Нет его здесь.', afterPreposition: false, acceptedVariants: ['его'], postPrepositionForm: 'него' },
  { lemmaId: 'ono', lemmaDisplay: 'оно', englishGloss: 'it', category: 'pronoun', gender: 'neuter', animacy: 'animate', caseId: 'dative', surfaceForm: 'ему', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Я рад ему.', afterPreposition: false, acceptedVariants: ['ему'], postPrepositionForm: 'нему' },
  { lemmaId: 'ono', lemmaDisplay: 'оно', englishGloss: 'it', category: 'pronoun', gender: 'neuter', animacy: 'animate', caseId: 'accusative', surfaceForm: 'его', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Я вижу его.', afterPreposition: false, acceptedVariants: ['его'], postPrepositionForm: 'него' },
  { lemmaId: 'ono', lemmaDisplay: 'оно', englishGloss: 'it', category: 'pronoun', gender: 'neuter', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'им', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Все довольны им.', afterPreposition: false, acceptedVariants: ['им'], postPrepositionForm: 'ним' },
  { lemmaId: 'ono', lemmaDisplay: 'оно', englishGloss: 'it', category: 'pronoun', gender: 'neuter', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'нём', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Я думаю о нём.', afterPreposition: true, acceptedVariants: ['нём'], postPrepositionForm: 'нём' },

  // МЫ (we)
  { lemmaId: 'my', lemmaDisplay: 'мы', englishGloss: 'we', category: 'pronoun', animacy: 'animate', caseId: 'nominative', surfaceForm: 'мы', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это мы.', afterPreposition: false, acceptedVariants: ['мы'] },
  { lemmaId: 'my', lemmaDisplay: 'мы', englishGloss: 'we', category: 'pronoun', animacy: 'animate', caseId: 'genitive', surfaceForm: 'нас', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'Без нас они не справятся.', afterPreposition: false, acceptedVariants: ['нас'] },
  { lemmaId: 'my', lemmaDisplay: 'мы', englishGloss: 'we', category: 'pronoun', animacy: 'animate', caseId: 'dative', surfaceForm: 'нам', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Дай нам книгу.', afterPreposition: false, acceptedVariants: ['нам'] },
  { lemmaId: 'my', lemmaDisplay: 'мы', englishGloss: 'we', category: 'pronoun', animacy: 'animate', caseId: 'accusative', surfaceForm: 'нас', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Он любит нас.', afterPreposition: false, acceptedVariants: ['нас'] },
  { lemmaId: 'my', lemmaDisplay: 'мы', englishGloss: 'we', category: 'pronoun', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'нами', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Он идёт с нами.', afterPreposition: false, acceptedVariants: ['нами'] },
  { lemmaId: 'my', lemmaDisplay: 'мы', englishGloss: 'we', category: 'pronoun', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'нас', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Он думает о нас.', afterPreposition: true, acceptedVariants: ['нас'] },

  // ВЫ (you plural / formal)
  { lemmaId: 'vy', lemmaDisplay: 'вы', englishGloss: 'you (pl)', category: 'pronoun', animacy: 'animate', caseId: 'nominative', surfaceForm: 'вы', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это вы.', afterPreposition: false, acceptedVariants: ['вы'] },
  { lemmaId: 'vy', lemmaDisplay: 'вы', englishGloss: 'you (pl)', category: 'pronoun', animacy: 'animate', caseId: 'genitive', surfaceForm: 'вас', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'У меня нет вас.', afterPreposition: false, acceptedVariants: ['вас'] },
  { lemmaId: 'vy', lemmaDisplay: 'вы', englishGloss: 'you (pl)', category: 'pronoun', animacy: 'animate', caseId: 'dative', surfaceForm: 'вам', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Я дам вам книгу.', afterPreposition: false, acceptedVariants: ['вам'] },
  { lemmaId: 'vy', lemmaDisplay: 'вы', englishGloss: 'you (pl)', category: 'pronoun', animacy: 'animate', caseId: 'accusative', surfaceForm: 'вас', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Я вижу вас.', afterPreposition: false, acceptedVariants: ['вас'] },
  { lemmaId: 'vy', lemmaDisplay: 'вы', englishGloss: 'you (pl)', category: 'pronoun', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'вами', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Я иду с вами.', afterPreposition: false, acceptedVariants: ['вами'] },
  { lemmaId: 'vy', lemmaDisplay: 'вы', englishGloss: 'you (pl)', category: 'pronoun', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'вас', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Я думаю о вас.', afterPreposition: true, acceptedVariants: ['вас'] },

  // ОНИ (they)
  { lemmaId: 'oni', lemmaDisplay: 'они', englishGloss: 'they', category: 'pronoun', animacy: 'animate', caseId: 'nominative', surfaceForm: 'они', helperWord: 'это', questionPrompt: 'кто? что?', exampleSentence: 'Это они.', afterPreposition: false, acceptedVariants: ['они'] },
  { lemmaId: 'oni', lemmaDisplay: 'они', englishGloss: 'they', category: 'pronoun', animacy: 'animate', caseId: 'genitive', surfaceForm: 'их', helperWord: 'нет', questionPrompt: 'кого? чего?', exampleSentence: 'Я не знаю их.', afterPreposition: false, acceptedVariants: ['их'], postPrepositionForm: 'них' },
  { lemmaId: 'oni', lemmaDisplay: 'они', englishGloss: 'they', category: 'pronoun', animacy: 'animate', caseId: 'dative', surfaceForm: 'им', helperWord: 'дай', questionPrompt: 'кому? чему?', exampleSentence: 'Дай им книгу.', afterPreposition: false, acceptedVariants: ['им'], postPrepositionForm: 'ним' },
  { lemmaId: 'oni', lemmaDisplay: 'они', englishGloss: 'they', category: 'pronoun', animacy: 'animate', caseId: 'accusative', surfaceForm: 'их', helperWord: 'люблю', questionPrompt: 'кого? что?', exampleSentence: 'Я вижу их.', afterPreposition: false, acceptedVariants: ['их'], postPrepositionForm: 'них' },
  { lemmaId: 'oni', lemmaDisplay: 'они', englishGloss: 'they', category: 'pronoun', animacy: 'animate', caseId: 'instrumental', surfaceForm: 'ими', helperWord: 'с', questionPrompt: 'кем? чем?', exampleSentence: 'Все довольны ими.', afterPreposition: false, acceptedVariants: ['ими'], postPrepositionForm: 'ними' },
  { lemmaId: 'oni', lemmaDisplay: 'они', englishGloss: 'they', category: 'pronoun', animacy: 'animate', caseId: 'prepositional', surfaceForm: 'них', helperWord: 'о', questionPrompt: 'о ком? о чём?', exampleSentence: 'Я думаю о них.', afterPreposition: true, acceptedVariants: ['них'], postPrepositionForm: 'них' },
];

export function getForm(lemmaId: string, caseId: string): DeclensionForm | undefined {
  return pronounForms.find(f => f.lemmaId === lemmaId && f.caseId === caseId);
}

export function getFormsForLemma(lemmaId: string): DeclensionForm[] {
  return pronounForms.filter(f => f.lemmaId === lemmaId);
}

export function getFormsForCase(caseId: string): DeclensionForm[] {
  return pronounForms.filter(f => f.caseId === caseId);
}
