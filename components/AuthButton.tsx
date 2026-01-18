import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export const AuthButton = () => {
  const { user, login, logout } = usePrivy();
  const { address } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();

  if (!user) {
    return (
      <button
        onClick={() => login()}
        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold text-white transition transform hover:scale-105"
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>
      <button
        onClick={() => {
          logout();
          disconnect();
        }}
        className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-white transition"
      >
        Logout
      </button>
    </div>
  );
};
