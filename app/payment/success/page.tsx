"use client";

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, LoaderCircle } from 'lucide-react';

const STORAGE_KEY = 'headshotly_uploaded_images';

export default function PaymentSuccessPage() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('session_id') || '';
  }, []);

  useEffect(() => {
    const loadImages = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          if (Array.isArray(parsed) && parsed.length) {
            setImageUrls(parsed);
            return;
          }
        }
      } catch {
        // ignore parse issues and fall back to Stripe metadata
      }

      if (!sessionId) {
        setError('No uploaded images were found for this order.');
        setLoading(false);
        return;
      }

      const fallback = sessionStorage.getItem(`stripe_meta_${sessionId}`);
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback) as { imageUrls?: string[] };
          if (Array.isArray(parsed.imageUrls) && parsed.imageUrls.length) {
            setImageUrls(parsed.imageUrls);
            return;
          }
        } catch {
          // ignore malformed metadata
        }
      }

      setError('No uploaded images were found for this order.');
      setLoading(false);
    };

    loadImages();
  }, [sessionId, retryKey]);

  useEffect(() => {
    if (!imageUrls.length || !loading) return;

    let cancelled = false;

    const runEnhancement = async () => {
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imageUrls,
            prompt:
              'professional headshot, studio lighting, blurred office background, photorealistic, high quality, sharp focus',
          }),
        });

        const data = (await response.json()) as {
          ok?: boolean;
          images?: string[];
          error?: string;
          details?: Array<{ message: string }>;
        };

        if (!response.ok || !data.ok || !Array.isArray(data.images) || !data.images.length) {
          throw new Error(data.error || data.details?.[0]?.message || 'The image generation step failed.');
        }

        if (!cancelled) {
          setGeneratedImages(data.images);
          setError(null);
          setLoading(false);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'The image generation step failed. Please try again.',
          );
          setLoading(false);
        }
      }
    };

    void runEnhancement();

    return () => {
      cancelled = true;
    };
  }, [imageUrls, loading]);

  useEffect(() => {
    try {
      window.localStorage.setItem('headshotly_paid', 'true');
    } catch {
      // ignore storage issues
    }
  }, []);

  const handleRetry = () => {
    setError(null);
    setGeneratedImages([]);
    setLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  const handleDownloadAll = async () => {
    if (!generatedImages.length) return;

    generatedImages.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `headshotly-enhanced-${index + 1}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-12 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 text-center shadow-[0_12px_24px_var(--shadow)] sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--success)]">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Checkout complete</h1>
          <p className="mt-3 text-[var(--muted)]">Your order is confirmed. We are polishing the selected photos now.</p>
        </div>

        {loading && !error ? (
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-[0_12px_24px_var(--shadow)]">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
              <LoaderCircle className="h-7 w-7 animate-spin" strokeWidth={1.8} />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Applying the final photo adjustments</h2>
            <p className="mt-4 text-[var(--muted)]">This usually takes a minute or two.</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-[#d8b3ad] bg-[var(--error-bg)] p-8 text-center shadow-[0_12px_24px_var(--shadow)]">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">We could not finish this step</h2>
            <p className="mt-3 text-[var(--error-text)]">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error && generatedImages.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Your edited photos</h2>
                <p className="mt-2 text-[var(--muted)]">{generatedImages.length} versions are ready to download.</p>
              </div>
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                <Download className="h-4 w-4" strokeWidth={1.9} />
                Download all
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {generatedImages.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] shadow-[0_12px_24px_var(--shadow)]">
                  <img src={url} alt={`Generated headshot ${index + 1}`} className="h-80 w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Version {index + 1}</span>
                    <a
                      href={url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]"
                    >
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
