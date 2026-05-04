'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck as CheckCircle, Users, Shield, Zap, Clock, Star, Chrome as Home, TrendingUp, Award, FileText, CircleAlert as AlertCircle, ArrowRight, ThumbsUp, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';

export default function RealtorsPage() {
  return (
    <PageShell surface="dark">
      <Navigation />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-lw-dark/70" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Star className="h-3 w-3 mr-1" />
            Built for Real Estate Professionals
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Refer Contractors<br className="hidden md:block" />
            <span className="text-primary"> With Confidence.</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            ListWorx gives you instant access to vetted, IronClad-certified contractors — for free. Submit one request, receive up to 3 qualified matches, and choose who to contact. No spam. No pressure. Your reputation stays protected.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/request">
              <Button size="lg" className="text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90">
                <Users className="mr-2 h-5 w-5" />
                Request a Contractor — Free
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Free</div>
              <div className="text-sm text-muted-foreground">Always — No Fees, Ever</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">3 Matches</div>
              <div className="text-sm text-muted-foreground">Max Per Request</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{'<'}24h</div>
              <div className="text-sm text-muted-foreground">Contractor Response Time</div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* HOW IT'S DIFFERENT */}
      <section className="py-20 bg-lw-dark border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Not a Directory. Not a Lead Marketplace.
              </h2>
              <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto">
                Random contractor directories give you names. Spammy lead platforms give everyone your contact info. ListWorx gives you a curated shortlist of vetted professionals who have already been approved and are ready to respond.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 bg-lw-dark-card border border-lw-dark-border hover:border-lw-rust transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Stop Cold-Calling Contractors</h3>
                    <p className="text-zinc-300">
                      One request. Up to 3 vetted matches. No calling around. No waiting for callbacks from contractors who may or may not show up. You get qualified professionals — or you hear back from us.
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
                    <h3 className="text-xl font-bold text-white mb-2">Every Contractor Is Verified</h3>
                    <p className="text-zinc-300">
                      Every ListWorx contractor is licensed, insured, and actively meets IronClad Standards. We check credentials before approval and monitor compliance throughout their membership. Refer them knowing your name is protected.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-lw-dark-card border border-lw-dark-border hover:border-lw-rust transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">You're Always in Control</h3>
                    <p className="text-zinc-300">
                      You receive the matches. You decide who to contact. No contractor receives your client's information until you choose to share it. No unsolicited outreach. No spam.
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
                    <h3 className="text-xl font-bold text-white mb-2">Keep Deals on Track</h3>
                    <p className="text-zinc-300">
                      Pre-sale prep, post-inspection repairs, or move-in updates — get qualified contractors on the job fast. Contractors commit to 24-hour response times. No more delays killing your timeline.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Simple enough to do from your phone between appointments.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border-2 border-primary bg-card">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="text-6xl font-bold text-primary/20 mb-4 text-center">01</div>
                <h3 className="text-xl font-bold text-foreground mb-3 text-center">Submit Your Request</h3>
                <p className="text-muted-foreground text-center">
                  Tell us the property location, the service needed, and your timeline. Takes under 2 minutes. Completely free.
                </p>
              </Card>

              <Card className="p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border border-border bg-card">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div className="text-6xl font-bold text-primary/20 mb-4 text-center">02</div>
                <h3 className="text-xl font-bold text-foreground mb-3 text-center">Receive Up to 3 Matches</h3>
                <p className="text-muted-foreground text-center">
                  We match you with up to 3 IronClad-certified contractors based on trade, location, and availability. No bidding wars, no junk lists.
                </p>
              </Card>

              <Card className="p-8 rounded-lg shadow-sm hover:shadow-lg transition-all border border-border bg-card">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                  <ThumbsUp className="h-8 w-8 text-primary" />
                </div>
                <div className="text-6xl font-bold text-primary/20 mb-4 text-center">03</div>
                <h3 className="text-xl font-bold text-foreground mb-3 text-center">Choose Who to Contact</h3>
                <p className="text-muted-foreground text-center">
                  Review your matches, reach out to whoever fits best, and get the job scheduled. Contractors must respond within 24 hours.
                </p>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Link href="/request">
                <Button size="lg" className="text-lg px-10 py-6 rounded-lg shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90">
                  Submit a Request Now — Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                When Realtors Use ListWorx
              </h2>
              <p className="text-xl text-muted-foreground">
                From listing prep to closing day — reliable contractors for every stage of the transaction.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border border-border hover:border-primary transition-all">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center">
                  <Home className="h-5 w-5 text-primary mr-2" />
                  Pre-Sale Preparation
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>• Flooring repairs, refinishing, and replacement</li>
                  <li>• Interior and exterior painting</li>
                  <li>• Kitchen and bath cosmetic updates</li>
                  <li>• Landscaping and curb appeal improvements</li>
                </ul>
              </Card>

              <Card className="p-6 border border-border hover:border-primary transition-all">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center">
                  <AlertCircle className="h-5 w-5 text-primary mr-2" />
                  Post-Inspection Repairs
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>• HVAC repairs and system replacement</li>
                  <li>• Plumbing fixes and code corrections</li>
                  <li>• Electrical work and panel upgrades</li>
                  <li>• Roof repairs, flashing, and gutter work</li>
                </ul>
              </Card>

              <Card className="p-6 border border-border hover:border-primary transition-all">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  Buyer Move-In Services
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>• Deep cleaning and carpet cleaning</li>
                  <li>• Lock rekeying and security updates</li>
                  <li>• Appliance installation and hookup</li>
                  <li>• Touch-up work and minor repairs</li>
                </ul>
              </Card>

              <Card className="p-6 border border-border hover:border-primary transition-all">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  Emergency Situations
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>• Water damage and mold remediation</li>
                  <li>• Emergency plumbing and leak repair</li>
                  <li>• Electrical emergencies and outages</li>
                  <li>• Storm damage and structural issues</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IRONCLAD */}
      <section className="py-16 bg-lw-dark border-y border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <Image src="/Ironclad_Cert_Partner_Final_Logo.png" alt="IronClad Certified" width={80} height={80} className="w-16 h-auto" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What IronClad Certification Means for You
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                When you refer an IronClad Partner, you're not guessing. You know exactly what standards they've agreed to and are held accountable for.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Shield, title: 'License Verified', desc: 'State contractor license confirmed and tracked' },
                { icon: Award, title: 'Insurance Current', desc: 'Active general liability and workers comp required' },
                { icon: Clock, title: '24-Hour Response', desc: 'Every referral must be acknowledged within a day' },
                { icon: CheckCircle, title: 'Standards Enforced', desc: 'Non-compliance means removal from the network' },
              ].map((item) => (
                <Card key={item.title} className="p-5 text-center border border-border hover:border-primary hover:shadow-md transition-all">
                  <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/ironclad">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Read the Full IronClad Standards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Award className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              It's Free. Start Using It Today.
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              No membership fees. No per-request charges. No hidden costs. Contractors pay to be in the network — you get vetted matches at zero cost. Every request, every time.
            </p>
            <Link href="/request">
              <Button size="lg" className="text-lg px-10 py-6 rounded-lg shadow-lg hover:shadow-xl bg-white text-primary hover:bg-white/90">
                Submit Your First Request — Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
