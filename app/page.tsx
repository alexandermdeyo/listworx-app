import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Shield, Users, Crown, ArrowRight, Star, Zap, CheckCircle, Award, Search, UserCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import FeaturedContractorsLogoBar from '@/components/site/FeaturedContractorsLogoBar';
import { getContent, getSiteContent, isVisible } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

type Testimonial = { name?: string; trade?: string; city?: string; quote?: string };

function parseTestimonials(value: string): Testimonial[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch (_e) {
    return [];
  }
}

export default async function LandingPage() {
  const content = await getSiteContent('home');
  const heroVideoUrl = getContent(content, 'hero_video_url');
  const heroImageUrl = getContent(content, 'hero_background_image_url');
  const founderBgColor = getContent(content, 'founder_banner_bg_color', '#C2410C');
  const testimonials = parseTestimonials(getContent(content, 'testimonials_json', '[{"name":"Mike R.","trade":"Painter","city":"Gallatin TN","quote":"Finally a platform that treats contractors like professionals, not commodities."},{"name":"Sarah T.","trade":"HVAC","city":"Hendersonville TN","quote":"I was skeptical after Angi. ListWorx is completely different."}]'));

  return (
    <PageShell surface="dark">
      <Navigation />

      {isVisible(content, 'hero_visible') && (
        <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {heroVideoUrl ? (
              <video src={heroVideoUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline aria-hidden="true" />
            ) : heroImageUrl ? (
              <img src={heroImageUrl} alt="" className="w-full h-full object-cover" aria-hidden="true" />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            )}
            <div className="absolute inset-0 bg-lw-dark/60" />
          </div>
          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Shield className="h-3 w-3 mr-1" />
                Trusted referral network for contractors, realtors, homeowners, and property managers
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                {getContent(content, 'hero_headline', 'The Contractor Network Built on Trust, Not Transactions.')}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
                {getContent(content, 'hero_subheadline', 'ListWorx connects realtors and homeowners with vetted, IronClad-certified contractors. No lead fees. No bidding wars. Just trusted referrals — and only three per request.')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center">
                <Link href="/apply" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-lg shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 text-white">
                    <Briefcase className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    {getContent(content, 'hero_cta_contractor_label', 'Apply to Join the Network')}
                  </Button>
                </Link>
                <Link href="/request" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all">
                    <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    {getContent(content, 'hero_cta_requestor_label', 'Request a Referral')}
                  </Button>
                </Link>
              </div>

              <div className="mt-12 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold text-lw-rust mb-1">100%</div><div className="text-xs md:text-sm text-muted-foreground">Vetted Contractors</div></div>
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold text-primary mb-1">3 Matches</div><div className="text-xs md:text-sm text-muted-foreground">Max Per Request</div></div>
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold text-primary mb-1">{'<'}24h</div><div className="text-xs md:text-sm text-muted-foreground">Response Commitment</div></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isVisible(content, 'founder_banner_visible') && (
        <section className="py-12 md:py-16 border-y border-amber-900/30" style={{ backgroundColor: founderBgColor }}>
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-shrink-0">
                  <Image src="/ironclad_founder_shield_logo.png" alt="IronClad Founding Partner" width={140} height={140} className="w-28 md:w-36 h-auto" />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <Badge className="mb-3 bg-white/15 text-white border-white/30"><Crown className="h-3 w-3 mr-1" /> Limited Founding Spots Available</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {getContent(content, 'founder_banner_headline', 'Founding Partner Spots Are Open — But Not For Long')}
                  </h2>
                  <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-2xl">
                    {getContent(content, 'founder_banner_body', 'We are accepting a limited number of Founding Partners in each trade and county. When your trade fills, that is it. No exceptions, no waitlist.')}
                  </p>
                </div>
                <Link href="/apply" className="flex-shrink-0">
                  <Button className="bg-white text-lw-rust hover:bg-white/90 px-6 py-5 text-base">Apply Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <FeaturedContractorsLogoBar />

      {isVisible(content, 'why_visible') && (
        <section className="py-16 md:py-20 bg-background border-y border-lw-dark-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                {getContent(content, 'why_headline', 'Why We Are Different')}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3].map(index => {
                const WhyIcon = [Search, Users, Shield][index - 1];
                return (
                <Card key={index} className="p-6 md:p-8 bg-background border-2 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                    <WhyIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {getContent(content, `why_card_${index}_headline`, ['Not a Lead Marketplace', 'Only 3 Referrals Per Request', 'IronClad Standards Required'][index - 1])}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {getContent(content, `why_card_${index}_body`, ['We do not sell your contact info to the highest bidder. ListWorx is a vetted referral network.', 'Every requestor gets exactly three contractor referrals — not a dozen. Quality over volume.', 'Every contractor in the network must maintain IronClad Standards — fast response, valid insurance, professional communication, no ghosting.'][index - 1])}
                  </p>
                </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {isVisible(content, 'ironclad_visible') && (
        <section className="py-12 md:py-16 lg:py-20 bg-black border-y border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-4 bg-red-950/50 text-red-500 border-red-900"><Shield className="h-3 w-3 mr-1" /> IronClad Standards</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {getContent(content, 'ironclad_headline', 'What IronClad Standards Mean')}
              </h2>
              <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-10">
                {getContent(content, 'ironclad_body', 'Every contractor in the ListWorx network is held to IronClad Standards. This is not a suggestion. It is the cost of being in the network.')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {['Licensed & Insured', 'Fast Response', 'Professional Conduct', 'No Ghosting'].map(item => (
                  <Card key={item} className="p-6 bg-zinc-900 border-zinc-800 hover:border-red-600 transition-all text-center">
                    <CheckCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <p className="text-white font-semibold text-sm">{item}</p>
                  </Card>
                ))}
              </div>
              <Link href="/ironclad"><Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white">Read the Standards <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
          </div>
        </section>
      )}

      <section id="how-it-works" className="bg-card py-16 md:py-20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12"><h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2><p className="text-lg md:text-xl text-muted-foreground">A simple, trusted process for both sides of the referral.</p></div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[['1', 'Tell Us What You Need', 'Requestors submit the project details, location, and timeline.'], ['2', 'We Match the Right Pros', 'ListWorx sends up to three vetted contractors who fit the job.'], ['3', 'Connect with Confidence', 'You choose who to contact knowing every pro meets IronClad Standards.']].map(step => (
              <Card key={step[0]} className="p-6 md:p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border border-border bg-card">
                <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-5">{step[0]}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step[1]}</h3>
                <p className="text-muted-foreground leading-relaxed">{step[2]}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="for-realtors" className="py-20 bg-gradient-to-br from-primary via-primary to-primary/80">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">For Realtors, Homeowners, and Property Managers</h2>
          <p className="text-lg md:text-xl text-white/85 max-w-3xl mx-auto mb-10">Protect your reputation with contractors who are vetted before they ever reach your client.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mb-10">
            {['Free to request', 'No spam calls', 'Up to 3 matches', 'Reputation-first'].map(item => <Card key={item} className="p-6 bg-white/10 backdrop-blur-sm border-white/20"><Star className="h-6 w-6 text-white mx-auto mb-3" /><p className="font-semibold text-white">{item}</p></Card>)}
          </div>
          <Link href="/request"><Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl bg-white text-primary hover:bg-white/90">Request a Contractor</Button></Link>
        </div>
      </section>

      <section id="for-contractors" className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">For Contractors</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12">Join a referral network built for serious professionals, not a pay-per-lead auction.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {['Flat monthly membership', 'Vetted network positioning', 'No bidding wars'].map((item, index) => <Card key={item} className="p-6 rounded-lg shadow-sm hover:shadow-lg transition-all text-center border border-border bg-card"><Award className="h-8 w-8 text-primary mx-auto mb-4" /><h3 className="font-bold text-lg mb-2">{item}</h3><p className="text-muted-foreground text-sm">{['Predictable cost with no surprise lead fees.', 'Stand beside contractors who meet the same standard.', 'Win on trust, responsiveness, and reputation.'][index]}</p></Card>)}
          </div>
          <Link href="/apply"><Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90"><Zap className="mr-2 h-5 w-5" />Apply as a Contractor</Button></Link>
        </div>
      </section>

      {isVisible(content, 'testimonials_visible') && testimonials.length > 0 && (
        <section className="py-16 md:py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12"><h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{getContent(content, 'testimonials_headline', 'What Contractors Are Saying')}</h2></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {testimonials.map((item, index) => <Card key={`${item.name}-${index}`} className="p-6 bg-background border-border"><Star className="h-5 w-5 text-primary mb-4" /><p className="text-muted-foreground leading-relaxed mb-6">“{item.quote}”</p><p className="font-bold text-foreground">{item.name}</p><p className="text-sm text-muted-foreground">{[item.trade, item.city].filter(Boolean).join(' • ')}</p></Card>)}
            </div>
          </div>
        </section>
      )}

      {isVisible(content, 'final_cta_visible') && (
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">{getContent(content, 'final_cta_headline', 'Ready to Join the Network?')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">Whether you need a trusted contractor or want to become one of the trusted names we refer, ListWorx is ready.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center"><Link href="/apply"><Button size="lg" className="text-lg px-8 py-6 rounded-lg bg-primary hover:bg-primary/90 text-white">Apply as a Contractor</Button></Link><Link href="/request"><Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white">Request a Referral</Button></Link></div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
