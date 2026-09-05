'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ChevronRight, Crown, Star, Award, Building2, FileCheck, ShieldCheck, CircleX as XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { Reveal, RevealBadge } from '@/components/motion';
import TristarMark from '@/components/site/TristarMark';

const APPLY_HREF = '/contractor-portal?intent=apply';

const TM = () => (
  <sup style={{ fontSize: '0.45em', verticalAlign: 'super', opacity: 0.7, letterSpacing: 0 }}>™</sup>
);

const AGREEMENT_SECTIONS = [
  {
    num: '1',
    title: 'Purpose and Scope',
    body: 'These Standards ("IronClad Standards") establish the minimum performance, compliance, and accountability requirements governing all contractors actively participating in the ListWorx referral network ("Partner Contractors"). These Standards apply in full from the date of acceptance and remain in effect for the duration of any active participation in the network. Acceptance of these Standards is a prerequisite to receiving any referral through ListWorx. Continued participation constitutes ongoing agreement to all provisions herein.',
  },
  {
    num: '2',
    title: 'Licensing Requirements',
    body: 'Contractor shall maintain, in active and good standing, all state-issued trade licenses applicable to the services offered under this agreement. Licenses must be held in the legal name of the business entity applying to the network — not in the name of a third party, subcontractor, or affiliated business. Contractors operating across multiple trades are required to hold valid credentials for each trade in which they accept referrals. Any suspension, revocation, lapse, restriction, or change in licensing status must be disclosed to ListWorx in writing within 48 hours of the contractor becoming aware of such a change. Failure to disclose a licensing deficiency is grounds for immediate removal from the network.',
  },
  {
    num: '3',
    title: 'Insurance Requirements',
    body: 'Contractor shall maintain general liability insurance at a minimum coverage level of $1,000,000 per occurrence and $2,000,000 aggregate. Where required by state law, workers\' compensation insurance must also be maintained and current certificates kept on file with ListWorx. Documentation of insurance coverage must be submitted during the application process and updated prior to any policy expiration. There is no grace period for lapses in coverage. If insurance expires or is cancelled, the contractor\'s referral eligibility is automatically suspended until current documentation is received and verified. Contractor is responsible for proactively submitting updated certificates — ListWorx does not send reminders as a condition of compliance.',
  },
  {
    num: '4',
    title: 'Communication Standards',
    body: 'Contractor shall respond to every referral inquiry received through ListWorx within 24 hours of receipt, without exception. A response constitutes direct contact — a voicemail or text message qualifies; delayed callbacks or missed calls do not. All written estimates shall be provided within a reasonable period not to exceed 48 hours following an initial site visit or client meeting, unless otherwise agreed in writing by both parties. Phone calls, text messages, and emails from clients or realtors connected through ListWorx shall be returned within one business day. Scheduling changes, delays, or inability to complete a scheduled appointment must be communicated to the client in advance — not after the scheduled time has passed.',
  },
  {
    num: '5',
    title: 'Pricing and Transparency',
    body: 'Contractor shall provide a written, itemized estimate to the client prior to the commencement of any work. Verbal-only pricing is not permitted on any engagement connected through ListWorx. For projects in which the original scope of work expands after the estimate is issued, a written change order must be prepared and approved by the client before any additional costs are incurred. Hidden fees, undisclosed markups on materials, and retroactive charges not reflected in a signed estimate or change order are strictly prohibited. A detailed invoice must be delivered to the client upon project completion, itemizing labor, materials, and any applicable fees.',
  },
  {
    num: '6',
    title: 'Worksite Conduct and Site Standards',
    body: 'Contractor shall maintain punctuality and professionalism on every job site. If a delay is unavoidable, the client must be notified in advance with a revised arrival estimate. Contractor is responsible for protecting the client\'s property during all phases of work: drop cloths, floor coverings, and appropriate barriers shall be used wherever the risk of damage exists. At the close of each work day, the job site shall be left in a reasonably clean and safe condition. Upon project completion, all contractor-generated debris, packaging, and waste materials shall be removed from the property. Professional conduct shall be maintained at all times with clients, property occupants, other contractors on site, and any agent or representative of ListWorx.',
  },
  {
    num: '7',
    title: 'Workmanship Expectations',
    body: 'All work performed under referrals received through ListWorx shall be executed in compliance with applicable building codes, trade standards, and local regulations. Contractor shall use materials of appropriate grade and quality for the scope of work, as represented in the estimate. Material substitutions not previously disclosed to and approved by the client are prohibited. Where deficiencies in the completed work are identified — whether by the client, the client\'s agent, or a third-party inspection — the contractor is required to address those deficiencies promptly and without dispute, subject to reasonable professional judgment. Warranties on labor and materials shall be provided to the client in writing where such warranties are standard for the relevant trade.',
  },
  {
    num: '8',
    title: 'Dispute Resolution',
    body: 'In the event of a dispute arising from a referral, Contractor must respond to any notice of complaint forwarded by ListWorx within 48 hours. A good-faith effort to resolve the dispute directly with the client is required. ListWorx may participate as a neutral facilitator in unresolved disputes but does not act as an arbitrator and does not assume legal liability for outcomes. Contractor may not engage in retaliatory conduct, threats, harassment, or disparagement against a client who has filed a complaint through ListWorx. Repeated unresolved complaints, irrespective of individual merit, will trigger a formal performance review. ListWorx reserves the right to determine, in its sole discretion, whether a pattern of complaints warrants corrective action.',
  },
  {
    num: '9',
    title: 'Performance Monitoring and Enforcement',
    body: 'ListWorx collects structured feedback from clients and realtors following each referral. This feedback contributes to an ongoing performance record maintained for each contractor in the network. Referral response rates, job completion outcomes, client ratings, and documented complaint history are all factors in the performance record. ListWorx tracks license and insurance expiration dates. Contractors are solely responsible for maintaining current documentation — an expired credential results in an automatic hold on new referrals until updated documentation is received. Contractors whose performance records indicate persistent non-response, incomplete work, unresolved complaints, or documentation lapses are subject to progressive enforcement action including written notice, referral priority reduction, suspension, or permanent removal, at ListWorx\'s discretion.',
  },
  {
    num: '10',
    title: 'Termination Conditions',
    body: 'Either party may terminate this agreement with 30 days written notice. ListWorx reserves the right to immediately suspend or permanently remove a contractor — without prior notice and without refund of any subscription fees — for any of the following: material breach of these Standards; misrepresentation of licensing, insurance, or credentials; fraud or deceptive practices directed at a client; actions causing physical or financial harm to a client or their property; criminal conduct related to contracting activities; failure to disclose known material defects; or any conduct that, in the sole judgment of ListWorx, poses a risk to the integrity of the network or the safety of clients. Upon termination, all active referrals associated with the contractor are subject to reassignment at ListWorx\'s discretion.',
  },
];

