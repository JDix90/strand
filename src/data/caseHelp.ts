import type { CaseId } from '../types';

export interface CaseHelpContent {
  /** One-line role of the case in a sentence */
  summary: string;
  /** Typical triggers: prepositions, verbs, constructions */
  cues: string[];
  /** Optional single caveat for common mix-ups */
  note?: string;
}

export const caseHelp: Record<CaseId, CaseHelpContent> = {
  nominative: {
    summary: 'The default “subject” form: who or what performs the action or is identified.',
    cues: [
      'Это …, Вот … (identification)',
      'Subject before the verb: … идёт, … работает, … стоит',
      'Vocabulary questions: кто? что? for the subject',
    ],
    note: 'Not used after most prepositions; location “in/on” uses prepositional, not nominative.',
  },
  genitive: {
    summary: '“Of / from / without / none”: possession, absence, source, and many prepositions.',
    cues: [
      'У меня нет … (нет + genitive)',
      'без, из, от, для, после, до, около, у (near/possession)',
      'Quantity: много / мало / сколько + genitive',
    ],
    note: 'Watch близко к + dative vs около + genitive — different patterns.',
  },
  dative: {
    summary: '“To/for whom” (indirect object), reference point, and several prepositions.',
    cues: [
      'дать, помочь, звонить, писать + dative (кому?)',
      'к … (toward), по … (along; city/avenue), благодаря …',
      'Спасибо …!, Рад …, нравится + dative experiencer',
    ],
    note: 'к + dative (toward someone) is not the same as в + accusative (into a place).',
  },
  accusative: {
    summary: 'Direct object of the action, motion into a place, and some prepositions.',
    cues: [
      'Transitive verbs: видеть, любить, ждать, покупать, читать + кого? что?',
      'в …, на … (motion into / onto)',
      'Смотреть на …, ждать … (.animate direct object)',
    ],
    note: 'Animate masculine accusative often matches the genitive form (e.g. вижу брата).',
  },
  instrumental: {
    summary: '“With / by / as”: accompaniment, means, and static spatial prepositions.',
    cues: [
      'с / со … (together with)',
      'гордиться, пользоваться, управлять + instrumental',
      'перед, за, между, над, под + instrumental (fixed pairs)',
      'стать … (role): он стал врачом',
    ],
    note: 'Same case covers “with a friend” and “works as a teacher” — different senses, same endings.',
  },
  prepositional: {
    summary: 'Location “in/on/at” at rest, “about”, and a few other prepositions + place/topic.',
    cues: [
      'о / об / обо … (about)',
      'в …, на … (static location: в городе, на столе)',
      'при … (in the presence of), в отношении … (advanced)',
    ],
    note: 'Compare в город (accusative, motion) vs в городе (prepositional, location).',
  },
};
