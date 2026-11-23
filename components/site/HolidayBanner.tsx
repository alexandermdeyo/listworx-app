import { isHolidaySeason } from './HolidayBar';

/** Full-width holiday banner art (official ListWorx logo), shown Nov 1 to Jan 6. */
export default function HolidayBanner() {
  if (!isHolidaySeason()) return null;
  return (
    <div className="w-full bg-[#8f121c]">
      <img
        src="/images/brand/holiday-banner.webp"
        alt="ListWorx: wishing everyone a safe and happy holidays"
        className="block h-auto w-full"
        width={2172}
        height={215}
        fetchPriority="high"
      />
    </div>
  );
}
