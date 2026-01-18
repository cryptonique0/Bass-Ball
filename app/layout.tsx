import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bass Ball - Football on Base Chain',
  description: 'Play football with blockchain-powered NFT players on the Base Chain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
