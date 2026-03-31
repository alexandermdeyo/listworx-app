import Navigation from '@/components/Navigation';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last Updated: March 14, 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-4">
              ListWorx LLC ("ListWorx," "we," "us," or "our") operates listworx.co (the "Site") and the associated referral matching service (the "Service"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Site, submit a job request, apply as a contractor, subscribe to a tier, or otherwise use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li><strong>Personal Information you provide:</strong> Name, email, phone, address/property location (from job requests), company name/details (from contractor applications), license/insurance documents (for vetting), payment info (processed via Stripe – we do not store full card details).</li>
              <li><strong>Automatically Collected:</strong> IP address, browser type, device info, pages visited, referral source, cookies/session data for functionality/analytics.</li>
              <li><strong>From Third Parties:</strong> None currently, but may include verification services for licenses/insurance in the future.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>To provide and improve the Service:</strong> Match job requests to contractors (exactly 3 per request based on location, trade/specialty, tier weighting), process subscriptions/payments, vet applicants.</li>
              <li><strong>Communicate:</strong> Send confirmations, match notifications, approval emails, support responses.</li>
              <li><strong>Admin/Compliance:</strong> Verify licenses/insurance, prevent fraud, comply with laws (e.g., tax reporting for subscriptions).</li>
              <li><strong>Analytics:</strong> Understand usage to enhance matching algorithm and user experience (aggregated/anonymized where possible).</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>We do not sell personal information.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Sharing Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>With Matched Parties:</strong> Job request details (name, phone, email, job description, location) shared with the 3 selected contractors (and vice versa if they respond). Contractors' profiles (name, company, phone, specialties, badges) shared with requesters.</li>
              <li><strong>Service Providers:</strong> Stripe (payments), hosting (Netlify/Supabase), email delivery, analytics tools – bound by confidentiality.</li>
              <li><strong>Legal Requirements:</strong> If required by law, subpoena, or to protect rights/safety.</li>
              <li><strong>Business Transfers:</strong> In merger/acquisition/sale scenarios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
            <p className="text-muted-foreground">
              We use industry-standard measures (encryption in transit/rest where applicable, access controls) to protect data. However, no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Your Rights & Choices</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Access/update/delete your data:</strong> Contact adeyo@listworx.co.</li>
              <li><strong>Opt-out:</strong> Unsubscribe from emails, delete account (if implemented).</li>
              <li><strong>Cookies:</strong> Manage via browser settings.</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>For California residents (CCPA/CPRA):</strong> Rights to know, delete, opt-out of sale (we do not sell data). Submit requests to adeyo@listworx.co.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Service not directed to children under 13 (or 16 in some jurisdictions). We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this policy; changes posted here with updated date. Continued use constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              For questions about this Privacy Policy, please contact us:
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
