"use client";

import { useEffect, useMemo, useState } from 'react';

const STATUS_POLL_MS = 5000;

export default function SuccessPage() {
  const [status, setStatus] = useState<'processing' | 'complete' | 'failed'>('processing');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextSessionId = params.get('session_id') || '';
    setSessionId(nextSessionId);

    if (!nextSessionId) {
      setError('Missing Stripe session. Please return from checkout and try again.');
      setStatus('failed');
      return;
    }

    let isMounted = true;

    const poll = async () => {
      try {
        const response = await fetch(`/api/check-status?session_id=${encodeURIComponent(nextSessionId)}`);
        const data = (await response.json()) as {
          status?: string;
          images?: string[];
          error?: string;
        };

        if (!isMounted) return;

        const nextStatus = (data.status === 'complete' || data.status === 'processing' || data.status === 'failed')
          ? data.status
          : 'processing';

        setStatus(nextStatus);
        setImages(Array.isArray(data.images) ? data.images : []);
        setError(data.error || null);

        if (nextStatus === 'complete' || nextStatus === 'failed') {
          return;
        }

        window.setTimeout(poll, STATUS_POLL_MS);
      } catch (pollError) {
        if (!isMounted) return;
        setStatus('failed');
        setError(pollError instanceof Error ? pollError.message : 'Unable to check generation status.');
      }
    };

    void poll();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayImages = useMemo(() => images.slice(0, 10), [images]);

  const handleDownloadAll = () => {
    if (!displayImages.length) return;

    displayImages.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `headshot-${index + 1}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-2xl">✓</div>
          <h1 className="text-3xl font-semibold tracking-[-0.06em]">Payment successful</h1>
          {sessionId ? <p className="mt-3 text-sm text-zinc-400">Session: {sessionId}</p> : null}
        </div>

        {status === 'processing' ? (
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
            <h2 className="text-2xl font-semibold">Processing your headshots...</h2>
            <p className="mt-3 text-zinc-300">We are generating your final 10 headshots now.</p>
          </div>
        ) : null}

        {error && status !== 'complete' ? (
          <div className="mt-8 rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
            <p className="mt-3 text-red-100">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
            >
              Restart
            </button>
          </div>
        ) : null}

        {status === 'complete' && displayImages.length > 0 ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your 10 professional headshots</h2>
              </div>
              <button
                onClick={handleDownloadAll}
                className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
              >
                Download All
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {displayImages.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/80">
                  <img src={url} alt={`Generated headshot ${index + 1}`} className="h-72 w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">#{index + 1}</span>
                    <a href={url} download target="_blank" rel="noreferrer" className="text-sm font-medium text-pink-200">
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
