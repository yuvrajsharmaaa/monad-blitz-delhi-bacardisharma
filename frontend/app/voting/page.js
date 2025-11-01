'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VotingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/?tab=voting');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to voting...</p>
    </div>
  );
}
