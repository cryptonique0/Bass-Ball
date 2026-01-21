import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';
import { ErrorHandlingProvider } from '@/components/ErrorHandlingProvider';

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
      <body>
        <ErrorHandlingProvider>
          <Web3Provider>{children}</Web3Provider>
        </ErrorHandlingProvider>
      </body>
    </html>
  );
}
