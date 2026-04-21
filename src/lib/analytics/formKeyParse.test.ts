import { describe, expect, it } from 'vitest';
import { isVocabularyFormKey, parseDeclensionCaseId } from './formKeyParse';

describe('parseDeclensionCaseId', () => {
  it('reads case from lemma:case keys', () => {
    expect(parseDeclensionCaseId('ya:nominative')).toBe('nominative');
    expect(parseDeclensionCaseId('stol:genitive')).toBe('genitive');
  });

  it('returns null when the last segment is not a grammatical case', () => {
    expect(parseDeclensionCaseId('vocab:food:lemma1:ru-en')).toBe(null);
  });
});

describe('isVocabularyFormKey', () => {
  it('detects vocab prefix', () => {
    expect(isVocabularyFormKey('vocab:x:y:z')).toBe(true);
    expect(isVocabularyFormKey('ya:nominative')).toBe(false);
  });
});
