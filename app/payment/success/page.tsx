"use client";

import { useEffect, useMemo, useState } from 'react';

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

      setError('No uploaded images were found for this order. Save the uploaded image URLs in localStorage under "headshotly_uploaded_images" or include them in Stripe metadata before redirecting.');
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
          throw new Error(data.error || data.details?.[0]?.message || 'AI enhancement failed.');
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
              : 'AI enhancement failed. Please try again.',
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
    <main className="min-h-screen bg-[#090909] px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-2xl">✓</div>
          <h1 className="text-3xl font-semibold tracking-[-0.06em]">Payment successful</h1>
          <p className="mt-3 text-zinc-300">Your order is confirmed. We’re enhancing your selected photos now.</p>
        </div>

        {loading && !error ? (
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
            <h2 className="text-2xl font-semibold">AI is enhancing your photos...</h2>
            <p className="mt-4 text-zinc-300">This takes 2-3 minutes. Please keep this page open.</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
            <p className="mt-3 text-red-100">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-6 rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!loading && !error && generatedImages.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your enhanced photos</h2>
                <p className="mt-2 text-zinc-300">{generatedImages.length} variations ready for review.</p>
              </div>
              <button
                onClick={handleDownloadAll}
                className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
              >
                Download All
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {generatedImages.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/80">
                  <img src={url} alt={`Generated headshot ${index + 1}`} className="h-80 w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">Variation {index + 1}</span>
                    <a
                      href={url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-pink-200 hover:text-pink-100"
                    >
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
