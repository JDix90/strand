interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass[size]} rounded-full object-cover border border-border-strong shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass[size]} rounded-full bg-brand/25 border border-border-strong flex items-center justify-center font-semibold text-ink shrink-0 ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
