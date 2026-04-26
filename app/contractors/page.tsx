'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck as CheckCircle, Shield, TrendingUp, Users, DollarSign, Award, Briefcase, FileText, Clock, Target, CheckCheck, Phone, CircleAlert as AlertCircle, ArrowRight, Lock, Star, Crown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';

export default function ContractorsPage() {
  return (
    <PageShell surface="dark">
      <Navigation />

      {/* HERO */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Briefcase className="h-3 w-3 mr-1" />
            IronClad Partner Network
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Built for Contractors<br className="hidden md:block" />
            <span className="text-primary">Who Take Pride in Their Work.</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            You bring the craftsmanship. We help bring the opportunity. ListWorx is your growth partner — helping serious home service pros get seen by realtors, homeowners, and property managers who need quality work done right.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/apply">
              <Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90">
                <Award className="mr-2 h-5 w-5" />
                Apply to Join the Network
              </Button>
            </Link>
            <Link href="/ironclad">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all">
                <Shield className="mr-2 h-5 w-5" />
                View IronClad Standards
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">3 Max</div>
              <div className="text-sm text-muted-foreground">Contractors Per Referral</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Flat</div>
              <div className="text-sm text-muted-foreground">Monthly Rate — No Per-Lead Fees</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Vetted</div>
              <div className="text-sm text-muted-foreground">Referrals from Trusted Realtors</div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND MESSAGE */}
      <section className="py-16 md:py-20 bg-lw-surface border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-lw-dark mb-5">
                We’re Building This With You
              </h2>
              <p className="text-lg md:text-xl text-zinc-700 max-w-4xl mx-auto">
                ListWorx is built for contractors who take pride in their work.
              </p>
            </div>

            <Card className="p-6 md:p-8 bg-white border border-zinc-200 mb-8">
              <p className="text-base md:text-lg text-zinc-700 leading-relaxed">
                We’re not here to sell random leads, spam your phone, or throw you into a race-to-the-bottom bidding war. We’re building a trusted contractor network that helps serious home service pros get in front of realtors, homeowners, and property managers who need quality work done right.
              </p>
              <p className="text-base md:text-lg text-zinc-700 leading-relaxed mt-5">
                As ListWorx grows, our goal is to grow with you — helping contractors get more exposure, build stronger reputations, earn more referrals, and eventually access tools, education, hiring support, mentorship opportunities, and marketing resources that help your business scale.
              </p>
            </Card>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                'We don’t do lead spam.',
                'We don’t do race-to-the-bottom bidding.',
                'We help good contractors get seen by people who actually need them.',
              ].map((line) => (
                <div key={line} className="rounded-lg border border-primary/30 bg-white px-4 py-4 text-center shadow-sm">
                  <p className="text-sm md:text-base font-semibold text-lw-text">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW THE NETWORK WORKS */}
      <section className="py-20 bg-lw-surface border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-lw-dark mb-4">
                How ListWorx Sends You Better Opportunities
              </h2>
              <p className="text-lg md:text-xl text-zinc-600 max-w-3xl mx-auto">
                From application to first call, here’s exactly how we help the right customers find your business.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: FileText,
                  title: 'Apply',
                  desc: 'Submit your application with your license, insurance, and trade specialties. We review credentials within 48 hours.',
                },
                {
                  step: '02',
                  icon: Shield,
                  title: 'Get Approved',
                  desc: 'Once verified against IronClad Standards, your account is activated and you choose a subscription plan.',
                },
                {
                  step: '03',
                  icon: DollarSign,
                  title: 'Subscribe',
                  desc: 'Pay a flat monthly fee. No per-lead charges. Your subscription tier determines your placement priority.',
                },
                {
                  step: '04',
                  icon: Target,
                  title: 'Receive Referrals',
                  desc: "When someone needs your trade in your service area, you're matched directly — no junk blasts, no bidding circus.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="relative inline-flex mb-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 text-xs font-bold bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-lw-dark mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY LISTWORX */}
      <section className="py-20 bg-lw-dark border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <Image src="/Ironclad_Cert_Partner_Final_Logo.png" alt="IronClad Standards" width={120} height={120} className="w-24 h-auto" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Why This Is Different From Pay-Per-Lead
              </h2>
              <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto">
                Angi, HomeAdvisor, and Thumbtack sell your contact info to as many contractors as they can. ListWorx is built around the opposite model.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 bg-lw-dark-card border border-lw-dark-border hover:border-lw-rust transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">High-Intent Referrals Only</h3>
                    <p className="text-zinc-300">
                      Every request comes from a realtor managing an active transaction or a homeowner with a real project. No tire-kickers. No price shoppers browsing for quotes they&apos;ll never act on.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-lw-dark-card border border-lw-dark-border hover:border-lw-rust transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Maximum 3 Contractors Per Request</h3>
                    <p className="text-zinc-300">
                      Your referral isn&apos;t sold to 15 other contractors. You compete against at most 2 others — both vetted professionals. Higher close rates. Better margins. No race to the bottom.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-lw-dark-card border border-lw-dark-border hover:border-lw-rust transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Predictable Business Costs</h3>
                    <p className="text-zinc-300">
                      One flat monthly rate — no per-lead fees, no surprise charges, no bidding for priority. Know your marketing spend up front and build your business around it.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-lw-dark-card border border-lw-dark-border hover:border-lw-rust transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">The IronClad Badge Builds Your Brand</h3>
                    <p className="text-zinc-300">
                      Being an IronClad Partner signals professionalism to every realtor and homeowner you work with. It&apos;s third-party credibility built into every referral you receive.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON: PPL vs ListWorx */}
      <section className="py-16 md:py-20 bg-lw-surface border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-lw-dark mb-4">
                Stop Paying for Dead-End Leads
              </h2>
              <p className="text-lg md:text-xl text-zinc-600">
                Here’s what changes when you stop buying random leads and join a trusted contractor network.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-6 md:p-8 bg-white border-2 border-destructive/30">
                <h3 className="text-xl md:text-2xl font-bold text-lw-dark mb-4 flex items-center">
                  <AlertCircle className="h-6 w-6 text-destructive mr-3 flex-shrink-0" />
                  Traditional Lead Platforms
                </h3>
                <ul className="space-y-3 text-sm md:text-base text-zinc-700">
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">✗</span>
                    <span>Pay $15–$100+ per lead received</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">✗</span>
                    <span>Same lead sold to 10–20 other contractors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">✗</span>
                    <span>No quality standards or credential verification</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">✗</span>
                    <span>Monthly costs swing wildly with no predictability</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">✗</span>
                    <span>Forced to underprice to outbid competitors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-destructive mr-3 font-bold">✗</span>
                    <span>Too many “just looking” requests that never become real jobs</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 md:p-8 bg-primary text-white border-2 border-primary shadow-md">
                <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                  ListWorx Network
                </h3>
                <ul className="space-y-3 text-sm md:text-base">
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span>Flat monthly subscription — no per-lead fees, ever</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span>Maximum 3 contractors matched per request</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span>IronClad Standards required for all network members</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span>Predictable monthly cost you can budget around</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span>Relationship-driven referrals from trusted realtors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span>We help good contractors get seen by people who actually need them</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="py-16 md:py-20 bg-lw-dark border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                What We Require
              </h2>
              <p className="text-xl text-muted-foreground">
                IronClad Standards are requirements, not suggestions. Here&apos;s what every Partner must have and maintain.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 bg-background border-2 border-primary">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  Required Credentials
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Valid state contractor license for your trade</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>General liability insurance ($1M minimum)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Workers&apos; compensation insurance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Minimum 2 years in business</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Clean business and complaint history</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-background border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                  <Award className="h-5 w-5 text-primary mr-2" />
                  Ongoing Standards
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Respond to every referral within 24 hours</span>
                  </li>
                  <li className="flex items-start">
                    <Phone className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Professional, timely communication on every job</span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Written estimates provided for jobs over $500</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Show up on time and honor your commitments</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Stand behind your work — or risk network removal</span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="bg-lw-dark border border-lw-dark rounded-lg p-8 text-center">
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Standards Are Enforced — Not Just Stated</h3>
              <p className="text-gray-300 text-base max-w-2xl mx-auto">
                We verify credentials before approval and monitor compliance throughout your membership. Poor performance or complaints can result in suspension or removal. IronClad Standards protect realtors, homeowners, and the contractors who maintain them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section className="py-16 md:py-20 bg-lw-surface border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-lw-dark mb-4">
                Is This the Right Fit?
              </h2>
              <p className="text-lg md:text-xl text-zinc-700">
                Built for contractors who take pride in their work — not everyone qualifies, and that’s by design.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-6 md:p-8 bg-white border-2 border-primary shadow-sm">
                <CheckCircle className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl md:text-2xl font-bold text-lw-dark mb-4">A Good Fit If You:</h3>
                <ul className="space-y-3 text-sm md:text-base text-zinc-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Are licensed, insured, and have a track record</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Want predictable, manageable marketing costs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Respond fast and communicate professionally</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Are tired of competing against 15 other contractors</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Want high-quality work from realtors with real projects</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>Value your professional reputation and want to grow it</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 md:p-8 bg-white border border-zinc-200 shadow-sm">
                <AlertCircle className="h-10 w-10 text-zinc-500 mb-4" />
                <h3 className="text-xl md:text-2xl font-bold text-lw-dark mb-4">Not the Right Fit If You:</h3>
                <ul className="space-y-3 text-sm md:text-base text-zinc-700">
                  <li className="flex items-start">
                    <span className="text-zinc-500 mr-3 font-bold">✗</span>
                    <span>Are unlicensed or don’t carry proper insurance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-500 mr-3 font-bold">✗</span>
                    <span>Want volume over quality — high-count, low-margin work</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-500 mr-3 font-bold">✗</span>
                    <span>Can’t commit to 24-hour response times on referrals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-500 mr-3 font-bold">✗</span>
                    <span>Are just starting out with no verifiable history</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-500 mr-3 font-bold">✗</span>
                    <span>Won’t meet professional communication or conduct standards</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-500 mr-3 font-bold">✗</span>
                    <span>Prefer anonymous transactions with no accountability</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDING PARTNER CAMPAIGN */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-zinc-950 to-black border-y border-amber-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Image
                src="/ironclad_founder_shield_logo.png"
                alt="IronClad Founding Partner"
                width={160}
                height={160}
                className="w-32 md:w-40 h-auto mx-auto mb-6"
              />
              <Badge className="mb-4 bg-amber-600/15 text-amber-500 border-amber-600/30">
                <Crown className="h-3 w-3 mr-1" />
                Limited Founding Spots Available
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Founding Partner Program
              </h2>
              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
                The first contractors to join the ListWorx network earn a distinction that cannot be purchased later. Founding Partner status is permanent and exclusive.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-10">
              <div className="flex items-start gap-4 p-5 rounded-xl border border-amber-900/30 bg-amber-950/10">
                <Star className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">Permanent Recognition</h3>
                  <p className="text-sm text-zinc-400">Your Founding Partner badge stays on your profile permanently — even as the network grows. This status is never revoked and never available again.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl border border-amber-900/30 bg-amber-950/10">
                <TrendingUp className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">Priority Early Positioning</h3>
                  <p className="text-sm text-zinc-400">As the first members of the network, Founding Partners receive early referral advantage before market saturation. Get established while competition is lowest.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl border border-amber-900/30 bg-amber-950/10">
                <Shield className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">Stronger Network Visibility</h3>
                  <p className="text-sm text-zinc-400">Founding Partners are highlighted across the platform with dedicated badges and enhanced profile presence that sets them apart from future members.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl border border-amber-900/30 bg-amber-950/10">
                <Lock className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">Limited Availability</h3>
                  <p className="text-sm text-zinc-400">Founding Partner status is only available during the network launch phase. Once the window closes, this designation is permanently closed to new members.</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/apply">
                <Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg bg-amber-600 hover:bg-amber-700 text-white">
                  <Award className="mr-2 h-5 w-5" />
                  Apply for Founding Partner Status
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-zinc-500 mt-4">
                Available to qualified contractors during the network launch period only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERSHIP TIERS */}
      <section className="py-16 md:py-20 bg-lw-surface border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-lw-dark mb-4">
                Choose Your Spot in the Network
              </h2>
              <p className="text-lg md:text-xl text-zinc-700 mb-2">
                Flat monthly pricing. No per-lead surprises. Pick the level that matches where your business is headed.
              </p>
              <p className="text-base md:text-lg font-semibold text-lw-dark">
                Your reputation matters. So does ours.
              </p>
              <p className="text-sm text-zinc-600 italic mt-2">
                All Partners must maintain active IronClad Standards compliance to remain in the network.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 rounded-lg shadow-sm hover:shadow-lg transition-all text-center border border-zinc-200 bg-white">
                <div className="text-4xl font-bold text-primary mb-2">$199</div>
                <div className="text-sm text-zinc-600 mb-4">per month</div>
                <h3 className="text-lg font-semibold mb-4 text-lw-dark">Basic Partner</h3>
                <ul className="text-sm text-zinc-700 space-y-2 text-left mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Public profile in the contractor directory</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Eligible for referral matching in your service area</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Standard placement in referral rotation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Credential tracking and compliance tools</span>
                  </li>
                </ul>
                <Link href="/apply" className="block">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                    Apply Now
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 rounded-lg shadow-lg hover:shadow-xl transition-all text-center border-2 border-primary bg-white relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">Most Popular</Badge>
                <div className="text-4xl font-bold text-primary mb-2">$349</div>
                <div className="text-sm text-zinc-600 mb-4">per month</div>
                <h3 className="text-lg font-semibold mb-4 text-lw-dark">Preferred Partner</h3>
                <ul className="text-sm text-zinc-700 space-y-2 text-left mb-6">
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
                    <span>Enhanced visibility with logo in your listing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>IronClad Certified Partner badge</span>
                  </li>
                </ul>
                <Link href="/apply" className="block">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    Apply Now
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 rounded-lg shadow-sm hover:shadow-lg transition-all text-center border border-zinc-200 bg-white">
                <div className="text-4xl font-bold text-primary mb-2">$599</div>
                <div className="text-sm text-zinc-600 mb-4">per month</div>
                <h3 className="text-lg font-semibold mb-4 text-lw-dark">Elite Partner</h3>
                <ul className="text-sm text-zinc-700 space-y-2 text-left mb-6">
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
                <Link href="/apply" className="block">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                    Apply Now
                  </Button>
                </Link>
              </Card>
            </div>

            <p className="text-center text-sm text-zinc-600">
              All plans include credential tracking, compliance monitoring, and referral management tools.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Image src="/Ironclad_Cert_Partner_Final_Logo.png" alt="IronClad Certified Partner" width={120} height={120} className="w-24 h-auto" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Apply to Become an IronClad Partner
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Stop buying leads. Start building a referral pipeline with predictable costs and quality clients. Applications are reviewed within 48 hours.
            </p>
            <Link href="/apply">
              <Button size="lg" className="text-lg px-8 md:px-10 py-6 rounded-lg shadow-lg hover:shadow-xl bg-white text-primary hover:bg-white/90">
                <Award className="mr-2 h-5 w-5" />
                Submit Your Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
