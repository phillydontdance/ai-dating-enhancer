"use client";

import imageCompression from "browser-image-compression";
import mammoth from "mammoth";
import { ChangeEvent, useEffect, useState } from "react";

const backgroundOptions = [
  "Warm Gray",
  "Studio White",
  "Muted Blush",
  "Deep Charcoal",
  "Soft Marble",
];

const ASPECT_RATIO = "4:5";

const normalizeCvText = (rawText: string) =>
  rawText
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\t+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/^(?:Page\s*\d+\s*(?:of\s*\d+)?|CV|Resume|Curriculum Vitae)\s*$/gim, "")
    .trim();

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

const buildProfessionalCvText = (rawCvText: string) => {
  const normalized = normalizeCvText(rawCvText);
  if (!normalized) {
    return "Professional CV draft\n\nAdd your work history, skills, and achievements to generate a polished CV outline.";
  }

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] || "Professional Candidate";
  const titleMatch = firstLine.match(/(?:product manager|software engineer|marketing manager|data analyst|designer|consultant|operations manager|project manager|sales manager|customer success manager|account manager|business analyst|developer|manager|specialist)/i);
  const role = titleMatch ? titleMatch[0].replace(/\b\w/g, (character) => character.toUpperCase()) : "Professional";

  const sentences = normalized
    .replace(/\s+/g, " ")
    .split(/[.\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 8);

  const skills = Array.from(
    new Set(
      normalized
        .match(/\b(?:leadership|strategy|analytics|project management|stakeholder management|sales|marketing|operations|customer service|communication|team leadership|research|design|finance|ux|data|python|javascript|typescript|excel|sql|negotiation|planning|execution|delivery|problem solving|product strategy|roadmapping|partnerships|reporting|presentation|research|market analysis|crm|agile|scrum|kpis|testing|implementation|training|mentoring)\b/gi) ?? [],
    ),
  );

  const experienceLines = sentences.length
    ? sentences
        .map((sentence) => `- ${sentence}`)
        .slice(0, 4)
        .join("\n")
    : "- Led cross-functional projects and delivered measurable outcomes.\n- Improved workflows, customer experience, and business performance.\n- Built strong stakeholder relationships and drove execution across teams.";

  const skillBlock = skills.length
    ? skills.map((skill) => `• ${skill}`).join("\n")
    : "• Leadership\n• Strategy\n• Communication\n• Stakeholder Management\n• Problem Solving";

  return [
    firstLine,
    `${role} | CV Draft`,
    "",
    "Professional Summary",
    "Results-driven professional with a strong background in delivering measurable business impact, building cross-functional relationships, and driving execution in fast-paced environments.",
    "",
    "Core Skills",
    skillBlock,
    "",
    "Key Experience",
    experienceLines,
    "",
    "Additional Highlights",
    "- Delivered projects that improved performance, customer experience, and operational efficiency.",
    "- Partnered with leaders and teams to align priorities, manage execution, and achieve goals.",
    "- Communicated clearly, managed competing priorities, and ensured consistent delivery.",
    "",
    "Education & Credentials",
    "- Relevant degree or professional qualification\n- Certifications and continuous learning in line with current role requirements",
  ].join("\n");
};

async function extractTextFromFile(file: File) {
  const name = file.name.toLowerCase();
  const rawFileName = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ("str" in item ? String(item.str) : ""))
        .join(" ");
      pages.push(text);
    }

    return normalizeCvText(pages.join("\n\n"));
  }

  if (name.endsWith(".docx") || file.type.includes("officedocument") || file.type.includes("word")) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return normalizeCvText(result.value || "");
  }

  if (name.endsWith(".rtf") || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".html") || name.endsWith(".htm")) {
    return normalizeCvText(await file.text());
  }

  const textFromFile = await file.text();
  return normalizeCvText(rawFileName.includes("resume") || rawFileName.includes("cv") ? textFromFile : textFromFile);
}

