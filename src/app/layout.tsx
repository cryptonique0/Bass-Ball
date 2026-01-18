import type { Metadata } from 'next';
import { PrivyProvider } from '@privy-io/react-auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bass Ball - Web3 Football Game',
  description:
    'Play competitive football on Base chain. Trustless verification, fair play, and gasless NFT rewards.',
  viewport: 'width=device-width, initial-scale=1',
  keywords: ['game', 'web3', 'base', 'nft', 'football', 'blockchain'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100">
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'default-app-id'}
          config={{
            loginMethods: ['email', 'wallet'],
            appearance: {
              theme: 'dark',
              accentColor: '#0066FF',
              logo: 'https://your-logo-url.png',
            },
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
              requireUserPasswordOnCreate: false,
            },
          }}
        >
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
