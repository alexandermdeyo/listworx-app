/**
 * Seasonal ribbon at the very top of the homepage: deep evergreen, slow
 * falling snow, a thin gold-and-rust trim. Classy, not cartoony. Shows only
 * during the holiday season (Nov 1 – Jan 6) and renders nothing otherwise,
 * so it never goes stale. Snow stops for visitors who prefer reduced motion.
 */

function isHolidaySeason(now = new Date()) {
  const m = now.getMonth(); // 0 = Jan
  const d = now.getDate();
  return m === 10 || m === 11 || (m === 0 && d <= 6);
}

export default function HolidayBar() {
  if (!isHolidaySeason()) return null;

  return (
    <section
      aria-label="Holiday greeting"
      className="lw-holiday-bar relative isolate overflow-hidden bg-[#0f2a1f]"
    >
      {/* soft glow so the center reads warm, not flat */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(232,98,26,0.18) 0%, transparent 65%)' }}
      />
      {/* two snow layers drifting at different speeds for depth */}
      <div aria-hidden="true" className="lw-snow lw-snow-far absolute inset-0" />
      <div aria-hidden="true" className="lw-snow lw-snow-near absolute inset-0" />

      <p className="relative mx-auto max-w-3xl px-4 py-4 text-center text-sm leading-snug text-white [text-shadow:_0_1px_4px_rgba(0,0,0,0.6)] md:py-5 md:text-base">
        <span className="font-bold tracking-wide text-[#f3d27a]">✦ Happy Holidays from ListWorx ✦</span>{' '}
        <span className="text-white/90">
          Thank you to every homeowner, contractor, and realtor who trusted us this year. Here&apos;s to a warm,
          safe season and a strong new year.
        </span>
      </p>

      {/* gold + rust trim along the bottom edge */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#b8892f] via-[#E8621A] to-[#b8892f]" />
    </section>
  );
}
