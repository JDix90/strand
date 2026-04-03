/** Cyrillic alphabet reference: upper, lower, Latin name, transliteration hint. */

export interface CyrillicLetter {
  upper: string;
  lower: string;
  /** Latin letter name (e.g. "A as in father") */
  nameEn: string;
  /** Approximate sound / Latin equivalent for beginners */
  translit: string;
}

export interface AlphabetGroup {
  id: string;
  title: string;
  letters: CyrillicLetter[];
}

/** Grouped: familiar Greek/Latin shapes first, then Russian-specific letters. */
export const ALPHABET_GROUPS: AlphabetGroup[] = [
  {
    id: 'similar',
    title: 'Letters like Latin or Greek',
    letters: [
      { upper: 'А', lower: 'а', nameEn: 'A', translit: 'a as in father' },
      { upper: 'Е', lower: 'е', nameEn: 'Ye / E', translit: 'ye after consonant, e in "yes"' },
      { upper: 'К', lower: 'к', nameEn: 'K', translit: 'k' },
      { upper: 'М', lower: 'м', nameEn: 'M', translit: 'm' },
      { upper: 'О', lower: 'о', nameEn: 'O', translit: 'o as in more' },
      { upper: 'Т', lower: 'т', nameEn: 'T', translit: 't' },
    ],
  },
  {
    id: 'core',
    title: 'Common Cyrillic letters',
    letters: [
      { upper: 'Б', lower: 'б', nameEn: 'B', translit: 'b' },
      { upper: 'В', lower: 'в', nameEn: 'V', translit: 'v' },
      { upper: 'Г', lower: 'г', nameEn: 'G', translit: 'g as in go' },
      { upper: 'Д', lower: 'д', nameEn: 'D', translit: 'd' },
      { upper: 'Ё', lower: 'ё', nameEn: 'Yo', translit: 'yo' },
      { upper: 'Ж', lower: 'ж', nameEn: 'Zh', translit: 'zh as in pleasure' },
      { upper: 'З', lower: 'з', nameEn: 'Z', translit: 'z' },
      { upper: 'И', lower: 'и', nameEn: 'I', translit: 'ee' },
      { upper: 'Й', lower: 'й', nameEn: 'Short i', translit: 'y as in boy' },
      { upper: 'Л', lower: 'л', nameEn: 'L', translit: 'l' },
      { upper: 'Н', lower: 'н', nameEn: 'N', translit: 'n' },
      { upper: 'П', lower: 'п', nameEn: 'P', translit: 'p' },
      { upper: 'Р', lower: 'р', nameEn: 'R', translit: 'rolled r' },
      { upper: 'С', lower: 'с', nameEn: 'S', translit: 's' },
      { upper: 'У', lower: 'у', nameEn: 'U', translit: 'oo' },
      { upper: 'Ф', lower: 'ф', nameEn: 'F', translit: 'f' },
      { upper: 'Х', lower: 'х', nameEn: 'Kh', translit: 'ch as in Bach' },
      { upper: 'Ц', lower: 'ц', nameEn: 'Ts', translit: 'ts' },
      { upper: 'Ч', lower: 'ч', nameEn: 'Ch', translit: 'ch as in chip' },
      { upper: 'Ш', lower: 'ш', nameEn: 'Sh', translit: 'sh' },
      { upper: 'Щ', lower: 'щ', nameEn: 'Shch', translit: 'shch' },
      { upper: 'Ъ', lower: 'ъ', nameEn: 'Hard sign', translit: 'very short pause' },
      { upper: 'Ы', lower: 'ы', nameEn: 'Y', translit: 'ih (back vowel)' },
      { upper: 'Ь', lower: 'ь', nameEn: 'Soft sign', translit: 'softens previous consonant' },
      { upper: 'Э', lower: 'э', nameEn: 'E', translit: 'e as in met' },
      { upper: 'Ю', lower: 'ю', nameEn: 'Yu', translit: 'yu' },
      { upper: 'Я', lower: 'я', nameEn: 'Ya', translit: 'ya' },
    ],
  },
];

export const ALL_LETTERS_FLAT: CyrillicLetter[] = ALPHABET_GROUPS.flatMap(g => g.letters);
