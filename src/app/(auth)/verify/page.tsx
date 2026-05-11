import { Suspense } from 'react';
import { VerifyForm } from './VerifyForm';

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-ink-secondary text-sm py-8" aria-live="polite">
          Loading…
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
