import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  backTo?: string;
  subtitle?: string;
}

export function IntroScreenHeader({ title, backTo = '/intro', subtitle }: Props) {
  const navigate = useNavigate();
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
      <div className="max-w-2xl mx-auto flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="text-slate-400 hover:text-white text-sm shrink-0 mt-0.5"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
