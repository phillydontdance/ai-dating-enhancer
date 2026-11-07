"use client";

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, LoaderCircle } from 'lucide-react';

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
      setError('No Stripe session was found. Start the checkout again and return to this page.');
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
        setError(pollError instanceof Error ? pollError.message : 'Unable to check the image status right now.');
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
    <main className="min-h-screen bg-[var(--background)] px-4 py-12 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-[0_12px_24px_var(--shadow)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--success)]">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Checkout complete</h1>
          {sessionId ? <p className="mt-3 text-sm text-[var(--muted)]">Session: {sessionId}</p> : null}
        </div>

        {status === 'processing' ? (
          <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-[0_12px_24px_var(--shadow)]">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
              <LoaderCircle className="h-7 w-7 animate-spin" strokeWidth={1.8} />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Preparing your final headshots</h2>
            <p className="mt-3 text-[var(--muted)]">We are applying the final edits and packaging your selected images.</p>
          </div>
        ) : null}

        {error && status !== 'complete' ? (
          <div className="mt-8 rounded-[1.5rem] border border-[#d8b3ad] bg-[var(--error-bg)] p-8 text-center shadow-[0_12px_24px_var(--shadow)]">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">We could not finish this order</h2>
            <p className="mt-3 text-[var(--error-text)]">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Start again
            </button>
          </div>
        ) : null}

        {status === 'complete' && displayImages.length > 0 ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Your final headshots</h2>
              </div>
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                <Download className="h-4 w-4" strokeWidth={1.9} />
                Download all
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {displayImages.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] shadow-[0_12px_24px_var(--shadow)]">
                  <img src={url} alt={`Generated headshot ${index + 1}`} className="h-72 w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">#{index + 1}</span>
                    <a href={url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]">
                      <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
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
