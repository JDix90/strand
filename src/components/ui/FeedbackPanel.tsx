import { useEffect, useMemo } from 'react';
import {
  buildCompletedPracticeSentence,
  russianTextForPracticeTts,
} from '../../lib/practiceTts';
import { canSpeakRussian, speakRussian, warmSpeechSynthesisVoices } from '../../lib/speakRussian';

interface FeedbackPanelProps {
  isCorrect: boolean;
  correctAnswer: string;
  /** Prompt with `___` blank(s); used to build the spoken full sentence. */
  sentencePrompt: string;
  explanation: string;
  onContinue: () => void;
  responseMs?: number;
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

export function FeedbackPanel({
  isCorrect,
  correctAnswer,
  sentencePrompt,
  explanation,
  onContinue,
  responseMs,
}: FeedbackPanelProps) {
  const fullSentence = useMemo(
    () => buildCompletedPracticeSentence(sentencePrompt, correctAnswer),
    [sentencePrompt, correctAnswer],
  );

  /** Russian only — no trailing English glosses in parentheses for TTS. */
  const spokenSentence = useMemo(
    () => russianTextForPracticeTts(fullSentence),
    [fullSentence],
  );

  const speechOk = canSpeakRussian();

  useEffect(() => {
    warmSpeechSynthesisVoices();
  }, []);

  const accent = isCorrect
    ? {
        btn: 'text-emerald-800 hover:bg-emerald-100/90 focus-visible:ring-emerald-500',
        muted: 'text-emerald-700/80',
      }
    : {
        btn: 'text-red-800 hover:bg-red-100/90 focus-visible:ring-red-500',
        muted: 'text-red-700/80',
      };

  return (
    <div
      className={`rounded-2xl border-2 p-6 space-y-3 ${
        isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-red-50 border-red-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0 leading-none pt-0.5">{isCorrect ? '✅' : '❌'}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-xl font-bold ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
            {isCorrect ? 'Correct!' : 'Not quite'}
          </p>
          {!isCorrect && (
            <p className="text-ink-secondary text-sm">
              Correct answer: <span className="font-bold text-ink text-lg">{correctAnswer}</span>
            </p>
          )}
          {responseMs && (
            <p className="text-ink-secondary text-xs">{(responseMs / 1000).toFixed(1)}s</p>
          )}
        </div>
        <button
          type="button"
          disabled={!speechOk}
          aria-disabled={!speechOk}
          aria-label={`Hear sentence: ${spokenSentence}`}
          title={
            speechOk
              ? 'Play full sentence (Russian only)'
              : 'Pronunciation not supported in this browser'
          }
          onClick={() => speakRussian(spokenSentence)}
          className={`shrink-0 p-2.5 rounded-full border border-current/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-45 disabled:cursor-not-allowed ${accent.btn}`}
        >
          <SpeakerIcon className="w-6 h-6" />
        </button>
      </div>
      <p className={`text-sm ${accent.muted}`} lang="ru">
        {spokenSentence}
      </p>
      <p className="text-ink-secondary text-sm leading-relaxed">{explanation}</p>
      <button
        type="button"
        data-testid="practice-continue"
        onClick={onContinue}
        className="w-full mt-2 py-3 rounded-xl bg-mustard hover:bg-mustard-hover text-ink font-semibold transition-colors shadow-sm"
      >
        Continue →
      </button>
    </div>
  );
}
