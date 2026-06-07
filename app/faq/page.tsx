import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/design-system';

const generalFaqs = [
  ['What is ListWorx?', 'ListWorx is a contractor referral network for realtors and homeowners. We match each request with up to three vetted, IronClad-certified contractors in your area. No referral fees. No bidding wars.'],
  ['How are contractors vetted?', 'Every contractor in the network is reviewed against IronClad Standards before approval: valid licensing and insurance, professional communication, no history of ghosting customers, and a commitment to responding within 24 hours.'],
  ['Does it cost realtors or homeowners anything to use ListWorx?', 'No. ListWorx is free for realtors and homeowners. Contractors pay a flat monthly subscription to participate in the network.'],
  ['How fast will I get matched with a contractor?', 'Most requests are matched within a few hours during business days. You will receive up to three contractor profiles. They will reach out to you directly.'],
  ['What if I have a bad experience with a contractor?', 'Tell us. Every job is followed by a feedback survey covering response time, quality, and professionalism. Contractors who violate IronClad Standards lose their network status.'],
];

const founderFaqs = [
  ['What is a Founding Partner?', 'Simple. Pay the $75 activation fee, pick your tier, and your monthly billing starts right away at your locked founder rate. Basic is $159/month. Preferred is $279. Elite is $479. That rate is yours permanently — no increases, no renegotiating, no surprises. Standard pricing for contractors who join after the founding period is $199, $349, or $599 a month. Founding Partners never pay that.'],
  ['Why should I become a Founding Partner instead of joining standard monthly?', 'Three reasons: locked renewal pricing as low as $159/month forever (versus standard $199-$599/month), Founding Partner badge on every referral we send, and territory reservation for your trade and county.'],
  ['How long does Founding Partner pricing last?', 'For life — as long as you maintain active status and IronClad compliance. If you cancel or get removed for IronClad violations, Founding Partner pricing is forfeited.'],
  ['Are spots really limited?', 'Yes. We are accepting 10 Basic Founder, 5 Preferred Founder, and 2 Elite Founder contractors per trade in each county. Once a trade fills in your county, no other contractor of that trade joins at Founding Partner pricing.'],
  ['What if I apply but you have not approved me yet?', 'You can apply at any time. Founding Partner pricing is only available after admin approval. We review applications within 72 hours.'],
];

const requestorFaqs = [
  ['How do I request a contractor?', 'The moment you submit a request ListWorx gets to work. Within about 30 seconds you will see three contractor cards on your screen — company name, contact info, a link to their full profile, and their IronClad status if they have earned it.\n\nYou will also get an email with those same three cards so you have everything in one place.\n\nFrom there it is completely up to you. Review the contractors, check out their profiles, and reach out to whoever feels like the right fit. Nobody is going to pressure you and no contractor is going to blow up your phone because they do not have your number.\n\nWhen you have made your choice just mark who you picked in your dashboard. We keep track of it so we can follow up after the job and make sure everything went the way it should.'],
  ['Why only three contractors per request?', 'Most lead-generation services dump your contact info to 20+ contractors who all call you within minutes. We do not do that. We send you the best three matches in your area. You decide who to talk to.'],
  ['Do contractors pay to be shown to me?', 'Contractors pay a monthly subscription to be in our network, but their placement in your referral list is determined by tier, IronClad compliance, and territory — not by paying for individual leads. We are not pay-to-play.'],
  ['Can I request a specific contractor?', 'Not directly through a job request — but your dashboard keeps track of contractors you have worked with before. If you had a great experience with someone you can find them in your saved contractors and reach out to them directly through their profile page.\n\nWe are also building a preferred contractor feature for realtors specifically — so the contractors you trust show up first when it matters.'],
  ['What information do you share with the contractors?', 'None of your personal contact information goes to the contractors. That is not how we work.\n\nWhen a referral goes out, each matched contractor gets an email that tells them the service category, the county, whether the request came from a homeowner or a realtor, and a summary of the job. That is it. No name. No phone number. No email address. Nothing they can use to track you down.\n\nYou get their information — not the other way around. You review the three contractors we matched you with, decide who you want to reach out to, and you make the call. The power stays with you.'],
];

function FaqGroup({ title, faqs }: { title: string; faqs: string[][] }) {
  return (
    <section className="mb-12">
      <h2 className="mb-6 text-3xl font-bold text-white">{title}</h2>
      <div className="space-y-4">
        {faqs.map(([q, a]) => {
          const paragraphs = a.split('\n\n');
          return (
            <div key={q} className="rounded-lg border border-lw-dark-border bg-lw-dark-card p-6">
              <h3 className="mb-2 text-lg font-bold text-white">{q}</h3>
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={`text-zinc-300 leading-relaxed${i < paragraphs.length - 1 ? ' mb-3' : ''}`}
                >
                  {para}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function FaqPage() {
  return (
    <PageShell surface="dark">
      <Navigation />
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl md:text-6xl font-bold text-white">Frequently Asked Questions</h1>
            <p className="text-lg text-zinc-300">Everything you need to know about ListWorx, IronClad certification, Founding Partner status, and how referrals work.</p>
          </div>
          <FaqGroup title="About ListWorx" faqs={generalFaqs} />
          <FaqGroup title="Founding Partner Program" faqs={founderFaqs} />
          <FaqGroup title="For Realtors and Homeowners" faqs={requestorFaqs} />
          <div className="mt-12 rounded-2xl border-2 border-lw-rust bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-center">
            <h3 className="mb-3 text-2xl font-bold text-white">Still have questions?</h3>
            <p className="mb-6 text-zinc-300">Email us at <a className="text-lw-rust hover:underline" href="mailto:adeyo@listworx.co">adeyo@listworx.co</a> and we will get back to you within one business day.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/apply">
                <Button size="lg" className="bg-lw-rust hover:bg-lw-rust-hover text-white">Apply to Join the Network</Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outline" className="border-lw-rust text-lw-rust hover:bg-lw-rust hover:text-white">Request a Referral</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
