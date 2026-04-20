'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ChevronRight, Crown, Star, Award } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';

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
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* HERO */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.06)_0%,_transparent_65%)] pointer-events-none" />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/Ironclad_Standards_Logo.png"
                alt="IronClad Standards"
                width={280}
                height={280}
                className="w-44 md:w-60 h-auto"
              />
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500/60 border border-red-900/30 rounded-full px-4 py-1.5 mb-7">
              <Shield className="h-3 w-3" />
              The ListWorx Vetting &amp; Accountability Framework
            </div>
            <h1 className="font-display text-6xl md:text-8xl font-bold text-white mb-5 leading-none tracking-wide uppercase">
              IronClad<br />
              <span className="text-red-500">Standards<TM /></span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed mb-10">
              The enforced compliance framework governing every contractor in the ListWorx network. Not a badge. A binding agreement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/apply">
                <Button size="lg" className="px-8 py-5 text-base rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                  Apply to Become a Partner
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outline" className="px-8 py-5 text-base rounded-lg border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-500">
                  Request a Contractor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="py-14 md:py-18 bg-zinc-950 border-y border-zinc-800/60">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-5 gap-10 items-start">
              <div className="md:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-500/60 mb-3">What It Is</p>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-5 leading-snug uppercase tracking-wide">
                  A binding framework — not a badge
                </h2>
                <p className="text-zinc-400 text-base leading-[1.75] mb-4">
                  Every contractor in the ListWorx network must formally accept IronClad Standards before receiving a single referral. Acceptance is not a checkbox — it is a documented commitment covering licensing, insurance, communication, pricing, worksite conduct, and response to complaints.
                </p>
                <p className="text-zinc-400 text-base leading-[1.75]">
                  Approval is earned through manual review. It is not automatic, and it is not permanent. Contractors who fail to maintain these standards are removed from the network.
                </p>
              </div>
              <div className="md:col-span-2 space-y-2.5">
                {[
                  { label: 'Not a self-certification', sub: 'Every application is manually reviewed by ListWorx' },
                  { label: 'Not a one-time check', sub: 'Credentials and performance are monitored continuously' },
                  { label: 'Not optional', sub: 'All requirements are binding conditions of participation' },
                  { label: 'Not without consequence', sub: 'Violations are tracked and enforced progressively' },
                ].map(item => (
                  <div key={item.label} className="px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VETTING PROCESS */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-500/60 mb-3">Admission Process</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wide">How We Vet Contractors</h2>
              <p className="text-zinc-400 text-base max-w-2xl leading-[1.75]">
                Approval is a multi-step process. No contractor enters the network without completing each stage in sequence.
              </p>
            </div>

            <div className="space-y-0 border border-zinc-800 rounded-xl overflow-hidden">
              {[
                {
                  num: '01',
                  title: 'Application Review',
                  body: 'Every applicant completes a detailed business profile including trade specialties, service area, years in operation, and references. Incomplete or inconsistent applications are not advanced to the next stage.',
                },
                {
                  num: '02',
                  title: 'License Verification',
                  body: 'State licensing records are verified directly against government databases. Licenses must be active, in the correct trade category, and held by the business entity submitting the application — not a subcontractor or third party.',
                },
                {
                  num: '03',
                  title: 'Insurance Documentation',
                  body: 'Current certificates of insurance are collected and reviewed for coverage type, coverage amounts, and policy dates. The policy must be active at the time of review — expired or lapsed policies are not accepted.',
                },
                {
                  num: '04',
                  title: 'Standards Agreement',
                  body: 'Every applicant reads and formally accepts the IronClad Standards Partner Agreement in full. This constitutes a documented, binding commitment — not a summary acknowledgment.',
                },
                {
                  num: '05',
                  title: 'Manual Approval',
                  body: 'A ListWorx team member reviews each application individually before any approval decision is made. No application is automatically approved. Approval may be declined for inconsistent, incomplete, or otherwise insufficient information.',
                },
                {
                  num: '06',
                  title: 'Ongoing Monitoring',
                  body: 'Approval is not permanent. License and insurance expiration dates are tracked in the system. Client and realtor feedback is collected after each referral. Performance data is reviewed on a continuous basis.',
                },
              ].map((step, i, arr) => (
                <div key={step.num} className={`flex gap-5 px-6 py-5 ${i < arr.length - 1 ? 'border-b border-zinc-800' : ''} bg-zinc-900/40`}>
                  <div className="font-display text-3xl font-bold text-red-600/20 leading-none pt-0.5 min-w-[2.5rem]">{step.num}</div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-white uppercase tracking-wide mb-1.5">{step.title}</h3>
                    <p className="text-zinc-400 text-sm leading-[1.7]">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 px-5 py-4 rounded-lg border border-red-900/30 bg-red-950/10">
              <p className="text-zinc-300 text-sm leading-relaxed">
                <strong className="text-white">No automatic approvals.</strong> Every application is reviewed by a ListWorx team member before any decision is made. This review may include direct outreach to verify submitted information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNER AGREEMENT — WHITE CARD */}
      <section className="py-16 md:py-24 bg-zinc-950 border-y border-zinc-800/60">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-500/60 mb-3">The Agreement</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 uppercase tracking-wide">
                IronClad Standards<TM /> Partner Agreement
              </h2>
              <p className="text-sm text-zinc-500">Version 1.0 &mdash; Effective February 2026</p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-zinc-300/20">
              {/* Agreement header — dark branded bar */}
              <div className="bg-zinc-900 border-b border-zinc-700/60 px-7 md:px-10 py-6">
                <p className="text-zinc-300 text-[0.95rem] leading-[1.8]">
                  The IronClad Standards ("the Standards") establish the minimum performance, compliance, and accountability requirements for all ListWorx Partner Contractors. By formally accepting these Standards, Contractor commits to operating at a level of professionalism that protects Realtors, Homeowners, and the integrity of the ListWorx referral network. These Standards are a binding legal agreement — not a summary of preferences.
                </p>
              </div>

              {/* Agreement body — white */}
              <div className="bg-white px-7 md:px-10 py-8 space-y-9">
                {AGREEMENT_SECTIONS.map((section, i) => (
                  <div key={section.num}>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="font-display text-xs font-bold text-red-600 uppercase tracking-widest min-w-[1.5rem]">{section.num}.</span>
                      <h4 className="font-display text-base font-bold text-zinc-900 uppercase tracking-wide">{section.title}</h4>
                    </div>
                    <p className="text-zinc-600 text-[0.9rem] leading-[1.85] pl-7">
                      {section.body}
                    </p>
                    {i < AGREEMENT_SECTIONS.length - 1 && (
                      <div className="mt-9 border-b border-zinc-100" />
                    )}
                  </div>
                ))}

                <div className="pt-2 border-t border-zinc-200 mt-4">
                  <p className="text-zinc-400 text-xs text-center leading-relaxed">
                    IronClad Standards<TM /> is a trademark of ListWorx, LLC. All Partner Contractors must maintain continuous compliance as a condition of network participation. ListWorx reserves the right to amend these Standards with notice to active contractors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ONGOING PERFORMANCE */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-500/60 mb-3">Section 3</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wide">Ongoing Expectations</h2>
              <p className="text-zinc-400 text-base leading-[1.75] max-w-2xl">
                Approval is the beginning — not the end. Active contractors are held to these standards continuously, and performance data is reviewed on an ongoing basis.
              </p>
            </div>

            <div className="space-y-5">
              {[
                {
                  label: '24-Hour Response',
                  body: 'Every referral received through ListWorx requires an initial direct response within 24 hours. This is not a guideline — it is a condition of continued participation in the network. Patterns of delayed or absent responses are flagged for review.',
                },
                {
                  label: 'Post-Referral Feedback',
                  body: 'After each referral, ListWorx requests structured feedback from the client or referring realtor. This feedback is logged to the contractor\'s performance record. Both positive and negative responses are recorded and contribute to the contractor\'s standing.',
                },
                {
                  label: 'Credential Maintenance',
                  body: 'License and insurance expiration dates are tracked in the ListWorx system. Contractors are solely responsible for submitting updated documentation prior to expiration. An expired credential results in an automatic hold on new referrals until current documentation is received.',
                },
                {
                  label: 'Referral Outcome Tracking',
                  body: 'ListWorx tracks referral outcomes — including whether the client was contacted, whether an estimate was provided, and whether the job was completed. Persistent non-conversion without documented explanation is subject to formal performance review.',
                },
              ].map(item => (
                <div key={item.label} className="flex gap-5 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <div className="w-1 bg-red-600 rounded-full flex-shrink-0" />
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wide mb-2">{item.label}</h3>
                    <p className="text-zinc-400 text-sm leading-[1.75]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                { label: '24 Hours', sub: 'Maximum response time to any referral' },
                { label: '100%', sub: 'Of contractors carry verified insurance on file' },
                { label: 'Every Referral', sub: 'Generates a structured feedback request to the client' },
              ].map(stat => (
                <div key={stat.label} className="text-center px-5 py-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
                  <div className="font-display text-3xl font-bold text-red-500 mb-1.5">{stat.label}</div>
                  <div className="text-xs text-zinc-500 leading-snug">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ACCOUNTABILITY */}
      <section className="py-16 md:py-24 bg-zinc-950 border-y border-zinc-800/60">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-500/60 mb-3">Section 4</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wide">Accountability &amp; Review</h2>
              <p className="text-zinc-400 text-base leading-[1.75] max-w-2xl">
                Feedback, complaints, and performance data are reviewed against each contractor's standing. The review process is documented, structured, and firm.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden mb-6">
              {[
                {
                  title: 'Structured Feedback',
                  body: 'After every referral, a feedback request is sent to the client. Responses — both positive and negative — are logged directly to the contractor\'s record and contribute to their ongoing standing in the network.',
                },
                {
                  title: 'Formal Complaint Review',
                  body: 'Complaints forwarded by clients or realtors are documented. The contractor is notified and given a defined window to respond. ListWorx does not arbitrate disputes unilaterally but tracks resolution behavior as part of the performance record.',
                },
                {
                  title: 'Realtor Reporting',
                  body: 'Realtors in the ListWorx network may report conduct, missed responses, or performance issues directly. These reports are documented and contribute to the contractor\'s ongoing compliance record.',
                },
              ].map((item, i, arr) => (
                <div key={item.title} className={`px-6 py-5 ${i < arr.length - 1 ? 'border-b border-zinc-800' : ''} bg-zinc-900/40`}>
                  <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wide mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-[1.75]">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 rounded-xl border border-zinc-700 bg-zinc-900/60">
              <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wide mb-3">Factors Reviewed in Performance Evaluations</h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  'Referral response rate and response timing',
                  'Client feedback scores and written comments',
                  'License and insurance expiration status',
                  'Realtor-reported conduct or performance issues',
                  'Dispute resolution behavior and outcomes',
                  'Pattern of non-completion, ghosting, or abandonment',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENFORCEMENT */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-500/60 mb-3">Section 5</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wide">Enforcement &amp; Penalties</h2>
              <p className="text-zinc-400 text-base leading-[1.75] max-w-2xl">
                Standards without enforcement are not standards. The following actions apply progressively at ListWorx's discretion, based on the nature, frequency, and severity of documented violations.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                {
                  level: 'Level 1',
                  trigger: 'First documented issue',
                  action: 'Written notice from ListWorx. Contractor is given the opportunity to respond and resolve the issue within a defined window.',
                  border: 'border-amber-700/30',
                  bg: 'bg-amber-950/15',
                  badge: 'text-amber-400 border-amber-700/40',
                },
                {
                  level: 'Level 2',
                  trigger: 'Repeated or unresolved issues',
                  action: 'Referral priority reduced. Contractor placed on formal performance review. Subscription tier may be downgraded pending resolution.',
                  border: 'border-orange-700/30',
                  bg: 'bg-orange-950/15',
                  badge: 'text-orange-400 border-orange-700/40',
                },
                {
                  level: 'Level 3',
                  trigger: 'Sustained violations or material breach',
                  action: 'Suspension from receiving new referrals. Access to the ListWorx network is paused pending a formal review and response from the contractor.',
                  border: 'border-red-700/30',
                  bg: 'bg-red-950/15',
                  badge: 'text-red-400 border-red-700/40',
                },
                {
                  level: 'Level 4',
                  trigger: 'Fraud, misrepresentation, or irreparable breach',
                  action: 'Immediate and permanent removal from the ListWorx network. No refund of subscription fees. The contractor may not reapply.',
                  border: 'border-red-900/50',
                  bg: 'bg-red-950/30',
                  badge: 'text-red-300 border-red-800/50',
                },
              ].map(item => (
                <div key={item.level} className={`p-5 rounded-xl border ${item.border} ${item.bg}`}>
                  <div className="flex flex-wrap items-start gap-4">
                    <span className={`text-xs font-display font-bold uppercase tracking-widest border rounded px-2 py-0.5 ${item.badge}`}>
                      {item.level}
                    </span>
                    <div className="flex-1 grid sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">Trigger</p>
                        <p className="text-zinc-200 text-sm leading-snug">{item.trigger}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">Action Taken</p>
                        <p className="text-zinc-200 text-sm leading-snug">{item.action}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 md:p-7 rounded-xl border-2 border-red-900/40 bg-red-950/15">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wide mb-3">Grounds for Immediate Removal</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                The following are grounds for immediate and permanent removal from the network, without prior notice, without warning period, and without refund of any fees:
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  'Misrepresentation of licensing or credentials',
                  'Operating without valid insurance after a known lapse',
                  'Fraud or deceptive practices directed at a client',
                  'Actions causing direct harm to a client or their property',
                  'Criminal conduct related to contracting activities',
                  'Failure to disclose known material defects',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="py-16 md:py-20 bg-zinc-950 border-y border-zinc-800/60">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3 uppercase tracking-wide">Why It Matters</h2>
              <p className="text-zinc-400 text-base leading-[1.75] max-w-2xl">
                For realtors and homeowners, these standards translate directly into reduced risk, fewer surprises, and more predictable outcomes.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Verified Before You Meet Them',
                  body: 'By the time you receive a contractor match, licensing and insurance have already been checked. You are not doing the vetting — we are.',
                },
                {
                  title: 'Accountability You Can Point To',
                  body: 'If something goes wrong, there is a documented standard, a defined response process, and a review mechanism. You are not alone in managing the relationship.',
                },
                {
                  title: 'Predictable Professional Conduct',
                  body: 'Contractors have agreed in writing to communication timelines, pricing transparency, and site conduct standards. These are documented obligations — not verbal assurances.',
                },
                {
                  title: 'Designed for Real Estate Timelines',
                  body: 'Listing preparation, inspection response, and closing timelines are unforgiving. IronClad Standards are built with that operational reality in mind.',
                },
                {
                  title: 'Performance Consequences Are Real',
                  body: 'Contractors who fail to perform are not quietly deprioritized. They are reviewed and removed if they do not correct course — and the record is maintained.',
                },
                {
                  title: 'Your Reputation Is Protected',
                  body: 'When you refer a contractor through ListWorx, you are referring someone who has passed a formal vetting process and is held to documented, enforceable standards.',
                },
              ].map(item => (
                <div key={item.title} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-red-900/40 transition-colors">
                  <div className="w-1 h-4 bg-red-600 rounded-full mb-3" />
                  <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wide mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-[1.75]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDING PARTNER CREDIBILITY */}
      <section className="py-16 md:py-20 bg-black border-y border-amber-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-shrink-0">
                <Image
                  src="/ironclad_founder_shield_logo.png"
                  alt="IronClad Founding Partner"
                  width={160}
                  height={160}
                  className="w-32 md:w-40 h-auto"
                />
              </div>
              <div className="text-center md:text-left">
                <Badge className="mb-3 bg-amber-600/15 text-amber-500 border-amber-600/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Network Launch — Limited Spots
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Founding Partners Set the Standard
                </h2>
                <p className="text-zinc-400 text-base leading-relaxed mb-5">
                  The contractors who join the ListWorx network during the founding period earn permanent Founding Partner recognition. These are the professionals who believe in accountability-first contracting — and back it up by committing early. Founding Partner status is a permanent mark of credibility that cannot be earned after the launch window closes.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Star className="h-4 w-4" />
                    <span>Permanent badge</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Shield className="h-4 w-4" />
                    <span>Priority positioning</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Award className="h-4 w-4" />
                    <span>Launch-period exclusive</span>
                  </div>
                </div>
                <Link href="/apply">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-5 text-base">
                    <Award className="mr-2 h-4 w-4" />
                    Apply for Founding Partner Status
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Image
              src="/Ironclad_Cert_Partner_Final_Logo.png"
              alt="IronClad Certified Partner"
              width={100}
              height={100}
              className="w-16 md:w-20 h-auto mx-auto mb-8 opacity-90"
            />
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wide">
              Ready to Join the Network?
            </h2>
            <p className="text-zinc-400 text-base mb-10 max-w-lg mx-auto leading-[1.75]">
              Applications are reviewed manually. If your credentials are in order and your business meets the standards above, approval typically takes 24–48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply">
                <Button size="lg" className="px-10 py-5 text-base rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                  Apply as a Contractor
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outline" className="px-10 py-5 text-base rounded-lg border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-500">
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
