import Navigation from '@/components/Navigation';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last Updated: March 14, 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-4">
              These Terms of Service ("Terms") govern your access to and use of listworx.co and the ListWorx referral matching Service ("Service"), operated by ListWorx LLC ("ListWorx," "we," "us," or "our"). By accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Eligibility</h2>
            <p className="text-muted-foreground">
              You must be 18+ (or legal age in your jurisdiction) and capable of forming binding contracts. Contractors must provide accurate licensing/insurance info and consent to vetting.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. The Service</h2>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">For Realtors/Homeowners (Requesters)</h3>
            <p className="text-muted-foreground mb-4">
              Free submission of job requests. We match with exactly 3 vetted contractors based on location (county/state), specialty/trades, availability, and tier weighting. No guarantee of hiring, response, or work quality.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">For Contractors (Partners)</h3>
            <p className="text-muted-foreground mb-4">
              Subscription tiers (Basic $199/mo, Preferred $349/mo, Elite $599/mo – plus add-ons) for directory listing, referral eligibility, priority weighting, badges, logos, video perks (annual Elite only). We vet applications (license/insurance verification); approval not guaranteed.
            </p>
            <p className="text-muted-foreground mb-4">
              Matching algorithm uses submitted data; we do not guarantee leads, volume, or conversions.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">IronClad Standards</h3>
            <p className="text-muted-foreground">
              Contractors agree to 24h response, written estimates &gt;$500, professional conduct. Violations may result in suspension.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Subscriptions & Payments</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Billed via Stripe (monthly/annual). Auto-renew unless canceled.</li>
              <li>No refunds except as required by law.</li>
              <li>Territory Lock/Spotlight add-ons subject to availability/fairness rules (e.g., limited slots per trade/county).</li>
              <li>You authorize recurring charges.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. User Content & Responsibilities</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>You grant us a worldwide, non-exclusive license to use submitted content (job details, profiles, documents) for Service operation.</li>
              <li>You represent info is accurate; contractors warrant valid licenses/insurance.</li>
              <li><strong>Prohibited:</strong> Fraud, spam, illegal activity, false claims. We may suspend/terminate for violations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. No Warranties / Limitation of Liability</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Service provided "as is" without warranties. We do not guarantee matches, contractor performance, job outcomes, or no interruptions.</li>
              <li>We are not a party to contracts between requesters and contractors; no liability for disputes, damages, or losses arising from referrals/work.</li>
              <li>Max liability limited to fees paid in prior 12 months (or $100 if none). No consequential/indirect damages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify us against claims arising from your use, content, or violations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend/terminate access anytime for violations. You may cancel subscriptions (effects at end of billing period).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Governing Law / Disputes</h2>
            <p className="text-muted-foreground">
              Tennessee law applies. Disputes resolved in Gallatin, TN courts or arbitration if elected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update; continued use = acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact</h2>
            <p className="text-muted-foreground mb-4">
              Questions about these Terms? Contact us:
            </p>
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
              <p className="text-foreground font-semibold mb-2">ListWorx LLC</p>
              <p className="text-muted-foreground">2147 Springdale Ln F104</p>
              <p className="text-muted-foreground mb-3">Gallatin, TN 37066</p>
              <p className="text-muted-foreground">
                Email:{' '}
                <a href="mailto:adeyo@listworx.co" className="text-orange-600 hover:text-orange-700 hover:underline">
                  adeyo@listworx.co
                </a>
              </p>
              <p className="text-muted-foreground">
                Phone:{' '}
                <a href="tel:615-362-4996" className="text-orange-600 hover:text-orange-700 hover:underline">
                  615-362-4996
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
