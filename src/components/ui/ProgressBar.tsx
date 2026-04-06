interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
}

export function ProgressBar({
  value,
  color = '#3b82f6',
  height = 'h-2',
  showLabel = false,
  label,
  animate = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-ink-secondary">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-surface-muted rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full ${animate ? 'transition-all duration-500' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
