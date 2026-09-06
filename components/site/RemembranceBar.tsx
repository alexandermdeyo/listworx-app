/**
 * A commemorative ribbon at the very top of the homepage — the distressed flag
 * showing through behind a short statement of solidarity with the military and
 * first responders. No CTA, no link; it's a statement, not a promo.
 */
export default function RemembranceBar() {
  return (
    <section
      aria-label="September 11 remembrance"
      className="relative isolate overflow-hidden border-b border-white/10 bg-[#0b1a30]"
    >
      {/* the flag, mostly visible, edge-masked so it never fights the text */}
      <img
        src="/images/redesign/flag-distressed.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[center_35%] opacity-[0.7] saturate-[0.9]"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent, #000 16%, #000 84%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, #000 16%, #000 84%, transparent)',
        }}
      />
      {/* light wash — ~20% — just to keep the text legible over the stripes */}
      <div className="absolute inset-0 bg-[#0b1a30]/20" aria-hidden="true" />

      <p className="relative mx-auto max-w-3xl px-4 py-4 text-center text-sm leading-snug text-white [text-shadow:_0_1px_4px_rgba(0,0,0,0.75)] md:py-6 md:text-base">
        <span className="font-bold tracking-wide">In remembrance of September 11, 2001.</span>{' '}
        ListWorx stands with the military and first responders who answered the call — then and
        now.
      </p>
    </section>
  );
}
