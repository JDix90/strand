import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Languini',
  description: 'Practice Russian with focused lessons',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
