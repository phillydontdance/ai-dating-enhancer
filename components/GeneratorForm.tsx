"use client";

import imageCompression from "browser-image-compression";
import { ChangeEvent, useEffect, useState } from "react";

const backgroundOptions = [
  "Warm Gray",
  "Studio White",
  "Muted Blush",
  "Deep Charcoal",
  "Soft Marble",
];

const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(
      `Compressed ${file.size / 1024 / 1024}MB to ${compressedFile.size / 1024}KB`,
    );
    return compressedFile;
  } catch (error) {
    console.error("Compression error:", error);
    return file;
  }
};

export function GeneratorForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [background, setBackground] = useState("Warm Gray");
  const [profession, setProfession] = useState("Product Manager");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    try {
      setIsPaid(window.localStorage.getItem("headshotly_paid") === "true");
    } catch {
      setIsPaid(false);
    }
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (!validFiles.length) {
      setError("Please choose valid image files.");
      return;
    }

    if (validFiles.length > 3) {
      setError("Please upload between 1 and 3 images.");
      return;
    }

    const compressedFiles = await Promise.all(validFiles.map((file) => compressImage(file)));

    const oversized = compressedFiles.filter((file) => file.size > 2 * 1024 * 1024);
    if (oversized.length > 0) {
      alert("Please use a smaller image");
      setError("Please use a smaller image");
      setSelectedFiles([]);
      return;
    }

    setSelectedFiles(compressedFiles);
    setError(null);
  };

  const handleDownloadImage = async (url: string, index: number) => {
    if (!isPaid) {
      setError("Unlock downloads with Stripe before saving any generated headshots.");
      return;
    }

    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `headshot-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleDownloadAll = async () => {
    if (!images.length) return;
    if (!isPaid) {
      setError("Unlock downloads with Stripe before saving all generated headshots.");
      return;
    }

    for (const [index, imageUrl] of images.entries()) {
      await handleDownloadImage(imageUrl, index);
    }
  };

  const handleUnlockWithStripe = async () => {
    if (!images.length) {
      setError("Generate headshots before unlocking downloads.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email so the Stripe checkout can continue.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setError(null);

      const response = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: 1500,
          imageUrls: images,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Stripe checkout could not be started.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Stripe checkout could not be started.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFiles.length) {
      setError("Please upload at least 1 image first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsPaid(false);

      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("images", file));
      formData.append("background", background);
      formData.append("profession", profession);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success?: boolean;
        images?: string[];
        count?: number;
        error?: string;
      };

      if (!response.ok || !data.success || !Array.isArray(data.images) || !data.images.length) {
        throw new Error(
          data.error || "AI generation failed. Please try with a clearer photo.",
        );
      }

      setImages(data.images);
      setFailedCount(Math.max(0, 10 - data.count!));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "AI generation failed. Please try with a clearer photo.",
      );
      setImages([]);
      setFailedCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-pink-200">Headshot Generator</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Upload a selfie and generate professional headshots
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-dashed border-pink-500/40 bg-pink-500/[0.04] p-6">
            <input
              id="generator-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="generator-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-white/10 bg-black/20 px-6 py-12 text-center transition hover:border-pink-500/50 hover:bg-black/30"
            >
              <div className="mb-4 rounded-full bg-pink-500/15 p-4 text-pink-300">↑</div>
              <div className="text-xl font-medium text-white">Choose your selfie photos</div>
              <div className="mt-2 text-sm text-zinc-400">
                Upload 1–3 clear front-facing photos for best results.
              </div>
            </label>
          </div>

          {selectedFiles.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-sm text-zinc-300">Selected files</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                  >
                    {file.name.slice(0, 18)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Background</label>
            <select
              value={background}
              onChange={(event) => setBackground(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-pink-500"
            >
              {backgroundOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="profession" className="mb-2 block text-sm text-zinc-300">
              Profession
            </label>
            <input
              id="profession"
              type="text"
              value={profession}
              onChange={(event) => setProfession(event.target.value)}
              placeholder="e.g. Product Manager"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-zinc-300">
              Email for payment and delivery
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-pink-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating your 10 professional headshots... This takes 2-3 minutes" : "Generate Headshots"}
          </button>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Ready output</div>
          <div className="mt-4 text-3xl font-semibold text-white">{images.length || 0}</div>
          <div className="mt-2 text-sm text-zinc-300">headshots generated</div>
          {images.length > 0 && !isPaid ? (
            <button
              onClick={() => void handleUnlockWithStripe()}
              disabled={checkoutLoading}
              className="mt-5 w-full rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {checkoutLoading ? "Redirecting to Stripe..." : "Unlock downloads — $15"}
            </button>
          ) : null}
          {failedCount > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              {failedCount} failed — retry for better results.
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
          <h2 className="text-2xl font-semibold text-white">Generating your 10 professional headshots...</h2>
          <p className="mt-3 text-zinc-300">This takes 2-3 minutes.</p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-[1.5rem] border border-red-500/30 bg-red-500/10 p-5 text-center text-red-100">
          {error}
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleGenerate}
              className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {!loading && images.length > 0 ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Your headshots</h2>
            </div>
            <button
              onClick={() => void handleDownloadAll()}
              className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isPaid}
            >
              {isPaid ? "Download All" : "Unlock to Download"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/80"
              >
                <div className="relative">
                  <img
                    src={url}
                    alt={`Headshot ${index + 1}`}
                    draggable={false}
                    onContextMenu={(event) => event.preventDefault()}
                    className={`h-80 w-full object-cover select-none ${!isPaid ? 'grayscale-[0.15] brightness-75 blur-[1px]' : ''}`}
                    style={{ WebkitUserSelect: 'none' }}
                  />
                  {!isPaid ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <span className="rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                          Paid preview
                        </span>
                        <span className="text-xs text-zinc-200">Unlock for $15 to download</span>
                      </div>
                    </div>
                  ) : null}
                  {!isPaid ? (
                    <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80">
                      Headshotly
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                    #{index + 1}
                  </span>
                  <button
                    onClick={() => void handleDownloadImage(url, index)}
                    className="text-sm font-medium text-pink-200 hover:text-pink-100 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!isPaid}
                  >
                    {isPaid ? "Download" : "Locked"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
