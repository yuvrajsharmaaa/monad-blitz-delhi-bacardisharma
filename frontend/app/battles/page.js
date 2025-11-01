'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BattlesPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/?tab=battles');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to battles...</p>
    </div>
  );
}

