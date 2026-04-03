import { Link } from 'react-router-dom';
import { IntroScreenHeader } from '../../components/intro/IntroScreenHeader';

const cards = [
  {
    to: '/intro/alphabet',
    title: 'Alphabet',
    description: 'Cyrillic letters, names, and approximate sounds.',
    icon: 'А',
    color: '#3b82f6',
    tag: 'Reference',
  },
  {
    to: '/intro/phrases',
    title: 'Useful phrases',
    description: 'Greetings, politeness, and classroom Russian.',
    icon: '💬',
    color: '#22c55e',
    tag: 'Reference',
  },
  {
    to: '/intro/play',
    title: 'Games & drills',
    description: 'Quizzes, matching pairs, and typing practice.',
    icon: '🎮',
    color: '#a855f7',
    tag: 'Interactive',
  },
];

export function IntroHubScreen() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <IntroScreenHeader
        title="Getting started"
        backTo="/home"
        subtitle="Optional basics before you join a class."
      />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(c => (
            <Link
              key={c.to}
              to={c.to}
              className="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{c.icon}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: c.color + '22', color: c.color }}
                >
                  {c.tag}
                </span>
              </div>
              <h2 className="text-white font-bold text-base mb-1">{c.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{c.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
