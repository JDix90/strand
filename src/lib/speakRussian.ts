/**
 * Browser speech synthesis for Russian and English. Prefers matching voices when listed;
 * Chrome often loads voices asynchronously — we handle `voiceschanged` + a short fallback.
 */

import { stripCombiningStressForTts } from './ttsNormalize';

function pickRussianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ru =
    voices.find(v => v.lang.toLowerCase().startsWith('ru')) ??
    voices.find(v => /russian/i.test(v.name));
  return ru ?? null;
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang.toLowerCase().startsWith('en-us')) ??
    voices.find(v => v.lang.toLowerCase().startsWith('en')) ??
    voices.find(v => /english/i.test(v.name)) ??
    null
  );
}

export function canSpeakRussian(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

/** Same API surface; Web Speech supports both locales when available. */
export function canSpeakEnglish(): boolean {
  return canSpeakRussian();
}

export function canSpeakLang(_lang: 'ru' | 'en'): boolean {
  return canSpeakRussian();
}

let warmRegistered = false;

/** Prime the voice list on engines that load voices asynchronously (call once from a mounted screen). */
export function warmSpeechSynthesisVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis || warmRegistered) return;
  warmRegistered = true;
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  } catch {
    /* ignore */
  }
}

function runWhenVoicesReady(run: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) {
    run();
    return;
  }
  const onVoices = () => {
    synth.removeEventListener('voiceschanged', onVoices);
    window.clearTimeout(fallbackId);
    run();
  };
  synth.addEventListener('voiceschanged', onVoices);
  synth.getVoices();
  const fallbackId = window.setTimeout(() => {
    synth.removeEventListener('voiceschanged', onVoices);
    run();
  }, 500);
}

/** Speak Russian text. Uses ru-RU; prefers a Russian voice when the browser exposes one. */
export function speakRussian(text: string): void {
  if (!canSpeakRussian() || !text.trim()) return;
  const plain = stripCombiningStressForTts(text.trim());

  const doSpeak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain);
    const voice = pickRussianVoice();
    u.lang = voice?.lang ?? 'ru-RU';
    if (voice) u.voice = voice;
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  runWhenVoicesReady(doSpeak);
}

/** Speak English text (e.g. EN→RU vocabulary prompts). Prefers en-US when listed. */
export function speakEnglish(text: string): void {
  if (!canSpeakEnglish() || !text.trim()) return;
  const plain = text.trim();

  const doSpeak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain);
    const voice = pickEnglishVoice();
    u.lang = voice?.lang ?? 'en-US';
    if (voice) u.voice = voice;
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  runWhenVoicesReady(doSpeak);
}
