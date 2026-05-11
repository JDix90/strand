import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-ink-secondary text-sm py-8" aria-live="polite">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
