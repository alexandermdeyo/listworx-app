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
        url: 'https://listworx.co/brand/listworx-og.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://listworx.co/brand/listworx-og.png',
        width: 1200,
        height: 630,
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
