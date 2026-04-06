interface BossHealthBarProps {
  hp: number;
  maxHp: number;
  shieldHp: number;
}

export function BossHealthBar({ hp, maxHp, shieldHp }: BossHealthBarProps) {
  const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));
  const hpColor = hpPct > 50 ? '#ef4444' : hpPct > 25 ? '#f97316' : '#dc2626';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-ink-secondary font-semibold">BOSS HP</span>
        <span className="text-red-400 font-bold tabular-nums">{Math.max(0, hp)} / {maxHp}</span>
      </div>
      <div className="relative h-5 bg-surface rounded-full overflow-hidden border border-border-strong">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
        />
        {shieldHp > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-200">🛡 SHIELD {shieldHp}</span>
          </div>
        )}
      </div>
      {shieldHp > 0 && (
        <div className="h-2 bg-blue-900 rounded-full overflow-hidden border border-brand">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-500"
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
