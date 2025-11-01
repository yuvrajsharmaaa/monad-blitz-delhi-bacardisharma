import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const chainRequestPending = useRef(false);

  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // Avoid full page reload on chain changes to prevent switch spam
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install a Monad-compatible wallet');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      // Determine desired chain using env or RPC probe (prefers RPC's actual chainId)
      const rpcUrlEnv = process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'http://127.0.0.1:8545';
      let desiredChainId = process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || '31337';
      try {
        const rpcNet = await new ethers.JsonRpcProvider(rpcUrlEnv).getNetwork();
        if (rpcNet?.chainId) {
          desiredChainId = rpcNet.chainId.toString();
        }
      } catch (e) {
        // If probing RPC fails, fall back to env/default
      }

      const currentChainId = await provider.getNetwork().then(n => n.chainId.toString());
      
      if (currentChainId !== desiredChainId) {
        // Skip if another chain request is already pending to avoid -32002 errors
        if (chainRequestPending.current) {
          console.log('Chain request already pending, skipping...');
          return;
        }

        chainRequestPending.current = true;
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${parseInt(desiredChainId, 10).toString(16)}` }],
          });
        } catch (switchError) {
          // If the chain has not been added to the wallet, add it first
          if (switchError?.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${parseInt(desiredChainId, 10).toString(16)}`,
                  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Local Hardhat',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: [rpcUrlEnv],
                  blockExplorerUrls: [],
                }],
              });
            } catch (addErr) {
              // Silently handle -32002 (request already pending) and -32603 (already processing)
              if (addErr?.code !== -32002 && addErr?.code !== -32603) {
                console.error('Error adding chain:', addErr);
              }
            }
          } else if (switchError?.code !== -32002 && switchError?.code !== -32603) {
            console.error('Error switching chain:', switchError);
          }
        } finally {
          chainRequestPending.current = false;
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      // Do not auto-reconnect to avoid repeated chain switch prompts
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = async (_chainId) => {
    // Recreate provider and signer without reloading to prevent loops
    try {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
      try {
        const signer = await provider.getSigner();
        setSigner(signer);
        const address = await signer.getAddress();
        setAccount(address);
        setIsConnected(true);
      } catch {
        // Not connected
        setSigner(null);
        setIsConnected(false);
      }
    } catch (e) {
      console.error('Error handling chain change:', e);
    }
  };

  return {
    account,
    provider,
    signer,
    isConnected,
    connectWallet,
    disconnectWallet,
  };
}

