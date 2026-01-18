import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export const Navigation = () => {
  const router = useRouter();
  const { address } = useAccount();

  const isActive = (path: string) => router.pathname === path;

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/match', label: 'Play' },
    { href: '/leaderboard', label: 'Rankings' },
  ];

  return (
    <nav className="bg-slate-900/50 border-b border-slate-700 sticky top-0 z-50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            🎮 Bass Ball
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-semibold transition ${
                  isActive(item.href)
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Profile Link */}
          {address && (
            <Link
              href={`/profile/${address}`}
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 hover:text-purple-200 transition"
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
