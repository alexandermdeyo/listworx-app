import './globals.css';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'ListWorx - IronClad Contractors. Trusted by Realtors. Chosen by Homeowners.',
  description: 'Connect with vetted, licensed, and insured contractors who meet our IronClad Standards. Quality network for Realtors and Homeowners.',
  icons: {
    icon: '/LW_Logo.png',
  },
  openGraph: {
    images: [
      {
        url: 'https://listworx.co/Listworx_wordmark_Tag_logo.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://listworx.co/Listworx_wordmark_Tag_logo.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
