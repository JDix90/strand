import { Link } from 'react-router-dom';

const sizes = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-xl' },
  lg: { icon: 44, text: 'text-2xl' },
} as const;

interface BrandLogoProps {
  className?: string;
  size?: keyof typeof sizes;
  /** Wrap wordmark in link to home (or landing when unauthenticated) */
  to?: string;
  /** Show icon + wordmark; false shows wordmark only */
  showIcon?: boolean;
}

function MarkIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M8 10a6 6 0 016-6h20a6 6 0 016 6v18a6 6 0 01-6 6h-8l-6 6v-6h-6a6 6 0 01-6-6V10z"
        fill="#2E4E8E"
      />
      <path
        d="M8 22c6-2 14-2 22 0 5 1 10 0 14-2v8H8v-6z"
        fill="#2a9d8f"
      />
      <path
        d="M16 14c2.5-1 5 3 4 8-.5 3-2.5 5.5-5 7l-2.5-2c2-1 3.5-3 4-6 .5-3-1-6-3-7l2.5-2.5z"
        fill="white"
      />
    </svg>
  );
}

export function BrandLogo({ className = '', size = 'md', to, showIcon = true }: BrandLogoProps) {
  const s = sizes[size];
  const inner = (
    <span
      data-testid="brand-logo"
      className={`inline-flex items-center font-bold tracking-tight gap-2 ${className}`}
    >
      {showIcon && <MarkIcon size={s.icon} />}
      <span className={`${s.text} text-brand italic`}>Languini</span>
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        data-testid="brand-logo-link"
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
