interface TimerDisplayProps {
  seconds: number;
  warning?: boolean;
  danger?: boolean;
}

export function TimerDisplay({ seconds, warning, danger }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      className={`font-mono text-2xl font-bold tabular-nums px-4 py-2 rounded-xl border-2 ${
        danger
          ? 'text-red-400 border-red-500 bg-red-950 animate-pulse'
          : warning
          ? 'text-yellow-400 border-yellow-500 bg-yellow-950'
          : 'text-ink border-border-strong bg-surface'
      }`}
    >
      {display}
    </div>
  );
}
