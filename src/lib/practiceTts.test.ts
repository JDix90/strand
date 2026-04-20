import { describe, expect, it } from 'vitest';
import {
  buildCompletedPracticeSentence,
  russianTextForPracticeTts,
} from './practiceTts';

describe('buildCompletedPracticeSentence', () => {
  it('fills a single blank', () => {
    expect(buildCompletedPracticeSentence('Я иду с ___.', 'ней')).toBe('Я иду с ней.');
  });

  it('trims whitespace', () => {
    expect(buildCompletedPracticeSentence('  Это ___.  ', 'она')).toBe('Это она.');
  });

  it('returns prompt unchanged when no blank marker', () => {
    expect(buildCompletedPracticeSentence('Где книга?', 'x')).toBe('Где книга?');
  });
});

describe('russianTextForPracticeTts', () => {
  it('strips trailing English gloss in parentheses', () => {
    expect(russianTextForPracticeTts('Я иду с ней. (with her)')).toBe('Я иду с ней.');
    expect(russianTextForPracticeTts('Я дал книгу ей. (to her)')).toBe('Я дал книгу ей.');
    expect(russianTextForPracticeTts('Это она. (it)')).toBe('Это она.');
  });

  it('strips multiple trailing English glosses', () => {
    expect(russianTextForPracticeTts('У меня нет его. (it)')).toBe('У меня нет его.');
  });

  it('keeps parentheses that contain only Cyrillic', () => {
    expect(russianTextForPracticeTts('Слово (вот)')).toBe('Слово (вот)');
  });
});
