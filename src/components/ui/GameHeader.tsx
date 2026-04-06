import { useNavigate } from 'react-router-dom';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  onQuit?: () => void;
  rightSlot?: React.ReactNode;
}

export function GameHeader({ title, subtitle, onQuit, rightSlot }: GameHeaderProps) {
  const navigate = useNavigate();

  const handleQuit = () => {
    if (onQuit) {
      onQuit();
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface-elevated border-b border-border">
      <div className="flex items-center gap-3">
        <button
          onClick={handleQuit}
          className="text-ink-secondary hover:text-ink transition-colors p-1 rounded"
          title="Quit to home"
        >
          ✕
        </button>
        <div>
          <h2 className="text-ink font-bold text-base leading-tight">{title}</h2>
          {subtitle && <p className="text-ink-secondary text-xs">{subtitle}</p>}
        </div>
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}