export function GeneratorForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [background, setBackground] = useState("Warm Gray");
  const [profession, setProfession] = useState("Product Manager");
  const [cvDetails, setCvDetails] = useState("");
  const [cvDraft, setCvDraft] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cvImportLoading, setCvImportLoading] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleCvFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setCvImportLoading(true);
      setError(null);

      const extracted = await extractTextFromFile(file);
      if (!extracted.trim()) {
        throw new Error("No readable text was found in the selected CV file.");
      }

      setCvDetails(extracted);
      setCvDraft(buildProfessionalCvText(extracted));
      setProfession((current) => current || "Product Manager");
    } catch (cvImportError) {
      setError(
        cvImportError instanceof Error ? cvImportError.message : "We could not read this file. Please try PDF, DOCX, or TXT.",
      );
    } finally {
      setCvImportLoading(false);
      event.target.value = "";
    }
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

  const handleGenerateCv = () => {
    const draft = buildProfessionalCvText(cvDetails);
    setCvDraft(draft);
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

      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: 1500,
          imageUrls: images,
          background,
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
      formData.append("aspectRatio", ASPECT_RATIO);

      const response = await fetch("/api/enhance", {
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
          data.error || "Image enhancement failed. Please try again with a clearer photo.",
        );
      }

      setImages(data.images);
      setFailedCount(0);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Image enhancement failed. Please try again with a clearer photo.",
      );
      setImages([]);
      setFailedCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDropFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!validFiles.length) {
      setError("Please drop valid image files.");
      return;
    }

    const input = document.getElementById("generator-upload") as HTMLInputElement | null;
    if (input) {
      const dataTransfer = new DataTransfer();
      validFiles.forEach((file) => dataTransfer.items.add(file));
      input.files = dataTransfer.files;
    }

    const syntheticEvent = {
      target: { files: validFiles },
    } as unknown as ChangeEvent<HTMLInputElement>;

    await handleFileChange(syntheticEvent);
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) {
      await handleDropFiles(Array.from(event.dataTransfer.files));
    }
  };

  return (
    <>
      {isOnboardingOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-pink-500/10 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-pink-200">Welcome</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Create polished headshots in minutes</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10"
              >
                Skip
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-2xl">1</div>
                <div className="font-medium text-white">Upload your selfie</div>
                <p className="mt-2 text-sm text-zinc-400">Pick a clear front-facing photo for best results.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-2xl">2</div>
                <div className="font-medium text-white">Choose the style</div>
                <p className="mt-2 text-sm text-zinc-400">Set your preferred background and profession.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-2xl">3</div>
                <div className="font-medium text-white">Unlock and download</div>
                <p className="mt-2 text-sm text-zinc-400">Pay once and download your final headshots instantly.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white hover:bg-pink-400"
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10">
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-pink-200">
            <span className="rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1">Fast setup</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Cloudinary-powered</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">CV-ready</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-pink-200">Headshot Generator</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Upload a selfie and generate professional headshots
          </h1>
          <p className="max-w-2xl text-sm text-zinc-300">
            In 3 easy steps: upload a clear photo, choose your style, and unlock your polished headshots with a simple $15 checkout.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-400">Step 1</div>
            <div className="text-base font-medium text-white">Upload your selfie</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-400">Step 2</div>
            <div className="text-base font-medium text-white">Pick a background + CV style</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-400">Step 3</div>
            <div className="text-base font-medium text-white">Unlock and download</div>
          </div>
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
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="mb-4 rounded-full bg-pink-500/15 p-4 text-pink-300">↑</div>
                <div className="text-xl font-medium text-white">Choose your selfie photos</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Upload 1–3 clear front-facing photos for best results.
                </div>
                {isDragging ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] border-2 border-pink-500/50 bg-black/30">
                    <span className="text-sm text-pink-100">Drop the files here...</span>
                  </div>
                ) : null}
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

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <label className="block text-sm text-zinc-300">CV / Resume</label>
                  <div className="mt-1 text-xs text-zinc-400">Upload PDF, DOCX, or TXT and we’ll extract the content.</div>
                </div>
                <input
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleCvFileImport}
                  className="hidden"
                />
                <label
                  htmlFor="cv-upload"
                  className="cursor-pointer rounded-full border border-pink-500/50 bg-pink-500/10 px-4 py-2 text-sm font-medium text-pink-100 transition hover:bg-pink-500/20"
                >
                  {cvImportLoading ? "Reading..." : "Upload CV file"}
                </label>
              </div>

              {cvDetails ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Imported CV preview</div>
                  <p className="max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-6 text-zinc-200">
                    {cvDetails.slice(0, 800)}
                    {cvDetails.length > 800 ? "..." : ""}
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="cv-details" className="mb-2 block text-sm text-zinc-300">
                CV / Resume details
              </label>
              <textarea
                id="cv-details"
                value={cvDetails}
                onChange={(event) => setCvDetails(event.target.value)}
                placeholder="Add your work experience, skills, achievements, education, and career goals here..."
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-pink-500"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleGenerateCv}
                  className="rounded-full border border-pink-500/50 bg-pink-500/10 px-4 py-2 text-sm font-medium text-pink-100 transition hover:bg-pink-500/20"
                >
                  Generate professional CV draft
                </button>
                <span className="text-xs text-zinc-400">Uses your details to build a polished CV</span>
              </div>
            </div>

            {cvDraft ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-400">CV preview</div>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{cvDraft}</pre>
              </div>
            ) : null}

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
              {loading ? "Enhancing your selfie..." : "Generate Headshots"}
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
            <h2 className="text-2xl font-semibold text-white">Enhancing your selfie...</h2>
            <p className="mt-3 text-zinc-300">This usually returns in a few seconds.</p>
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
    </>
  );
}
