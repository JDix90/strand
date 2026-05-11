import { describe, expect, it } from 'vitest';
import { isE164Phone, phoneToPseudoEmail } from './phone';

describe('isE164Phone', () => {
  it('accepts plausible E.164', () => {
    expect(isE164Phone('+15551234567')).toBe(true);
    expect(isE164Phone('+442071838750')).toBe(true);
  });

  it('rejects missing plus or bad length', () => {
    expect(isE164Phone('15551234567')).toBe(false);
    expect(isE164Phone('+123')).toBe(false);
    expect(isE164Phone('+')).toBe(false);
  });
});

describe('phoneToPseudoEmail', () => {
  it('strips non-digits for local part', () => {
    expect(phoneToPseudoEmail('+1 (555) 123-4567')).toBe('pn15551234567@internal.languini.dev');
  });
});
