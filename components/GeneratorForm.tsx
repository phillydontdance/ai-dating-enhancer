"use client";

import { ChangeEvent, useState } from "react";

const backgroundOptions = [
  "Warm Gray",
  "Studio White",
  "Muted Blush",
  "Deep Charcoal",
  "Soft Marble",
];

const downloadImage = async (url: string, index: number) => {
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

export function GeneratorForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [background, setBackground] = useState("Warm Gray");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [failedCount, setFailedCount] = useState(0);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFiles(validFiles);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedFiles.length) {
      setError("Please upload at least 1 image first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("images", file));
      formData.append("background", background);

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

  const handleDownloadAll = async () => {
    if (!images.length) return;

    for (const [index, imageUrl] of images.entries()) {
      await downloadImage(imageUrl, index);
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
              onClick={handleDownloadAll}
              className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-400"
            >
              Download All
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/80"
              >
                <img src={url} alt={`Headshot ${index + 1}`} className="h-80 w-full object-cover" />
                <div className="flex items-center justify-between gap-3 p-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                    #{index + 1}
                  </span>
                  <button
                    onClick={() => void downloadImage(url, index)}
                    className="text-sm font-medium text-pink-200 hover:text-pink-100"
                  >
                    Download
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
