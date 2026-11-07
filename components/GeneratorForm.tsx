"use client";

import imageCompression from "browser-image-compression";
import mammoth from "mammoth";
import { ChangeEvent, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Download,
  FileText,
  ImageUp,
  Lock,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";

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
      setError("Please use a smaller image for the upload.");
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
      setError("Unlock downloads before saving any generated headshots.");
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
      setError("Unlock downloads before saving all generated headshots.");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1a18]/70 p-4">
          <div className="w-full max-w-2xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_20px_36px_rgba(17,17,17,0.12)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Welcome</div>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Create headshots in a few steps</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-1 text-sm text-[var(--foreground)] hover:bg-[var(--panel)]"
              >
                Skip
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">1</div>
                <div className="font-medium text-[var(--foreground)]">Upload your photo</div>
                <p className="mt-2 text-sm text-[var(--muted)]">Use a clear front-facing image for the best match.</p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">2</div>
                <div className="font-medium text-[var(--foreground)]">Choose the style</div>
                <p className="mt-2 text-sm text-[var(--muted)]">Set the background, role, and resume details.</p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">3</div>
                <div className="font-medium text-[var(--foreground)]">Download the set</div>
                <p className="mt-2 text-sm text-[var(--muted)]">Pay once and download the final images.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--panel)]"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_24px_var(--shadow)] sm:p-10">
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-1">Photos</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-1">Background selection</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-1">CV-ready</span>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Headshot generator</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">
            Upload your photo and generate a professional headshot set
          </h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Choose a clear selfie, pick a background, and pay once to unlock the final image set.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Step 1</div>
            <div className="text-base font-medium text-[var(--foreground)]">Upload your photo</div>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Step 2</div>
            <div className="text-base font-medium text-[var(--foreground)]">Set background and role</div>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Step 3</div>
            <div className="text-base font-medium text-[var(--foreground)]">Download the final set</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="rounded-[1.25rem] border border-dashed border-[var(--border)] bg-[var(--panel-strong)] p-6">
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
                className="flex cursor-pointer flex-col items-center justify-center rounded-[1rem] border border-[var(--border)] bg-[var(--panel)] px-6 py-12 text-center transition hover:border-[var(--accent)]"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <UploadCloud className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <div className="text-xl font-medium text-[var(--foreground)]">Upload your selfie photos</div>
                <div className="mt-2 text-sm text-[var(--muted)]">
                  Upload 1–3 front-facing photos for the best result.
                </div>
                {isDragging ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[1rem] border-2 border-[var(--accent)] bg-[var(--panel-strong)]">
                    <span className="text-sm text-[var(--accent)]">Drop files here</span>
                  </div>
                ) : null}
              </label>
            </div>

            {selectedFiles.length > 0 ? (
              <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="text-sm text-[var(--foreground)]">Selected files</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs text-[var(--muted)]"
                    >
                      {file.name.slice(0, 18)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">Background</label>
              <select
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              >
                {backgroundOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="profession" className="mb-2 block text-sm text-[var(--muted)]">
                Role
              </label>
              <input
                id="profession"
                type="text"
                value={profession}
                onChange={(event) => setProfession(event.target.value)}
                placeholder="e.g. Product Manager"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              />
            </div>

            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <label className="block text-sm text-[var(--muted)]">CV / Resume</label>
                  <div className="mt-1 text-xs text-[var(--muted)]">Upload a PDF, DOCX, or TXT file.</div>
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                >
                  <FileText className="h-4 w-4" strokeWidth={1.8} />
                  {cvImportLoading ? "Reading..." : "Upload file"}
                </label>
              </div>

              {cvDetails ? (
                <div className="mt-3 rounded-[0.85rem] border border-[var(--border)] bg-[var(--panel)] p-3">
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Imported CV preview</div>
                  <p className="max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-6 text-[var(--foreground)]">
                    {cvDetails.slice(0, 800)}
                    {cvDetails.length > 800 ? "..." : ""}
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="cv-details" className="mb-2 block text-sm text-[var(--muted)]">
                CV / Resume details
              </label>
              <textarea
                id="cv-details"
                value={cvDetails}
                onChange={(event) => setCvDetails(event.target.value)}
                placeholder="Add your work experience, skills, achievements, education, and career goals here..."
                className="min-h-32 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleGenerateCv}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
                >
                  <Check className="h-4 w-4" strokeWidth={1.8} />
                  Generate CV draft
                </button>
                <span className="text-xs text-[var(--muted)]">Draft based on the details you enter</span>
              </div>
            </div>

            {cvDraft ? (
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">CV preview</div>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">{cvDraft}</pre>
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-[var(--muted)]">
                Email for payment and delivery
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Applying background removal..." : "Generate headshots"}
            </button>
          </div>

          <aside className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-5 shadow-[0_12px_24px_var(--shadow)]">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Output</div>
            <div className="mt-4 text-3xl font-semibold text-[var(--foreground)]">{images.length || 0}</div>
            <div className="mt-2 text-sm text-[var(--muted)]">headshots ready</div>
            {images.length > 0 && !isPaid ? (
              <button
                onClick={() => void handleUnlockWithStripe()}
                disabled={checkoutLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Lock className="h-4 w-4" strokeWidth={1.8} />
                {checkoutLoading ? "Preparing checkout..." : "Unlock downloads — $15"}
              </button>
            ) : null}
            {failedCount > 0 ? (
              <div className="mt-4 rounded-[0.85rem] border border-[#d8b3ad] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error-text)]">
                {failedCount} failed — try a cleaner source image.
              </div>
            ) : null}
          </aside>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-[0_12px_24px_var(--shadow)]">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
              <LoaderCircle className="h-7 w-7 animate-spin" strokeWidth={1.8} />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Applying background removal and color correction</h2>
            <p className="mt-3 text-[var(--muted)]">This usually takes a few seconds.</p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-[1.25rem] border border-[#d8b3ad] bg-[var(--error-bg)] p-5 text-center text-[var(--error-text)]">
            {error}
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={handleGenerate}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
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
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Your headshots</h2>
              </div>
              <button
                onClick={() => void handleDownloadAll()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isPaid}
              >
                <Download className="h-4 w-4" strokeWidth={1.8} />
                {isPaid ? "Download all" : "Unlock to download"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] shadow-[0_12px_24px_var(--shadow)]"
                >
                  <div className="relative">
                    <img
                      src={url}
                      alt={`Headshot ${index + 1}`}
                      draggable={false}
                      onContextMenu={(event) => event.preventDefault()}
                      className={`h-80 w-full object-cover select-none ${!isPaid ? 'grayscale-[0.1] brightness-75 blur-[1px]' : ''}`}
                      style={{ WebkitUserSelect: 'none' }}
                    />
                    {!isPaid ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[rgba(17,17,17,0.38)]">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <span className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--foreground)]">
                            Locked
                          </span>
                          <span className="text-xs text-white">Unlock for $15 to download</span>
                        </div>
                      </div>
                    ) : null}
                    {!isPaid ? (
                      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-[var(--border)] bg-[rgba(17,17,17,0.45)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white">
                        Headshotly
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => void handleDownloadImage(url, index)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!isPaid}
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
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
