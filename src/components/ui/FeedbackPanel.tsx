interface FeedbackPanelProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  onContinue: () => void;
  responseMs?: number;
}

export function FeedbackPanel({ isCorrect, correctAnswer, explanation, onContinue, responseMs }: FeedbackPanelProps) {
  return (
    <div
      className={`rounded-2xl border-2 p-6 space-y-3 ${
        isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-red-50 border-red-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{isCorrect ? '✅' : '❌'}</span>
        <div>
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
      </div>
      <p className="text-ink-secondary text-sm leading-relaxed">{explanation}</p>
      <button
        onClick={onContinue}
        className="w-full mt-2 py-3 rounded-xl bg-mustard hover:bg-mustard-hover text-ink font-semibold transition-colors shadow-sm"
      >
        Continue →
      </button>
    </div>
  );
}
