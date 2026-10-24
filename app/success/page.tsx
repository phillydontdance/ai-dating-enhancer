"use client";

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'headshotly_uploaded_images';

export default function SuccessPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          const poll = async () => {
            try {
              const response = await fetch('/api/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: parsed }),
              });

              const data = (await response.json()) as {
                ok?: boolean;
                status?: string;
                images?: string[];
                error?: string;
              };

              if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Status check failed.');
              }

              if (data.status === 'completed' && Array.isArray(data.images) && data.images.length) {
                setGeneratedImages(data.images);
                setIsProcessing(false);
                setError(null);
                return;
              }

              setTimeout(poll, 5000);
            } catch (pollError) {
              setError(pollError instanceof Error ? pollError.message : 'Status check failed.');
              setIsProcessing(false);
            }
          };

          void poll();
        }
      } catch {
        setError('No uploaded images found. Please restart the upload flow.');
        setIsProcessing(false);
      }
    } else {
      setError('No uploaded images found. Please restart the upload flow.');
      setIsProcessing(false);
    }
  }, []);

  const handleDownloadAll = () => {
    if (!generatedImages.length) return;
    generatedImages.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `headshot-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const handleEmailResend = async () => {
    if (!email.trim() || !generatedImages.length) return;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          images: generatedImages,
          subject: 'Your 10 Professional Headshots Are Ready',
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to send email.');
      }

      alert('Email sent successfully.');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send email.');
    }
  };

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-2xl">✓</div>
          <h1 className="text-3xl font-semibold tracking-[-0.06em]">Payment successful</h1>
        </div>

        {isProcessing ? (
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
            <h2 className="text-2xl font-semibold">Processing...</h2>
            <p className="mt-3 text-zinc-300">AI is enhancing your photos. This takes 2-3 minutes.</p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
            <p className="mt-3 text-red-100">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!isProcessing && !error && generatedImages.length > 0 ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your 10 professional headshots</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadAll}
                  className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
                >
                  Download All
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
                >
                  Start Over
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {generatedImages.map((url, index) => (
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

            <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-5">
              <label className="mb-2 block text-sm font-medium text-zinc-300">Email address</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-pink-500"
                />
                <button
                  onClick={handleEmailResend}
                  className="rounded-full bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Email Me
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
