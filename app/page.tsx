'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck as CheckCircle, Users, Search, UserCheck, Briefcase, Shield, Zap, Clock, CircleAlert as AlertCircle, FileText, Award, ArrowRight, Star, Crown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';

interface FeaturedContractor {
  id: string;
  company_name: string;
  logo_url: string;
}

export default function LandingPage() {
  const [featuredContractors, setFeaturedContractors] = useState<FeaturedContractor[]>([]);

  useEffect(() => {
    fetch('/api/featured-contractors')
      .then(r => r.json())
      .then(d => setFeaturedContractors(d.contractors || []))
      .catch(() => {});
  }, []);

  return (
    <PageShell surface="dark">
      <Navigation />

      {/* HERO */}
      <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-lw-dark/88" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Shield className="h-3 w-3 mr-1" />
            Trusted referral network for contractors, realtors, homeowners, and property managers
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Trusted Contractors. Stronger Businesses. Better Referrals.
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            ListWorx connects contractors with realtors, homeowners, and property managers through a trusted referral network built on reputation, professionalism, and real relationships—not pay-per-lead chaos.
          </p>
          <p className="text-base md:text-lg text-foreground/80 mb-10 max-w-3xl mx-auto">
            We help contractors grow. We help requestors move faster. We protect reputations on both sides.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center">
            <Link href="/apply" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-lg shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 text-white">
                <Briefcase className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Apply as a Contractor
              </Button>
            </Link>
            <Link href="/request" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all">
                <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Request a Trusted Contractor
              </Button>
            </Link>
          </div>

          <div className="mt-12 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-lw-rust mb-1">100%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Vetted Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">3 Matches</div>
              <div className="text-xs md:text-sm text-muted-foreground">Max Per Request</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{'<'}24h</div>
              <div className="text-xs md:text-sm text-muted-foreground">Response Commitment</div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* FOUNDING PARTNER CAMPAIGN */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-y border-amber-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-shrink-0">
                <Image
                  src="/ironclad_founder_shield_logo.png"
                  alt="IronClad Founding Partner"
                  width={140}
                  height={140}
                  className="w-28 md:w-36 h-auto"
                />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <Badge className="mb-3 bg-amber-600/15 text-amber-500 border-amber-600/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Limited Founding Spots Available
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Built for contractors who take pride in their work.
                </h2>
                <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-2xl">
                  We do not sell random leads. We build trusted relationships. Founding Partners get early visibility, long-term recognition, and first-position credibility as the network grows in your market.
                </p>
                <div className="mt-5 flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Star className="h-4 w-4" />
                      <span>Permanent founding recognition</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Shield className="h-4 w-4" />
                      <span>Priority early positioning</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Award className="h-4 w-4" />
                      <span>Limited availability</span>
                  </div>
                </div>
                <div className="mt-6">
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
        </div>
      </section>

      {/* FEATURED CONTRACTORS LOGO BAR */}
      {featuredContractors.length > 0 && (
        <section className="py-8 md:py-10 bg-lw-surface-card border-y border-lw-border-light">
          <div className="container mx-auto px-4">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-6">
              IronClad Certified Partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {featuredContractors.map(c => (
                <div key={c.id} className="flex items-center justify-center h-10">
                  <img
                    src={c.logo_url}
                    alt={c.company_name}
                    className="h-10 w-auto max-w-[140px] object-contain opacity-60 hover:opacity-100 transition-opacity duration-200 grayscale hover:grayscale-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    title={c.company_name}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* IRONCLAD STANDARDS BAND */}
      <section className="py-12 md:py-16 lg:py-20 bg-black border-y border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <Image src="/Ironclad_Cert_Partner_Final_Logo.png" alt="IronClad Certified Partner" width={160} height={160} className="w-32 md:w-40 h-auto" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                IronClad Standards Are a Real Trust Standard
              </h2>
              <p className="text-xl md:text-2xl text-red-500 mb-3 font-semibold">
                Your reputation matters. So does ours.
              </p>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                IronClad Standards is the accountability framework every ListWorx contractor must meet and keep. This is not badge marketing. It is enforced standards for licensing, insurance, communication, and professional conduct.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                  What IronClad Eliminates
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Unverified licenses and expired insurance</span>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>No-shows, ghosting, and missed appointments</span>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Surprise pricing and verbal-only estimates</span>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Poor communication and unprofessional conduct</span>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Contractors who will not stand behind their work</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-950 border-2 border-red-700 rounded-lg p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-red-500 mr-3" />
                  What IronClad Requires
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Verified state licensing and active insurance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Response to every referral within 24 hours</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Written estimates for all work over $500</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Professional communication and clean job sites</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Ongoing compliance monitoring — not just at signup</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-red-600 transition-all text-center">
                <Shield className="h-10 w-10 text-red-500 mb-3 mx-auto" />
                <h4 className="text-sm font-semibold text-white mb-2">Licensed & Insured</h4>
                <p className="text-xs text-gray-400">Documents verified and tracked</p>
              </Card>

              <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-red-600 transition-all text-center">
                <FileText className="h-10 w-10 text-red-500 mb-3 mx-auto" />
                <h4 className="text-sm font-semibold text-white mb-2">Written Estimates</h4>
                <p className="text-xs text-gray-400">No verbal-only pricing on larger jobs</p>
              </Card>

              <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-red-600 transition-all text-center">
                <Clock className="h-10 w-10 text-red-500 mb-3 mx-auto" />
                <h4 className="text-sm font-semibold text-white mb-2">24-Hour Response</h4>
                <p className="text-xs text-gray-400">Required on every referral received</p>
              </Card>

              <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-red-600 transition-all text-center">
                <Award className="h-10 w-10 text-red-500 mb-3 mx-auto" />
                <h4 className="text-sm font-semibold text-white mb-2">Enforced Standards</h4>
                <p className="text-xs text-gray-400">Non-compliance means removal</p>
              </Card>
            </div>

            <div className="text-center mt-10">
              <Link href="/ironclad">
                <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Read the Full IronClad Standards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM SECTION */}
      <section className="py-16 md:py-20 bg-background border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-lw-text mb-4">
                Trusted contractors. Cleaner closings. Stronger reputations.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                For realtors, homeowners, and property managers: one bad contractor can cost you everything. We help protect that.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
              <Card className="p-6 md:p-8 bg-background border-2 border-destructive/20">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <AlertCircle className="h-6 w-6 text-destructive mr-3" />
                  Contractors Need Better Than Pay-Per-Lead Chaos
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>$15–$100+ per lead, win or lose</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>The same lead sold to multiple competitors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>Race-to-the-bottom pricing pressure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>Low-intent and fake requests mixed with real projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>Unpredictable spend with no relationship built</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 md:p-8 bg-background border-2 border-destructive/20">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <AlertCircle className="h-6 w-6 text-destructive mr-3" />
                  Requestors Carry the Risk When Referrals Go Wrong
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>Hard to verify licensing and insurance before sharing names</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>Contractors who go silent after first contact</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>No accountability when communication or work quality slips</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>Your reputation tied to someone else’s performance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">•</span>
                    <span>Deals and turnovers delayed by missed timelines</span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="bg-primary text-white rounded-lg p-6 md:p-8 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">The ListWorx Model Is Relationship-First</h3>
              <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
                We help good contractors get seen by people who actually need them. Requestors get up to 3 trusted referrals, not a random list. Contractors grow with visibility, stronger reputation, and long-term support as the network expands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-card py-16 md:py-20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              A premium 3-referral process by design
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Every request returns exactly 3 vetted referrals max, so you can move quickly with confidence instead of sorting through noisy directories.
              </p>
            </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <Card className="p-6 md:p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border border-border bg-card">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
                <Search className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary/20 mb-3 md:mb-4">01</div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Tell Us What You Need</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Share location, project type, and timeline in a quick request. We focus on fit, not lead volume.
              </p>
            </Card>

            <Card className="p-6 md:p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border-2 border-primary bg-card">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 md:mb-6">
                <UserCheck className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary/20 mb-3 md:mb-4">02</div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Receive Up to 3 Matches</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                We hand-select up to 3 IronClad contractors based on trade, location, and availability. No bidding wars. No junk blasts.
              </p>
            </Card>

            <Card className="p-6 md:p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border border-border bg-card">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
                <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary/20 mb-3 md:mb-4">03</div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">You Choose Who to Contact</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Review, connect, and keep moving. You stay in control while every contractor is held to professional standards.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FOR REALTORS */}
      <section id="for-realtors" className="py-20 bg-gradient-to-br from-primary via-primary to-primary/80">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                For Realtors, Homeowners, and Property Managers
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Protect listings, reduce contractor headaches, and keep client trust strong with a reliable network you can actually stand behind.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
                <Clock className="h-10 w-10 mb-4 text-white" />
                <h3 className="text-xl font-semibold mb-2 text-white">Move Faster Under Pressure</h3>
                <p className="text-white/90">
                  One request gives you three vetted options so listing prep, repairs, and turnovers do not stall.
                </p>
              </Card>

              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
                <Shield className="h-10 w-10 mb-4 text-white" />
                <h3 className="text-xl font-semibold mb-2 text-white">Protect Your Reputation</h3>
                <p className="text-white/90">
                  Every contractor is vetted and held to IronClad Standards, so your recommendations stay trustworthy.
                </p>
              </Card>

              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
                <Users className="h-10 w-10 mb-4 text-white" />
                <h3 className="text-xl font-semibold mb-2 text-white">Build Long-Term Relationships</h3>
                <p className="text-white/90">
                  Keep a reliable bench of pros for repeat projects instead of starting from scratch every time.
                </p>
              </Card>

              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
                <Zap className="h-10 w-10 mb-4 text-white" />
                <h3 className="text-xl font-semibold mb-2 text-white">Stay Efficient Across Properties</h3>
                <p className="text-white/90">
                  Better response expectations, better communication, and fewer surprises for closings and turnovers.
                </p>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Link href="/request">
                <Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl bg-white text-primary hover:bg-white/90">
                  Request a Trusted Contractor
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOR CONTRACTORS */}
      <section id="for-contractors" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                For Contractors
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built for contractors who take pride in their work. Grow with better visibility, stronger referrals, and a reputation that compounds over time.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 rounded-lg shadow-sm hover:shadow-lg transition-all text-center border border-border bg-card">
                <div className="text-4xl font-bold text-primary mb-2">$199</div>
                <div className="text-sm text-muted-foreground mb-4">per month</div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Basic Partner</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Public profile visibility in the trusted network</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Eligible for referral matching in your service area</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Consistent referral opportunity without pay-per-lead waste</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Credential tracking and IronClad compliance support</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 rounded-lg shadow-lg hover:shadow-xl transition-all text-center border-2 border-primary bg-card relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">Most Popular</Badge>
                <div className="text-4xl font-bold text-primary mb-2">$349</div>
                <div className="text-sm text-muted-foreground mb-4">per month</div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Preferred Partner</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Priority placement in referral matching</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Enhanced visibility with logo placement</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>IronClad Certified Partner badge</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 rounded-lg shadow-sm hover:shadow-lg transition-all text-center border border-border bg-card">
                <div className="text-4xl font-bold text-primary mb-2">$599</div>
                <div className="text-sm text-muted-foreground mb-4">per month</div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Elite Partner</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Everything in Preferred</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Top-priority referral positioning</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Premium profile placement and IronClad Elite badge</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Professionally produced 60-second promo video <span className="text-xs italic">(annual plan)</span></span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-base text-foreground mb-4">
                As ListWorx grows, contractors gain access to deeper support like education, marketing tools, hiring support, and mentorship.
              </p>
              <Link href="/apply">
                <Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90">
                  Apply to Join the Network
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Applications reviewed within 48 hours. All plans require IronClad Standards compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Built by people who understand this work.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            ListWorx was built for real-world contractor referrals, real listing pressure, and real accountability. We help good contractors grow and help requestors protect what they have worked hard to build.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply">
              <Button size="lg" className="text-lg px-8 py-6 rounded-lg bg-primary hover:bg-primary/90 text-white">
                Apply as a Contractor
              </Button>
            </Link>
            <Link href="/request">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white">
                Request a Trusted Contractor
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
