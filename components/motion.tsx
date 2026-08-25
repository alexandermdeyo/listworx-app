'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tag = 'div' | 'section' | 'span' | 'li' | 'h1' | 'h2' | 'h3';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Fades + translates content up as it scrolls into view (or immediately on
 * mount when `immediate` is set, for above-the-fold hero content). Fires
 * once — never re-triggers on scroll back up. No-ops visually when the user
 * has prefers-reduced-motion set. Marketing-only: relies on the `.reveal`
 * CSS in globals.css which is scoped under `.mkt-scope`.
 */
export function Reveal({
  children,
  as = 'div',
  delay = 0,
  immediate = false,
  pulse = false,
  className,
}: {
  children: ReactNode;
  as?: Tag;
  /** stagger delay in ms */
  delay?: number;
  /** animate on mount instead of on scroll-into-view (use for hero content) */
  immediate?: boolean;
  /** layer a single subtle pulse on top of the reveal (e.g. recommended pricing tier) */
  pulse?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    if (immediate) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate, reducedMotion]);

  const Tag = as as any;
  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref}
      style={style}
      className={cn('reveal', visible && 'is-visible', visible && pulse && 'pulse-once-visible', className)}
    >
      {children}
    </Tag>
  );
}

/**
 * One-time clip-path "assemble" wipe for badge/seal images — the closest
 * honest equivalent to an SVG stroke-draw when the asset is a raster PNG.
 */
export function RevealBadge({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div ref={ref} className={cn('badge-draw', visible && 'is-visible', className)}>
      {children}
    </div>
  );
}
