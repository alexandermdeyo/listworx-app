'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck as CheckCircle, Users, Shield, Zap, Clock, Star, Chrome as Home, TrendingUp, Award, FileText, CircleAlert as AlertCircle, ArrowRight, ThumbsUp, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';

export default function RealtorsPage() {
  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-white/85" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal immediate delay={0}>
            <Badge className="mb-6 bg-lw-rust/10 text-lw-rust border-lw-rust/20 hover:bg-lw-rust/20">
              <Star className="h-3 w-3 mr-1" />
              Built for Real Estate Professionals
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-mkt-ink mb-6 referraling-tight">
              Refer Contractors<br className="hidden md:block" />
              <span className="text-lw-rust"> With Confidence.</span>
            </h1>
          </Reveal>
          <Reveal immediate delay={100}>
            <p className="text-lg md:text-xl lg:text-2xl text-mkt-ink/70 mb-10 max-w-3xl mx-auto">
              ListWorx gives you instant access to vetted, IronClad-certified contractors — for free. Submit one request, receive up to 3 qualified matches, and choose who to contact. No spam. No pressure. Your reputation stays protected.
            </p>
          </Reveal>

          <Reveal immediate delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/request">
                <Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all bg-lw-rust hover:bg-lw-rust-hover text-white">
                  <Users className="mr-2 h-5 w-5" />
                  Request a Contractor — Free
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal immediate delay={300}>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-lw-rust mb-2">Free</div>
                <div className="text-sm text-mkt-ink/70">Always — No Fees, Ever</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-lw-rust mb-2">3 Matches</div>
                <div className="text-sm text-mkt-ink/70">Max Per Request</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-lw-rust mb-2">{'<'}24h</div>
                <div className="text-sm text-mkt-ink/70">Contractor Response Time</div>
              </div>
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* HOW IT'S DIFFERENT */}
      <section className="py-20 bg-white border-y border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Reveal as="div" className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-mkt-ink mb-6">
                Not a Directory. Not a Referral Marketplace.
              </h2>
              <p className="text-lg md:text-xl text-mkt-ink/70 max-w-3xl mx-auto">
                Random contractor directories give you names. Spammy referral platforms give everyone your contact info. ListWorx gives you a curated shortlist of vetted professionals who have already been approved and are ready to respond.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-8">
              <Reveal delay={0}>
                <Card className="lw-hover-lift p-8 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-lw-rust" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-mkt-ink mb-2">Stop Cold-Calling Contractors</h3>
                      <p className="text-mkt-ink/70">
                        One request. Up to 3 vetted matches. No calling around. No waiting for callbacks from contractors who may or may not show up. You get qualified professionals — or you hear back from us.
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>

              <Reveal delay={70}>
                <Card className="lw-hover-lift p-8 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-lw-rust" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-mkt-ink mb-2">Every Contractor Is Verified</h3>
                      <p className="text-mkt-ink/70">
                        Every ListWorx contractor is licensed, insured, and actively meets IronClad Standards. We check credentials before approval and monitor compliance throughout their membership. Refer them knowing your name is protected.
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>

              <Reveal delay={140}>
                <Card className="lw-hover-lift p-8 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <Eye className="h-6 w-6 text-lw-rust" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-mkt-ink mb-2">You're Always in Control</h3>
                      <p className="text-mkt-ink/70">
                        You receive the matches. You decide who to contact. No contractor receives your client's information until you choose to share it. No unsolicited outreach. No spam.
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>

              <Reveal delay={210}>
                <Card className="lw-hover-lift p-8 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-lw-rust" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-mkt-ink mb-2">Keep Deals on Track</h3>
                      <p className="text-mkt-ink/70">
                        Pre-sale prep, post-inspection repairs, or move-in updates — get qualified contractors on the job fast. Contractors commit to 24-hour response times. No more delays killing your timeline.
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white border-y border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Reveal as="div" className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-mkt-ink mb-4">
                How It Works
              </h2>
              <p className="text-lg md:text-xl text-mkt-ink/70">
                Simple enough to do from your phone between appointments.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              <Reveal delay={0}>
                <Card className="lw-hover-lift p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border-2 border-lw-rust bg-white">
                  <div className="h-16 w-16 rounded-full bg-lw-rust/20 flex items-center justify-center mb-6 mx-auto">
                    <FileText className="h-8 w-8 text-lw-rust" />
                  </div>
                  <div className="text-6xl font-bold text-lw-rust/20 mb-4 text-center">01</div>
                  <h3 className="text-xl font-bold text-mkt-ink mb-3 text-center">Submit Your Request</h3>
                  <p className="text-mkt-ink/70 text-center">
                    Tell us the property location, the service needed, and your timeline. Takes under 2 minutes. Completely free.
                  </p>
                </Card>
              </Reveal>

              <Reveal delay={70}>
                <Card className="lw-hover-lift p-8 bg-white border-zinc-200 text-mkt-ink shadow-sm shadow-sm hover:shadow-lg transition-all">
                  <div className="h-16 w-16 rounded-full bg-lw-rust/10 flex items-center justify-center mb-6 mx-auto">
                    <Zap className="h-8 w-8 text-lw-rust" />
                  </div>
                  <div className="text-6xl font-bold text-lw-rust/20 mb-4 text-center">02</div>
                  <h3 className="text-xl font-bold text-mkt-ink mb-3 text-center">Receive Up to 3 Matches</h3>
                  <p className="text-mkt-ink/70 text-center">
                    Instantly — in under 30 seconds you&apos;ll see your matched contractors on screen, plus an email and a copy saved in your dashboard. No bidding wars, no junk lists.
                  </p>
                </Card>
              </Reveal>

              <Reveal delay={140}>
                <Card className="lw-hover-lift p-8 bg-white border-zinc-200 text-mkt-ink shadow-sm shadow-sm hover:shadow-lg transition-all">
                  <div className="h-16 w-16 rounded-full bg-lw-rust/10 flex items-center justify-center mb-6 mx-auto">
                    <ThumbsUp className="h-8 w-8 text-lw-rust" />
                  </div>
                  <div className="text-6xl font-bold text-lw-rust/20 mb-4 text-center">03</div>
                  <h3 className="text-xl font-bold text-mkt-ink mb-3 text-center">Choose Who to Contact</h3>
                  <p className="text-mkt-ink/70 text-center">
                    Review your matches, reach out to whoever fits best, and get the job scheduled. Contractors must respond within 24 hours.
                  </p>
                </Card>
              </Reveal>
            </div>

            <div className="text-center mt-12">
              <Link href="/request">
                <Button size="lg" className="text-lg px-10 py-6 rounded-lg shadow-lg hover:shadow-xl bg-lw-rust hover:bg-lw-rust-hover text-white">
                  Submit a Request Now — Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Reveal as="div" className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-mkt-ink mb-4">
                When Realtors Use ListWorx
              </h2>
              <p className="text-xl text-mkt-ink/70">
                From listing prep to closing day — reliable contractors for every stage of the transaction.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              <Reveal delay={0}>
                <Card className="lw-hover-lift p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <h3 className="text-lg font-bold text-mkt-ink mb-3 flex items-center">
                    <Home className="h-5 w-5 text-lw-rust mr-2" />
                    Pre-Sale Preparation
                  </h3>
                  <ul className="text-mkt-ink/70 space-y-2 text-sm">
                    <li>• Flooring repairs, refinishing, and replacement</li>
                    <li>• Interior and exterior painting</li>
                    <li>• Kitchen and bath cosmetic updates</li>
                    <li>• Landscaping and curb appeal improvements</li>
                  </ul>
                </Card>
              </Reveal>

              <Reveal delay={70}>
                <Card className="lw-hover-lift p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <h3 className="text-lg font-bold text-mkt-ink mb-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-lw-rust mr-2" />
                    Post-Inspection Repairs
                  </h3>
                  <ul className="text-mkt-ink/70 space-y-2 text-sm">
                    <li>• HVAC repairs and system replacement</li>
                    <li>• Plumbing fixes and code corrections</li>
                    <li>• Electrical work and panel upgrades</li>
                    <li>• Roof repairs, flashing, and gutter work</li>
                  </ul>
                </Card>
              </Reveal>

              <Reveal delay={140}>
                <Card className="lw-hover-lift p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <h3 className="text-lg font-bold text-mkt-ink mb-3 flex items-center">
                    <Users className="h-5 w-5 text-lw-rust mr-2" />
                    Buyer Move-In Services
                  </h3>
                  <ul className="text-mkt-ink/70 space-y-2 text-sm">
                    <li>• Deep cleaning and carpet cleaning</li>
                    <li>• Lock rekeying and security updates</li>
                    <li>• Appliance installation and hookup</li>
                    <li>• Touch-up work and minor repairs</li>
                  </ul>
                </Card>
              </Reveal>

              <Reveal delay={210}>
                <Card className="lw-hover-lift p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust transition-all">
                  <h3 className="text-lg font-bold text-mkt-ink mb-3 flex items-center">
                    <Shield className="h-5 w-5 text-lw-rust mr-2" />
                    Emergency Situations
                  </h3>
                  <ul className="text-mkt-ink/70 space-y-2 text-sm">
                    <li>• Water damage and mold remediation</li>
                    <li>• Emergency plumbing and leak repair</li>
                    <li>• Electrical emergencies and outages</li>
                    <li>• Storm damage and structural issues</li>
                  </ul>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IRONCLAD */}
      <section className="py-16 bg-white border-y border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Reveal as="div" className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <Image src="/Ironclad_Cert_Partner_Final_Logo.png" alt="IronClad Certified" width={80} height={80} className="w-16 h-auto" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-mkt-ink mb-4">
                What IronClad Certification Means for You
              </h2>
              <p className="text-lg text-mkt-ink/70 max-w-2xl mx-auto">
                When you refer an IronClad Partner, you're not guessing. You know exactly what standards they've agreed to and are held accountable for.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Shield, title: 'License Verified', desc: 'State contractor license confirmed and tracked' },
                { icon: Award, title: 'Insurance Current', desc: 'Active general liability and workers comp required' },
                { icon: Clock, title: '24-Hour Response', desc: 'Every referral must be acknowledged within a day' },
                { icon: CheckCircle, title: 'Standards Enforced', desc: 'Non-compliance means removal from the network' },
              ].map((item, index) => (
                <Reveal key={item.title} delay={index * 70}>
                  <Card className="lw-hover-lift p-5 text-center bg-white border-zinc-200 text-mkt-ink shadow-sm hover:border-lw-rust hover:shadow-md transition-all">
                    <item.icon className="h-8 w-8 text-lw-rust mx-auto mb-3" />
                    <h4 className="font-semibold text-mkt-ink text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-mkt-ink/70">{item.desc}</p>
                  </Card>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/ironclad">
                <Button variant="outlineOrange">
                  <Shield className="h-4 w-4 mr-2" />
                  Read the Full IronClad Standards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LISTING STUDIO */}
      <section className="py-20 bg-white border-y border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Reveal as="div">
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-lw-rust/30 bg-lw-rust/10 px-4 py-1.5 text-sm font-semibold text-lw-rust">
                  <Zap className="h-4 w-4" />
                  Listing Studio
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-mkt-ink mb-6">
                Now we built you something else.
              </h2>
              <div className="space-y-4 text-lg text-mkt-ink/70 mb-10 max-w-3xl">
                <p>You&apos;ve been generating your own marketing content forever. Writing captions at 10pm. Tweaking Canva templates between showings. Sending the same open house email you&apos;ve sent forty times. That&apos;s done.</p>
                <p>Listing Studio is built into your ListWorx account. Put in your property details and walk away with Instagram captions, Facebook posts, a LinkedIn update, your email campaign, an open house announcement, and a rewritten property description — all in about 30 seconds.</p>
                <p>It also builds you a shareable listing page for every property. Clean, fast, branded to you. Text the link to a client. Drop it in your bio. Done.</p>
              </div>

              <h3 className="text-xl font-bold text-mkt-ink mb-4">What you actually get</h3>
            </Reveal>
            <ul className="space-y-3 mb-10">
              {[
                'Content packages — every caption, post, and email you need for a listing, generated together in one shot',
                'Branded landing pages — a real URL for every listing, ready to share the same day it goes live',
                'PDF flyers — listing flyers and open house flyers, built from your data and branded to you',
                'Your brand on everything — your name, photo, colors, and contact info baked into every asset',
              ].map((item, index) => (
                <Reveal key={item} as="li" delay={index * 70} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-lw-rust shrink-0 mt-0.5" />
                  <span className="text-mkt-ink/70">{item}</span>
                </Reveal>
              ))}
            </ul>

            <Reveal as="div">
              <h3 className="text-xl font-bold text-mkt-ink mb-2">And there&apos;s more coming.</h3>
              <p className="text-mkt-ink/60 mb-8">Neighborhood guides. Slideshow videos. AI voiceovers. Automated social campaigns. We&apos;re building it fast and Listing Studio subscribers get it first.</p>

              <Link href="/listing-studio">
                <Button size="lg" className="bg-lw-rust hover:bg-lw-rust-hover text-white">
                  See what&apos;s included
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 bg-lw-rust">
        <div className="container mx-auto px-4">
          <Reveal as="div" className="max-w-4xl mx-auto text-center">
            <Award className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              It's Free. Start Using It Today.
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              No membership fees. No per-request charges. No hidden costs. Contractors pay to be in the network — you get vetted matches at zero cost. Every request, every time.
            </p>
            <Link href="/request">
              <Button size="lg" className="text-lg px-10 py-6 rounded-lg shadow-lg hover:shadow-xl bg-white text-lw-rust hover:bg-white/90">
                Submit Your First Request — Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

    </PageShell>
  );
}
