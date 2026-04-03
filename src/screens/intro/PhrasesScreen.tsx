import { useState } from 'react';
import { IntroScreenHeader } from '../../components/intro/IntroScreenHeader';
import { PHRASE_CATEGORIES } from '../../data/intro/phrases';
import { speakRussian } from '../../lib/speakRussian';

export function PhrasesScreen() {
  const [openId, setOpenId] = useState<string | null>(PHRASE_CATEGORIES[0]?.id ?? null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <IntroScreenHeader
        title="Useful phrases"
        subtitle="Tap Russian to hear it (browser speech). Tap the card to show English."
      />
      <div className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full space-y-3">
        {PHRASE_CATEGORIES.map(cat => {
          const open = openId === cat.id;
          return (
            <div key={cat.id} className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : cat.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/80"
              >
                <span className="font-semibold text-white">{cat.title}</span>
                <span className="text-slate-500 text-sm">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <ul className="border-t border-slate-800 divide-y divide-slate-800">
                  {cat.phrases.map((phrase, i) => {
                    const key = `${cat.id}-${i}`;
                    const showEn = flipped[key];
                    return (
                      <li key={key} className="px-4 py-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-lg text-white">{phrase.ru}</p>
                            <button
                              type="button"
                              onClick={() => speakRussian(phrase.ru)}
                              className="shrink-0 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded border border-slate-600"
                            >
                              Hear
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFlipped(f => ({ ...f, [key]: !showEn }))}
                            className="w-full text-left rounded-lg hover:bg-slate-800/60 py-2 -mx-1 px-1"
                          >
                            {showEn ? (
                              <>
                                <p className="text-slate-300 text-sm">{phrase.en}</p>
                                {phrase.note && (
                                  <p className="text-slate-500 text-xs italic mt-1">{phrase.note}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-slate-500 text-xs">Tap to reveal English</p>
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
