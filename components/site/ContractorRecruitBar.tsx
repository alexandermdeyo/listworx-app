import Link from 'next/link';

/**
 * Contractor recruiting strip under the holiday banner on the homepage.
 * Every Tennessee county whose population center is within ~100 miles of
 * downtown Nashville, nearest first. All are active in contractor signup.
 */
const COUNTIES = [
  'Davidson', 'Cheatham', 'Williamson', 'Sumner', 'Wilson', 'Robertson', 'Rutherford', 'Dickson',
  'Trousdale', 'Maury', 'Hickman', 'Montgomery', 'Smith', 'Cannon', 'Marshall', 'Bedford',
  'Macon', 'Houston', 'DeKalb', 'Humphreys', 'Lewis', 'Coffee', 'Stewart', 'Warren',
  'Jackson', 'Moore', 'Giles', 'Perry', 'Putnam', 'Lawrence', 'Benton', 'Clay',
  'Lincoln', 'White', 'Franklin', 'Van Buren', 'Grundy', 'Overton', 'Decatur', 'Wayne',
  'Henry', 'Carroll', 'Pickett', 'Sequatchie', 'Bledsoe', 'Henderson', 'Marion', 'Cumberland',
];

function CountyRun() {
  return (
    <>
      {COUNTIES.map((c) => (
        <span key={c} className="inline-flex items-center gap-3 px-3">
          <span className="text-white/80">{c}</span>
          <span aria-hidden="true" className="text-lw-rust">◆</span>
        </span>
      ))}
    </>
  );
}

export default function ContractorRecruitBar() {
  return (
    <section aria-label="Now recruiting contractors" className="relative overflow-hidden bg-[#1a1a1a] border-b border-lw-rust/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 pt-4 pb-3 text-center md:flex-row md:justify-between md:gap-6 md:text-left">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <span className="lw-recruit-badge inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-lw-rust px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
            <span className="lw-recruit-dot h-2 w-2 rounded-full bg-white" aria-hidden="true" />
            Now recruiting
          </span>
          <p className="text-sm leading-snug text-white md:text-base">
            <span className="font-bold">Contractors in Nashville and every Tennessee county within 100 miles:</span>{' '}
            <span className="text-white/75">founding spots are open in your trade.</span>
          </p>
        </div>
        <Link
          href="/contractors"
          className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#1a1a1a] transition-colors hover:bg-lw-rust hover:text-white"
        >
          Sign up under For Contractors →
        </Link>
      </div>

      {/* County ticker: list is doubled so the scroll loops seamlessly */}
      <div className="relative border-t border-white/10 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#1a1a1a] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#1a1a1a] to-transparent" />
        <div aria-hidden="true" className="lw-county-ticker flex w-max whitespace-nowrap">
          <CountyRun />
          <CountyRun />
        </div>
        <p className="sr-only">Counties: {COUNTIES.join(', ')}.</p>
      </div>
    </section>
  );
}
