'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-slate-400 text-sm mb-4">{error.message || 'An unexpected error occurred'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-cyan-500 text-slate-950 font-semibold text-xs rounded-lg"
      >
        Try again
      </button>
    </div>
  );
}
