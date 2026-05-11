/** E.164: + then country code and subscriber (8–15 digits total after +). */
const E164_RE = /^\+[1-9]\d{7,14}$/;

export function isE164Phone(phone: string): boolean {
  const t = phone.trim();
  return E164_RE.test(t);
}

/** Deterministic internal email for phone-primary accounts (never shown in UI). */
export function phoneToPseudoEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `pn${digits}@internal.languini.dev`;
}
