interface AnswerButtonProps {
  label: string;
  onClick: () => void;
  state?: 'default' | 'correct' | 'wrong' | 'disabled';
  index?: number;
  className?: string;
}

const stateStyles = {
  default: 'bg-surface border-border-strong text-ink hover:bg-surface-muted hover:border-border-strong cursor-pointer shadow-[var(--shadow-card)]',
  correct: 'bg-emerald-100 border-emerald-500 text-emerald-900 cursor-default',
  wrong: 'bg-red-100 border-red-400 text-red-900 cursor-default',
  disabled: 'bg-surface-elevated border-border text-ink-secondary cursor-not-allowed',
};

const indexLabels = ['A', 'B', 'C', 'D'];

export function AnswerButton({ label, onClick, state = 'default', index, className = '' }: AnswerButtonProps) {
  return (
    <button
      onClick={state === 'default' ? onClick : undefined}
      disabled={state === 'disabled'}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left text-lg font-medium transition-all duration-150 ${stateStyles[state]} ${className}`}
    >
      {index !== undefined && (
        <span className="flex-shrink-0 w-7 h-7 rounded-full border border-current flex items-center justify-center text-sm font-bold opacity-60">
          {indexLabels[index]}
        </span>
      )}
      <span className="font-bold text-xl">{label}</span>
    </button>
  );
}
