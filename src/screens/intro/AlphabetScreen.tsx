import { useState } from 'react';
import { IntroScreenHeader } from '../../components/intro/IntroScreenHeader';
import { ALPHABET_GROUPS } from '../../data/intro/alphabet';
import { canSpeakRussian, speakRussian } from '../../lib/speakRussian';

export function AlphabetScreen() {
  const [openSpeak, setOpenSpeak] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <IntroScreenHeader
        title="Russian alphabet"
        subtitle="Expand a letter for details. Use Play to hear it if your browser supports speech."
      />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full space-y-10">
        {ALPHABET_GROUPS.map(group => (
          <section key={group.id}>
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">{group.title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {group.letters.map(letter => {
                const key = `${group.id}-${letter.upper}`;
                const expanded = openSpeak === key;
                return (
                  <div key={key} className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSpeak(expanded ? null : key);
                        if (canSpeakRussian()) speakRussian(letter.lower);
                      }}
                      className="w-full p-3 text-center hover:bg-slate-800 transition-colors"
                    >
                      <span className="block text-2xl font-semibold text-white">{letter.upper}</span>
                      <span className="block text-lg text-slate-400">{letter.lower}</span>
                    </button>
                    {expanded && (
                      <div className="px-3 pb-3 text-left border-t border-slate-800">
                        <p className="text-slate-300 text-xs font-medium">{letter.nameEn}</p>
                        <p className="text-slate-500 text-xs mt-1">{letter.translit}</p>
                        {canSpeakRussian() && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              speakRussian(letter.lower);
                            }}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                          >
                            Play again
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
