import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Hyper Vision Agent',
  description: 'High-performance stateless C++ Chromium headless browser engine with CDP protocol automation.',
  openGraph: {
    title: 'Hyper Vision Agent',
    description: 'High-performance stateless C++ Chromium headless browser engine with CDP protocol automation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hyper Vision Agent',
    description: 'High-performance stateless C++ Chromium headless browser engine with CDP protocol automation.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
