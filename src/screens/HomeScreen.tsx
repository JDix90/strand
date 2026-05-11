import Link from 'next/link';

export function HomeScreen() {
  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <div className="max-w-3xl space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-ink md:text-4xl">Practice Russian with focused lessons</h1>
          <p className="text-ink-secondary leading-relaxed">
            Start with Case Practice for declension drills, or work on translation accuracy in Vocabulary.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/case-practice"
            className="rounded-2xl border border-border bg-surface p-5 hover:border-border-strong"
          >
            <p className="text-lg font-bold text-ink">Case Practice</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Build a Focused Drill plan from the 3x6 case grid and run round-based practice.
            </p>
            <p className="mt-3 text-xs font-semibold text-link">Open lesson →</p>
          </Link>
          <Link
            href="/vocabulary"
            className="rounded-2xl border border-border bg-surface p-5 hover:border-border-strong"
          >
            <p className="text-lg font-bold text-ink">Vocabulary</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Practice RU to EN translation with a starter deck.
            </p>
            <p className="mt-3 text-xs font-semibold text-link">Open lesson →</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