export default function IronCladStandardsPage() {
  return (
    <div className="min-h-screen bg-mailer-black text-white mkt-scope">
      <Navigation variant="light" />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-mailer-black">
        <div className="absolute left-0 top-0 h-1 w-full bg-lw-rust" />
        <TristarMark className="pointer-events-none absolute -right-8 -top-6 h-48 w-48 text-white/[0.04] md:h-64 md:w-64" />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <RevealBadge className="mb-8 flex justify-center">
              <Image
                src="/Ironclad_Standards_Logo.png"
                alt="IronClad Standards"
                width={280}
                height={280}
                className="h-auto w-44 md:w-60"
              />
            </RevealBadge>
            <Reveal immediate delay={100} className="mb-7 inline-flex items-center gap-2 rounded-full border border-lw-rust/40 bg-lw-rust/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-lw-rust">
              <Shield className="h-3 w-3" />
              The ListWorx Vetting &amp; Accountability Framework
            </Reveal>
            <Reveal immediate delay={170} as="h1" className="mb-5 font-display text-6xl font-bold uppercase leading-none tracking-wide text-white md:text-8xl">
              IronClad<br />
              <span className="text-lw-rust">Standards<TM /></span>
            </Reveal>
            <Reveal immediate delay={240}>
              <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/75">
                The enforced compliance framework governing every contractor in the ListWorx network.
                Not a badge. A binding agreement.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={APPLY_HREF}>
                  <Button size="lg" className="rounded-lg bg-lw-rust px-8 py-5 text-base font-semibold text-white hover:bg-lw-rust-hover">
                    Apply to Become a Partner
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/request">
                  <Button size="lg" variant="outline" className="rounded-lg border-white/40 bg-transparent px-8 py-5 text-base text-white hover:bg-white/10 hover:text-white">
                    Request a Contractor
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= WHAT IT IS ================= */}
      <section className="bg-mailer-black py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid items-start gap-10 md:grid-cols-5">
              <div className="md:col-span-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">What It Is</p>
                <h2 className="mb-5 font-display text-3xl font-semibold uppercase leading-snug tracking-wide text-white md:text-4xl">
                  A binding framework — not a badge
                </h2>
                <p className="mb-4 text-base leading-[1.75] text-white/65">
                  Every contractor in the ListWorx network must formally accept IronClad Standards
                  before receiving a single referral. Acceptance is not a checkbox — it is a
                  documented commitment covering licensing, insurance, communication, pricing,
                  worksite conduct, and response to complaints.
                </p>
                <p className="text-base leading-[1.75] text-white/65">
                  Approval is earned through manual review. It is not automatic, and it is not
                  permanent. Contractors who fail to maintain these standards are removed from the
                  network.
                </p>
              </div>
              <div className="space-y-2.5 md:col-span-2">
                {[
                  { label: 'Not a self-certification', sub: 'Every application is manually reviewed by ListWorx' },
                  { label: 'Not a one-time check', sub: 'Credentials and performance are monitored continuously' },
                  { label: 'Not optional', sub: 'All requirements are binding conditions of participation' },
                  { label: 'Not without consequence', sub: 'Violations are tracked and enforced progressively' },
                ].map((item, index) => (
                  <Reveal key={item.label} delay={index * 70} className="rounded-2xl border border-mailer-border bg-mailer-card px-4 py-3">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-0.5 text-xs text-white/50">{item.sub}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHAT IRONCLAD VERIFIED MEANS ================= */}
      <section className="bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">Plain Language</p>
              <h2 className="mb-5 font-display text-3xl font-semibold leading-snug text-white md:text-4xl">
                What IronClad Verified Means
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-[1.75] text-white/65">
                IronClad Verified means ListWorx has confirmed:
              </p>
            </div>

            <div className="mb-10 grid gap-6 sm:grid-cols-3">
              {[
                { icon: Building2, text: 'The business entity is legitimate and registered' },
                { icon: FileCheck, text: 'The contractor holds the required licenses for their primary trade' },
                { icon: ShieldCheck, text: 'The contractor carries required insurance' },
              ].map((item, index) => (
                <Reveal key={item.text} delay={index * 70}>
                  <div className="h-full rounded-2xl border border-mailer-border bg-mailer-card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lw-rust/15">
                      <item.icon className="h-6 w-6 text-lw-rust" />
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-white/85">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mb-8 rounded-2xl border border-white/15 bg-mailer-surface p-6 md:p-8">
              <p className="mb-4 text-base font-bold text-white">IronClad Verified does NOT mean:</p>
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {[
                  'Every technician or employee is individually certified',
                  "ListWorx has verified the contractor's work quality",
                  'Individual jobs or trades beyond the primary are verified',
                  'The contractor has passed a background check at the employee level',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                    <p className="text-sm leading-relaxed text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-base leading-[1.75] text-white/65">
                This is business-level verification only. The badge tells homeowners the business is
                real, licensed, and insured — not that the work is guaranteed.
              </p>
            </Reveal>

            <Reveal className="mx-auto max-w-2xl border-t border-mailer-border pt-10 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">Why It Matters For Contractors</p>
              <p className="text-base leading-[1.75] text-white/65">
                The IronClad Verified badge sets ListWorx contractors apart from unlicensed or
                uninsured competitors showing up on generic platforms. Homeowners on ListWorx know
                they&apos;re being matched with verified professionals — which means the referrals you
                receive come from homeowners who are specifically seeking that.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= VETTING PROCESS ================= */}
      <section className="bg-mailer-black py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">Admission Process</p>
              <h2 className="mb-4 font-display text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">How We Vet Contractors</h2>
              <p className="max-w-2xl text-base leading-[1.75] text-white/65">
                Approval is a multi-step process. No contractor enters the network without completing
                each stage in sequence.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-mailer-border">
              {[
                { num: '01', title: 'Application Review', body: 'Every applicant completes a detailed business profile including trade specialties, service area, years in operation, and references. Incomplete or inconsistent applications are not advanced to the next stage.' },
                { num: '02', title: 'License Verification', body: 'State licensing records are verified directly against government databases. Licenses must be active, in the correct trade category, and held by the business entity submitting the application — not a subcontractor or third party.' },
                { num: '03', title: 'Insurance Documentation', body: 'Current certificates of insurance are collected and reviewed for coverage type, coverage amounts, and policy dates. The policy must be active at the time of review — expired or lapsed policies are not accepted.' },
                { num: '04', title: 'Standards Agreement', body: 'Every applicant reads and formally accepts the IronClad Standards Partner Agreement in full. This constitutes a documented, binding commitment — not a summary acknowledgment.' },
                { num: '05', title: 'Manual Approval', body: 'A ListWorx team member reviews each application individually before any approval decision is made. No application is automatically approved. Approval may be declined for inconsistent, incomplete, or otherwise insufficient information.' },
                { num: '06', title: 'Ongoing Monitoring', body: 'Approval is not permanent. License and insurance expiration dates are tracked in the system. Client and realtor feedback is collected after each referral. Performance data is reviewed on a continuous basis.' },
              ].map((step, i, arr) => (
                <Reveal key={step.num} delay={i * 80} className={`flex gap-5 bg-mailer-card px-6 py-5 ${i < arr.length - 1 ? 'border-b border-mailer-border' : ''}`}>
                  <div className="min-w-[2.5rem] pt-0.5 font-display text-3xl font-bold leading-none text-lw-rust/30">{step.num}</div>
                  <div>
                    <h3 className="mb-1.5 font-display text-base font-semibold uppercase tracking-wide text-white">{step.title}</h3>
                    <p className="text-sm leading-[1.7] text-white/65">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-lw-rust/30 bg-lw-rust/10 px-5 py-4">
              <p className="text-sm leading-relaxed text-white/75">
                <strong className="text-white">No automatic approvals.</strong> Every application is
                reviewed by a ListWorx team member before any decision is made. This review may
                include direct outreach to verify submitted information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA — mid page ================= */}
      <section className="bg-mailer-ink">
        <div className="container mx-auto px-4">
          <Reveal className="flex flex-col items-start gap-3 border-y border-mailer-border py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-semibold text-white">
              Credentials in order? Applications are reviewed in 24&ndash;48 hours.
            </p>
            <Link
              href={APPLY_HREF}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-widest text-lw-rust transition-colors hover:text-white"
            >
              Create your account
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= PARTNER AGREEMENT ================= */}
      <section className="bg-mailer-black py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">The Agreement</p>
              <h2 className="mb-3 font-display text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">
                IronClad Standards<TM /> Partner Agreement
              </h2>
              <p className="text-sm text-white/50">Version 1.0 &mdash; Effective February 2026</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-mailer-border">
              <div className="border-b border-mailer-border bg-lw-rust/10 px-7 py-6 md:px-10">
                <p className="text-[0.95rem] leading-[1.8] text-white/75">
                  The IronClad Standards ("the Standards") establish the minimum performance,
                  compliance, and accountability requirements for all ListWorx Partner Contractors. By
                  formally accepting these Standards, Contractor commits to operating at a level of
                  professionalism that protects Realtors, Homeowners, and the integrity of the
                  ListWorx referral network. These Standards are a binding legal agreement — not a
                  summary of preferences.
                </p>
              </div>

              <div className="space-y-9 bg-mailer-card px-7 py-8 md:px-10">
                {AGREEMENT_SECTIONS.map((section, i) => (
                  <div key={section.num}>
                    <div className="mb-3 flex items-baseline gap-3">
                      <span className="min-w-[1.5rem] font-display text-xs font-bold uppercase tracking-widest text-lw-rust">{section.num}.</span>
                      <h4 className="font-display text-base font-bold uppercase tracking-wide text-white">{section.title}</h4>
                    </div>
                    <p className="pl-7 text-[0.9rem] leading-[1.85] text-white/65">{section.body}</p>
                    {i < AGREEMENT_SECTIONS.length - 1 && <div className="mt-9 border-b border-mailer-border/60" />}
                  </div>
                ))}

                <div className="mt-4 border-t border-mailer-border pt-2">
                  <p className="text-center text-xs leading-relaxed text-white/45">
                    IronClad Standards<TM /> is a trademark of ListWorx, LLC. All Partner Contractors
                    must maintain continuous compliance as a condition of network participation.
                    ListWorx reserves the right to amend these Standards with notice to active
                    contractors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ONGOING PERFORMANCE ================= */}
      <section className="bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">Section 3</p>
              <h2 className="mb-4 font-display text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">Ongoing Expectations</h2>
              <p className="max-w-2xl text-base leading-[1.75] text-white/65">
                Approval is the beginning — not the end. Active contractors are held to these
                standards continuously, and performance data is reviewed on an ongoing basis.
              </p>
            </div>

            <div className="space-y-5">
              {[
                { label: '24-Hour Response', body: 'Every referral received through ListWorx requires an initial direct response within 24 hours. This is not a guideline — it is a condition of continued participation in the network. Patterns of delayed or absent responses are flagged for review.' },
                { label: 'Post-Referral Feedback', body: 'After each referral, ListWorx requests structured feedback from the client or referring realtor. This feedback is logged to the contractor\'s performance record. Both positive and negative responses are recorded and contribute to the contractor\'s standing.' },
                { label: 'Credential Maintenance', body: 'License and insurance expiration dates are tracked in the ListWorx system. Contractors are solely responsible for submitting updated documentation prior to expiration. An expired credential results in an automatic hold on new referrals until current documentation is received.' },
                { label: 'Referral Outcome Tracking', body: 'ListWorx tracks referral outcomes — including whether the client was contacted, whether an estimate was provided, and whether the job was completed. Persistent non-conversion without documented explanation is subject to formal performance review.' },
              ].map((item) => (
                <div key={item.label} className="flex gap-5 rounded-2xl border border-mailer-border bg-mailer-card p-5">
                  <div className="w-1 flex-shrink-0 rounded-full bg-lw-rust" />
                  <div>
                    <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white">{item.label}</h3>
                    <p className="text-sm leading-[1.75] text-white/65">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { label: '24 Hours', sub: 'Maximum response time to any referral' },
                { label: '100%', sub: 'Of contractors carry verified insurance on file' },
                { label: 'Every Referral', sub: 'Generates a structured feedback request to the client' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-mailer-border bg-mailer-card px-5 py-6 text-center">
                  <div className="mb-1.5 font-display text-3xl font-bold text-lw-rust">{stat.label}</div>
                  <div className="text-xs leading-snug text-white/55">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= ACCOUNTABILITY ================= */}
      <section className="bg-mailer-black py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">Section 4</p>
              <h2 className="mb-4 font-display text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">Accountability &amp; Review</h2>
              <p className="max-w-2xl text-base leading-[1.75] text-white/65">
                Feedback, complaints, and performance data are reviewed against each contractor&apos;s
                standing. The review process is documented, structured, and firm.
              </p>
            </div>

            <div className="mb-6 overflow-hidden rounded-xl border border-mailer-border">
              {[
                { title: 'Structured Feedback', body: 'After every referral, a feedback request is sent to the client. Responses — both positive and negative — are logged directly to the contractor\'s record and contribute to their ongoing standing in the network.' },
                { title: 'Formal Complaint Review', body: 'Complaints forwarded by clients or realtors are documented. The contractor is notified and given a defined window to respond. ListWorx does not arbitrate disputes unilaterally but tracks resolution behavior as part of the performance record.' },
                { title: 'Realtor Reporting', body: 'Realtors in the ListWorx network may report conduct, missed responses, or performance issues directly. These reports are documented and contribute to the contractor\'s ongoing compliance record.' },
              ].map((item, i, arr) => (
                <div key={item.title} className={`bg-mailer-card px-6 py-5 ${i < arr.length - 1 ? 'border-b border-mailer-border' : ''}`}>
                  <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white">{item.title}</h3>
                  <p className="text-sm leading-[1.75] text-white/65">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-mailer-border bg-mailer-card px-6 py-5">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white">Factors Reviewed in Performance Evaluations</h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  'Referral response rate and response timing',
                  'Client feedback scores and written comments',
                  'License and insurance expiration status',
                  'Realtor-reported conduct or performance issues',
                  'Dispute resolution behavior and outcomes',
                  'Pattern of non-completion, ghosting, or abandonment',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lw-rust" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ENFORCEMENT ================= */}
      <section className="bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lw-rust">Section 5</p>
              <h2 className="mb-4 font-display text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">Enforcement &amp; Penalties</h2>
              <p className="max-w-2xl text-base leading-[1.75] text-white/65">
                Standards without enforcement are not standards. The following actions apply
                progressively at ListWorx&apos;s discretion, based on the nature, frequency, and
                severity of documented violations.
              </p>
            </div>

            <div className="mb-8 space-y-3">
              {[
                { level: 'Level 1', trigger: 'First documented issue', action: 'Written notice from ListWorx. Contractor is given the opportunity to respond and resolve the issue within a defined window.', ring: 'border-amber-400/30 bg-amber-400/[0.08]', badge: 'border-amber-400/40 text-amber-300' },
                { level: 'Level 2', trigger: 'Repeated or unresolved issues', action: 'Referral priority reduced. Contractor placed on formal performance review. Subscription tier may be downgraded pending resolution.', ring: 'border-lw-rust/40 bg-lw-rust/[0.08]', badge: 'border-lw-rust/50 text-lw-rust' },
                { level: 'Level 3', trigger: 'Sustained violations or material breach', action: 'Suspension from receiving new referrals. Access to the ListWorx network is paused pending a formal review and response from the contractor.', ring: 'border-red-500/35 bg-red-500/[0.08]', badge: 'border-red-500/45 text-red-300' },
                { level: 'Level 4', trigger: 'Fraud, misrepresentation, or irreparable breach', action: 'Immediate and permanent removal from the ListWorx network. No refund of subscription fees. The contractor may not reapply.', ring: 'border-red-500/55 bg-red-500/[0.14]', badge: 'border-red-400/60 text-red-200' },
              ].map((item) => (
                <div key={item.level} className={`rounded-xl border p-5 ${item.ring}`}>
                  <div className="flex flex-wrap items-start gap-4">
                    <span className={`rounded border px-2 py-0.5 font-display text-xs font-bold uppercase tracking-widest ${item.badge}`}>
                      {item.level}
                    </span>
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Trigger</p>
                        <p className="text-sm leading-snug text-white">{item.trigger}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Action Taken</p>
                        <p className="text-sm leading-snug text-white">{item.action}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border-2 border-red-500/40 bg-red-500/[0.08] p-6 md:p-7">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-white">Grounds for Immediate Removal</h3>
              <p className="mb-4 text-sm leading-relaxed text-white/65">
                The following are grounds for immediate and permanent removal from the network,
                without prior notice, without warning period, and without refund of any fees:
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  'Misrepresentation of licensing or credentials',
                  'Operating without valid insurance after a known lapse',
                  'Fraud or deceptive practices directed at a client',
                  'Actions causing direct harm to a client or their property',
                  'Criminal conduct related to contracting activities',
                  'Failure to disclose known material defects',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY IT MATTERS ================= */}
      <section className="bg-mailer-black py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10">
              <h2 className="mb-3 font-display text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">Why It Matters</h2>
              <p className="max-w-2xl text-base leading-[1.75] text-white/65">
                For realtors and homeowners, these standards translate directly into reduced risk,
                fewer surprises, and more predictable outcomes.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Verified Before You Meet Them', body: 'By the time you receive a contractor match, licensing and insurance have already been checked. You are not doing the vetting — we are.' },
                { title: 'Accountability You Can Point To', body: 'If something goes wrong, there is a documented standard, a defined response process, and a review mechanism. You are not alone in managing the relationship.' },
                { title: 'Predictable Professional Conduct', body: 'Contractors have agreed in writing to communication timelines, pricing transparency, and site conduct standards. These are documented obligations — not verbal assurances.' },
                { title: 'Designed for Real Estate Timelines', body: 'Listing preparation, inspection response, and closing timelines are unforgiving. IronClad Standards are built with that operational reality in mind.' },
                { title: 'Performance Consequences Are Real', body: 'Contractors who fail to perform are not quietly deprioritized. They are reviewed and removed if they do not correct course — and the record is maintained.' },
                { title: 'Your Reputation Is Protected', body: 'When you refer a contractor through ListWorx, you are referring someone who has passed a formal vetting process and is held to documented, enforceable standards.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-mailer-border bg-mailer-card p-5 transition-colors hover:border-lw-rust/40">
                  <div className="mb-3 h-4 w-1 rounded-full bg-lw-rust" />
                  <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white">{item.title}</h3>
                  <p className="text-sm leading-[1.75] text-white/65">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOUNDING PARTNER CREDIBILITY ================= */}
      <section className="border-t border-amber-400/20 bg-mailer-ink py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
              <div className="flex-shrink-0">
                <Image
                  src="/ironclad_founder_shield_logo.png"
                  alt="IronClad Founding Partner"
                  width={160}
                  height={160}
                  className="h-auto w-32 md:w-40"
                />
              </div>
              <div className="text-center md:text-left">
                <Badge className="mb-3 border-amber-400/30 bg-amber-400/15 text-amber-300">
                  <Crown className="mr-1 h-3 w-3" />
                  Network Launch — Limited Spots
                </Badge>
                <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
                  Founding Partners Set the Standard
                </h2>
                <p className="mb-5 text-base leading-relaxed text-white/65">
                  The contractors who join the ListWorx network during the founding period earn
                  permanent Founding Partner recognition. These are the professionals who believe in
                  accountability-first contracting — and back it up by committing early. Founding
                  Partner status is a permanent mark of credibility that cannot be earned after the
                  launch window closes.
                </p>
                <div className="mb-6 flex flex-wrap justify-center gap-4 md:justify-start">
                  <div className="flex items-center gap-2 text-sm text-amber-300">
                    <Star className="h-4 w-4" />
                    <span>Permanent badge</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-300">
                    <Shield className="h-4 w-4" />
                    <span>Priority positioning</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-300">
                    <Award className="h-4 w-4" />
                    <span>Launch-period exclusive</span>
                  </div>
                </div>
                <Link href={APPLY_HREF}>
                  <Button className="bg-amber-500 px-6 py-5 text-base text-white hover:bg-amber-600">
                    <Award className="mr-2 h-4 w-4" />
                    Apply for Founding Partner Status
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA ================= */}
      <section className="relative overflow-hidden bg-mailer-black py-20 md:py-28">
        <div className="absolute left-0 top-0 h-1 w-full bg-lw-rust" />
        <TristarMark className="pointer-events-none absolute -bottom-10 left-1/2 h-56 w-56 -translate-x-1/2 text-white/[0.04]" />
        <div className="relative container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Image
              src="/Ironclad_Cert_Partner_Final_Logo.png"
              alt="IronClad Certified Partner"
              width={100}
              height={100}
              className="mx-auto mb-8 h-16 w-auto md:h-20"
            />
            <h2 className="mb-4 font-display text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">
              Ready to Join the Network?
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-base leading-[1.75] text-white/65">
              Applications are reviewed manually. If your credentials are in order and your business
              meets the standards above, approval typically takes 24&ndash;48 hours.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href={APPLY_HREF}>
                <Button size="lg" className="rounded-lg bg-lw-rust px-10 py-5 text-base font-semibold text-white hover:bg-lw-rust-hover">
                  Apply as a Contractor
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outline" className="rounded-lg border-white/40 bg-transparent px-10 py-5 text-base text-white hover:bg-white/10 hover:text-white">
                  Request a Contractor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
