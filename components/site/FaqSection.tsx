import { Reveal } from '@/components/motion';
import { Plus } from 'lucide-react';

export interface FaqItem {
  q: string;
  a: string; // paragraphs split on '\n\n'
}

/**
 * A marketing FAQ block — native <details> accordion so it works without JS and
 * stays accessible. `tone` switches between the light marketing surface and the
 * dark mailer surface used on the contractors / IronClad pages.
 */
export default function FaqSection({
  items,
  tone = 'light',
  eyebrow = 'FAQ',
  title = 'Questions, answered.',
  intro,
  className = '',
}: {
  items: FaqItem[];
  tone?: 'light' | 'dark';
  eyebrow?: string;
  title?: string;
  intro?: string;
  className?: string;
}) {
  const dark = tone === 'dark';

  return (
    <section
      className={`${dark ? 'bg-mailer-black text-white' : 'bg-white text-mkt-ink'} py-20 md:py-28 ${className}`}
    >
      <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <p className={`lw-label-lg mb-3 ${dark ? '!text-lw-rust' : '!text-lw-rust'}`}>{eyebrow}</p>
          <h2
            className={`text-3xl font-bold tracking-tight md:text-4xl ${dark ? 'text-white' : 'text-mkt-ink'}`}
          >
            {title}
          </h2>
          {intro ? (
            <p className={`mt-4 max-w-md ${dark ? 'text-white/65' : 'text-mkt-ink/65'}`}>{intro}</p>
          ) : null}
        </Reveal>

        <Reveal>
          <ul className={`divide-y ${dark ? 'divide-mailer-border' : 'divide-zinc-200'}`}>
            {items.map(({ q, a }) => (
              <li key={q}>
                <details className="group py-5">
                  <summary
                    className={`flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-semibold ${
                      dark ? 'text-white' : 'text-mkt-ink'
                    }`}
                  >
                    <span>{q}</span>
                    <Plus
                      className={`mt-1 h-5 w-5 shrink-0 text-lw-rust transition-transform duration-200 group-open:rotate-45`}
                    />
                  </summary>
                  <div className={`mt-3 space-y-3 ${dark ? 'text-white/70' : 'text-mkt-ink/70'}`}>
                    {a.split('\n\n').map((para, i) => (
                      <p key={i} className="leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
