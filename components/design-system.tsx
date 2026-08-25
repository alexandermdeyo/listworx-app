'use client';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Surface = 'dark' | 'light' | 'ironclad' | 'marketing';

export function PageShell({ children, surface = 'dark', className }: { children: ReactNode; surface?: Surface; className?: string }) {
  const surfaceClasses =
    surface === 'marketing'
      ? 'bg-mkt-bg text-mkt-ink mkt-scope'
      : surface === 'light'
      ? 'bg-lw-light-bg text-lw-dark'
      : surface === 'ironclad'
      ? 'bg-black text-zinc-100'
      : 'bg-lw-dark text-lw-light';

  return <div className={cn('min-h-screen', surfaceClasses, className)}>{children}</div>;
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('container mx-auto px-4 py-12 md:py-16', className)}>{children}</section>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  theme = 'dark',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  theme?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <div className={cn('mx-auto mb-10 max-w-3xl text-center', className)}>
      {eyebrow ? <p className="lw-label mb-3">{eyebrow}</p> : null}
      <h2 className={cn('text-3xl md:text-5xl font-semibold tracking-tight text-balance', theme === 'light' && 'text-mkt-ink')}>{title}</h2>
      {description ? (
        <p className={cn('mt-4 text-base md:text-lg', theme === 'light' ? 'text-mkt-ink/70' : 'text-lw-muted')}>{description}</p>
      ) : null}
    </div>
  );
}
