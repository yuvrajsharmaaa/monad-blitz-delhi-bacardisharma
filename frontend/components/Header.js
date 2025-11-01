'use client';

import { useWallet } from '../hooks/useWallet';

export default function Header() {
  const { account, isConnected, connectWallet, disconnectWallet } = useWallet();
  const backendOnly = process.env.NEXT_PUBLIC_BACKEND_ONLY === 'true';

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SONAD" className="h-10 w-10" />
          <h1 className="text-2xl font-bold text-primary">SONAD</h1>
        </div>
        {!backendOnly && (
          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <span className="text-sm text-gray-400">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

