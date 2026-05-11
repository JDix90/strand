import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import type { CaseId } from '../../types';
import { caseMetadata } from '../../data/caseMetadata';
import { caseHelp } from '../../data/caseHelp';

export interface CaseHelpDialogProps {
  caseId: CaseId | null;
  onOpenChange: (next: CaseId | null) => void;
  triggerRef: MutableRefObject<HTMLElement | null>;
}

const CASE_SHORT: Record<CaseId, string> = {
  nominative: 'Nom',
  genitive: 'Gen',
  dative: 'Dat',
  accusative: 'Acc',
  instrumental: 'Ins',
  prepositional: 'Prep',
};

export function CaseHelpDialog({ caseId, onOpenChange, triggerRef }: CaseHelpDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = 'case-help-dialog-title';

  useLayoutEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (caseId) {
      if (!el.open) el.showModal();
      queueMicrotask(() => {
        el.querySelector<HTMLButtonElement>('[data-case-help-close]')?.focus();
      });
    } else if (el.open) {
      el.close();
    }
  }, [caseId]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const onDialogClose = () => {
      onOpenChange(null);
      triggerRef.current?.focus({ preventScroll: true });
      triggerRef.current = null;
    };

    el.addEventListener('close', onDialogClose);
    return () => el.removeEventListener('close', onDialogClose);
  }, [onOpenChange, triggerRef]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) el.close();
    };

    el.addEventListener('pointerdown', onPointerDown);
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const meta = caseId ? caseMetadata[caseId] : null;
  const help = caseId ? caseHelp[caseId] : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={caseId ? titleId : undefined}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-0 text-ink shadow-lg backdrop:bg-black/40 open:flex open:max-h-[min(90vh,32rem)] open:flex-col"
    >
      {meta && help && caseId ? (
        <>
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0 flex items-start gap-2">
              <span className="text-2xl shrink-0" aria-hidden>
                {meta.icon}
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-bold leading-tight">
                  {meta.label}
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  {CASE_SHORT[caseId]} · {meta.questionPrompt}
                </p>
              </div>
            </div>
            <button
              type="button"
              data-case-help-close
              onClick={() => dialogRef.current?.close()}
              className="shrink-0 min-h-10 min-w-10 rounded-xl border border-border bg-surface-elevated text-sm font-semibold text-ink hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-4 text-sm">
            <p className="text-ink leading-relaxed">{help.summary}</p>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">
                In this app
              </p>
              <p>
                <span className="font-medium text-ink">Cue hint:</span>{' '}
                <span className="text-ink">{meta.helperWord}</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">
                Typical cues
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-secondary">
                {help.cues.map((line, i) => (
                  <li key={i} className="leading-snug">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {help.note && (
              <div className="rounded-xl border border-border bg-surface-muted/80 px-3 py-2 text-xs text-ink-secondary">
                <span className="font-semibold text-ink">Note.</span> {help.note}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="w-full min-h-11 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold transition-colors"
            >
              Got it
            </button>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
