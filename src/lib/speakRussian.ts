/**
 * Browser speech synthesis for Russian. Uses lang ru-RU; picks a Russian voice when listed.
 */

function pickRussianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ru =
    voices.find(v => v.lang.toLowerCase().startsWith('ru')) ??
    voices.find(v => /russian/i.test(v.name));
  return ru ?? null;
}

export function canSpeakRussian(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

/** Speak Russian text. Uses ru-RU; prefers a Russian voice when the browser exposes one. */
export function speakRussian(text: string): void {
  if (!canSpeakRussian() || !text.trim()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickRussianVoice();
  u.lang = voice?.lang ?? 'ru-RU';
  if (voice) u.voice = voice;
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}
