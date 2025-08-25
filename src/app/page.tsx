'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to the play page
    router.replace('/play');
  }, [router]);

  // Show a loading message while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Alpha Drums</h1>
        <p className="text-gray-600">Redirecting to player...</p>
      </div>
    </div>
  );
}
