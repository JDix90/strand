import { useState } from 'react';
import { IntroScreenHeader } from '../../components/intro/IntroScreenHeader';
import { ALPHABET_GROUPS } from '../../data/intro/alphabet';
import { canSpeakRussian, speakRussian } from '../../lib/speakRussian';

export function AlphabetScreen() {
  const [openSpeak, setOpenSpeak] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <IntroScreenHeader
        title="Russian alphabet"
        subtitle="Expand a letter for details. Use Play to hear it if your browser supports speech."
      />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full space-y-10">
        {ALPHABET_GROUPS.map(group => (
          <section key={group.id}>
            <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">{group.title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {group.letters.map(letter => {
                const key = `${group.id}-${letter.upper}`;
                const expanded = openSpeak === key;
                return (
                  <div key={key} className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSpeak(expanded ? null : key);
                        if (canSpeakRussian()) speakRussian(letter.lower);
                      }}
                      className="w-full p-3 text-center hover:bg-surface transition-colors"
                    >
                      <span className="block text-2xl font-semibold text-ink">{letter.upper}</span>
                      <span className="block text-lg text-ink-secondary">{letter.lower}</span>
                    </button>
                    {expanded && (
                      <div className="px-3 pb-3 text-left border-t border-border">
                        <p className="text-ink-secondary text-xs font-medium">{letter.nameEn}</p>
                        <p className="text-ink-secondary text-xs mt-1">{letter.translit}</p>
                        {canSpeakRussian() && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              speakRussian(letter.lower);
                            }}
                            className="mt-2 text-xs text-link hover:text-link"
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
