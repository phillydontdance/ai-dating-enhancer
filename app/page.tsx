"use client";

import { ChangeEvent, useState } from "react";

const styleOptions = [
	{
		id: "corporate",
		name: "Corporate/LinkedIn",
		description: "Confident, polished, recruiter-safe framing",
		accent: "Best for: executives, consultants, finance",
	},
	{
		id: "business",
		name: "Business Casual",
		description: "Warm professional presence with natural lighting",
		accent: "Best for: general professional roles",
	},
	{
		id: "tech",
		name: "Tech/Startup",
		description: "Sharp, clean, modern headshots designed for product teams",
		accent: "Best for: SaaS, startup, product, engineering",
	},
	{
		id: "creative",
		name: "Creative",
		description: "Elevated visual identity while keeping a polished edge",
		accent: "Best for: brand, design, marketing",
	},
];

const backgroundOptions = [
	"Studio White",
	"Warm Gray",
	"Muted Blush",
	"Deep Charcoal",
	"Soft Marble",
];

const suggestionCards = [
	{
		title: "Built for job seekers",
		value: "Pre-launch",
		detail: "Be among our first users",
	},
	{
		title: "Fast profile refresh",
		value: "10 photos",
		detail: "Professional, polished options",
	},
	{
		title: "Premium look",
		value: "AI-assisted",
		detail: "Tailored for LinkedIn and recruiter screens",
	},
];

// TODO: replace with real testimonials once available
const testimonialPlaceholder = [
	{
		quote:
			"Built for job seekers who want a fresh, polished profile before the next application cycle.",
		name: "Early access",
	},
	{
		quote:
			"A clean, premium headshot workflow designed for recruiter-ready first impressions.",
		name: "Coming soon",
	},
	{
		quote:
			"We’re preparing the launch experience for job seekers and hiring teams alike.",
		name: "Pre-launch",
	},
];

void testimonialPlaceholder;

const reviewCandidates = Array.from({ length: 24 }, (_, index) => ({
	id: index + 1,
	name: `Candidate ${index + 1}`,
	label: ["Executive", "Consultant", "PM", "Designer", "Founder"][index % 5],
	selected: index < 10,
}));

export default function Home() {
	const [currentStep, setCurrentStep] = useState<
		| "landing"
		| "upload"
		| "style"
		| "payment"
		| "processing"
		| "review"
		| "download"
	>("landing");
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [uploadError, setUploadError] = useState("");
	const [selectedStyle, setSelectedStyle] = useState(styleOptions[0].id);
	const [selectedBackground, setSelectedBackground] = useState(
		backgroundOptions[0],
	);
	const [selectedPayment, setSelectedPayment] = useState<"stripe" | "mpesa">(
		"stripe",
	);
	const [selectedCandidates, setSelectedCandidates] = useState<number[]>(
		reviewCandidates.slice(0, 10).map((candidate) => candidate.id),
	);
	const [isProcessing, setIsProcessing] = useState(false);

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? []);

		if (files.length < 8 || files.length > 15) {
			setUploadError("Please upload between 8 and 15 selfie photos.");
			setSelectedFiles([]);
			return;
		}

		const invalidFiles = files.filter((file) => !file.type.startsWith("image/"));
		if (invalidFiles.length > 0) {
			setUploadError(
				"Only image files are supported. Please upload JPG, PNG, or HEIC photos.",
			);
			setSelectedFiles([]);
			return;
		}

		setSelectedFiles(files);
		setUploadError("");
	};

	const handleUploadContinue = () => {
		if (selectedFiles.length < 8) {
			setUploadError("Please add at least 8 selfies to continue.");
			return;
		}
		setCurrentStep("style");
	};

	const handlePayment = () => {
		setCurrentStep("processing");
		setIsProcessing(true);

		window.setTimeout(() => {
			setIsProcessing(false);
			setCurrentStep("review");
		}, 2200);
	};

	const toggleCandidate = (id: number) => {
		setSelectedCandidates((current) => {
			const exists = current.includes(id);
			if (exists) {
				return current.filter((item) => item !== id);
			}
			if (current.length >= 10) {
				return current;
			}
			return [...current, id];
		});
	};

	const continueToDownload = () => {
		if (selectedCandidates.length !== 10) {
			return;
		}
		setCurrentStep("download");
	};

	const renderFlow = () => {
		if (currentStep === "landing") {
			return (
				<section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
					<div className="space-y-8">
						<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-pink-200">
							AI headshots for serious candidates
						</div>
						<div className="space-y-5">
							<h1 className="max-w-xl text-5xl font-semibold tracking-[-0.08em] text-white sm:text-6xl">
								Turn everyday selfies into polished, interview-ready headshots.
							</h1>
							<p className="max-w-xl text-lg leading-8 text-zinc-300">
								Get 10 polished portrait options from your regular photos in under
								90 minutes, designed for LinkedIn, recruitment, and high-stakes job
								searches.
							</p>
						</div>
						<div className="flex flex-col gap-4 sm:flex-row">
							<button
								onClick={() => setCurrentStep("upload")}
								className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(255,79,163,0.35)] transition hover:bg-pink-400"
							>
								Get Started
							</button>
							<button className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10">
								See examples
							</button>
						</div>
						<div className="grid max-w-xl gap-4 sm:grid-cols-3">
							{suggestionCards.map((card) => (
								<div
									key={card.title}
									className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
								>
									<div className="text-2xl font-semibold text-white">
										{card.value}
									</div>
									<div className="mt-3 text-sm text-zinc-300">
										{card.title}
									</div>
									<div className="mt-1 text-xs text-zinc-400">
										{card.detail}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="relative">
						<div className="absolute -left-8 top-10 h-52 w-52 rounded-full bg-pink-500/20 blur-3xl" />
						<div className="absolute -right-6 bottom-4 h-64 w-64 rounded-full bg-pink-400/15 blur-3xl" />
						<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
							<div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-400">
								<span>Before</span>
								<span>After</span>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="relative h-[400px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,_#f4c9d8,_#efe8e7_40%,_#d9d5d4)]">
									<div className="absolute left-1/2 top-12 h-28 w-28 -translate-x-1/2 rounded-full bg-[#e7d4c5]" />
									<div className="absolute left-1/2 top-36 h-36 w-32 -translate-x-1/2 rounded-[42%] bg-[#f7efe9]" />
									<div className="absolute left-1/2 top-[44%] h-16 w-40 -translate-x-1/2 rounded-full bg-[#f1d4c7]" />
									<div className="absolute inset-x-4 bottom-6 h-2 rounded-full bg-black/10" />
								</div>
								<div className="relative h-[400px] overflow-hidden rounded-[1.5rem] border border-pink-500/30 bg-[radial-gradient(circle_at_top,_#ffebf3,_#fff7fb_30%,_#111111_70%)]">
									<div className="absolute inset-x-5 top-6 h-5 rounded-full bg-white/60 backdrop-blur-sm" />
									<div className="absolute left-1/2 top-12 h-28 w-28 -translate-x-1/2 rounded-full bg-[#d9bca0] shadow-[0_20px_40px_rgba(0,0,0,0.28)]" />
									<div className="absolute left-1/2 top-36 h-36 w-32 -translate-x-1/2 rounded-[42%] bg-[#f5e4d6] shadow-[0_20px_40px_rgba(0,0,0,0.23)]" />
									<div className="absolute left-1/2 top-[46%] h-14 w-40 -translate-x-1/2 rounded-full bg-[#f0d4c9]" />
									<div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
								</div>
							</div>
						</div>
					</div>
				</section>
			);
		}

		if (currentStep === "upload") {
			return (
				<div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10">
					<div className="mb-8 flex items-center justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-pink-200">
								Step 1
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-white">
								Upload your selfies
							</h2>
						</div>
						<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
							8–15 photos
						</div>
					</div>

					<div className="rounded-[1.5rem] border border-dashed border-pink-500/40 bg-pink-500/[0.04] p-6">
						<input
							id="selfie-upload"
							type="file"
							multiple
							accept="image/*"
							onChange={handleFileChange}
							className="hidden"
						/>
						<label
							htmlFor="selfie-upload"
							className="flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-white/10 bg-black/20 px-6 py-12 text-center transition hover:border-pink-500/50 hover:bg-black/30"
						>
							<div className="mb-4 rounded-full bg-pink-500/15 p-4 text-pink-300">
								↑
							</div>
							<div className="text-xl font-medium text-white">
								Choose your selfies
							</div>
							<div className="mt-2 text-sm text-zinc-400">
								JPG, PNG, or HEIC. Clear front-facing photos work best.
							</div>
						</label>
					</div>

					{uploadError ? (
						<div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
							{uploadError}
						</div>
					) : null}

					{selectedFiles.length > 0 ? (
						<div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
							<div className="mb-3 flex items-center justify-between">
								<div className="text-sm text-zinc-300">Ready to use</div>
								<div className="text-sm font-medium text-pink-200">
									{selectedFiles.length} files selected
								</div>
							</div>
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
								{selectedFiles.slice(0, 10).map((file, index) => (
									<div
										key={`${file.name}-${index}`}
										className="rounded-xl border border-white/10 bg-zinc-900 p-2 text-center text-xs text-zinc-400"
									>
										{file.name.slice(0, 12)}
									</div>
								))}
							</div>
						</div>
					) : null}

					<div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
						<button
							onClick={() => setCurrentStep("landing")}
							className="text-sm text-zinc-400 transition hover:text-white"
						>
							Back
						</button>
						<button
							onClick={handleUploadContinue}
							className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400"
						>
							Continue to style
						</button>
					</div>
				</div>
			);
		}

		if (currentStep === "style") {
			return (
				<div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10">
					<div className="mb-8">
						<p className="text-xs uppercase tracking-[0.2em] text-pink-200">
							Step 2
						</p>
						<h2 className="mt-2 text-3xl font-semibold text-white">
							Choose your desired look
						</h2>
					</div>

					<div className="grid gap-6 lg:grid-cols-2">
						<div className="space-y-4">
							{styleOptions.map((option) => (
								<button
									key={option.id}
									onClick={() => setSelectedStyle(option.id)}
									className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
										selectedStyle === option.id
											? "border-pink-500 bg-pink-500/10"
											: "border-white/10 bg-white/[0.02] hover:border-white/20"
									}`}
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<div className="text-lg font-semibold text-white">
												{option.name}
											</div>
											<div className="mt-2 text-sm text-zinc-300">
												{option.description}
											</div>
										</div>
										<div
											className={`mt-1 h-4 w-4 rounded-full ${
												selectedStyle === option.id
													? "bg-pink-400"
													: "bg-zinc-700"
											}`}
										/>
									</div>
									<div className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-400">
										{option.accent}
									</div>
								</button>
							))}
						</div>

						<div className="space-y-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
							<div>
								<div className="text-sm uppercase tracking-[0.2em] text-zinc-400">
									Background
								</div>
								<div className="mt-4 grid gap-3 sm:grid-cols-2">
									{backgroundOptions.map((background) => (
										<button
											key={background}
											onClick={() => setSelectedBackground(background)}
											className={`rounded-2xl border px-3 py-4 text-left text-sm transition ${
												selectedBackground === background
													? "border-pink-500 bg-pink-500/10 text-white"
													: "border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/20"
											}`}
										>
											{background}
										</button>
									))}
								</div>
							</div>

							<div className="rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,120,180,0.2),_rgba(255,255,255,0.02)_35%,_rgba(0,0,0,0.65)_100%)] p-4">
								<div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
									Preview
								</div>
								<div className="mt-4 flex items-center justify-center">
									<div className="relative h-64 w-52 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.8),_rgba(255,255,255,0.15)_26%,_rgba(0,0,0,0.8)_100%)]">
										<div className="absolute left-1/2 top-10 h-20 w-20 -translate-x-1/2 rounded-full bg-[#d9b9a0]" />
										<div className="absolute left-1/2 top-24 h-28 w-24 -translate-x-1/2 rounded-[35%] bg-[#f5e5d8]" />
										<div className="absolute left-1/2 top-[58%] h-12 w-28 -translate-x-1/2 rounded-full bg-[#efd0c4]" />
										<div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
						<button
							onClick={() => setCurrentStep("upload")}
							className="text-sm text-zinc-400 transition hover:text-white"
						>
							Back
						</button>
						<button
							onClick={() => setCurrentStep("payment")}
							className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400"
						>
							Continue to payment
						</button>
					</div>
				</div>
			);
		}

		if (currentStep === "payment") {
			return (
				<div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10">
					<div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-pink-200">
								Step 3
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-white">
								Choose how you pay
							</h2>
						</div>
						<div className="rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm font-medium text-pink-100">
							$29 for 10 photos
						</div>
					</div>

					<div className="grid gap-5 md:grid-cols-2">
						<button
							onClick={() => setSelectedPayment("stripe")}
							className={`rounded-[1.5rem] border p-5 text-left transition ${
								selectedPayment === "stripe"
									? "border-pink-500 bg-pink-500/10"
									: "border-white/10 bg-white/[0.02]"
							}`}
						>
							<div className="text-lg font-semibold text-white">
								Card payment
							</div>
							<div className="mt-2 text-sm text-zinc-300">
								Stripe Checkout — secure cards, Apple Pay, and bank-supported
								payments.
							</div>
							<div className="mt-5 text-2xl font-semibold text-white">$29</div>
						</button>

						<button
							onClick={() => setSelectedPayment("mpesa")}
							className={`rounded-[1.5rem] border p-5 text-left transition ${
								selectedPayment === "mpesa"
									? "border-pink-500 bg-pink-500/10"
									: "border-white/10 bg-white/[0.02]"
							}`}
						>
							<div className="text-lg font-semibold text-white">M-Pesa</div>
							<div className="mt-2 text-sm text-zinc-300">
								Daraja STK push for mobile-first payments across Kenya.
							</div>
							<div className="mt-5 text-2xl font-semibold text-white">
								KSh 3,000
							</div>
						</button>
					</div>

					<div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
						<div className="flex items-center justify-between gap-4">
							<div>
								<div className="text-sm text-zinc-400">Order summary</div>
								<div className="mt-1 text-xl font-semibold text-white">
									Professional headshots package
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
									Total
								</div>
								<div className="text-2xl font-semibold text-pink-200">
									{selectedPayment === "stripe"
										? "$29"
										: "KSh 3,000"}
								</div>
							</div>
						</div>
						<div className="mt-4 text-sm text-zinc-300">
							{selectedFiles.length} selfies •{" "}
							{
								styleOptions.find(
									(option) => option.id === selectedStyle,
								)?.name
							}{" "}
							• {selectedBackground}
						</div>
					</div>

					<div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
						<button
							onClick={() => setCurrentStep("style")}
							className="text-sm text-zinc-400 transition hover:text-white"
						>
							Back
						</button>
						<button
							onClick={handlePayment}
							className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400"
						>
							Pay with{" "}
							{selectedPayment === "stripe" ? "Stripe" : "M-Pesa"}
						</button>
					</div>
				</div>
			);
		}

		if (currentStep === "processing") {
			return (
				<div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10 text-center">
					<div className="mx-auto mb-6 h-20 w-20 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
					<p className="text-xs uppercase tracking-[0.2em] text-pink-200">
						Processing
					</p>
					<h2 className="mt-3 text-3xl font-semibold text-white">
						Training your model and generating portraits
					</h2>
					<p className="mt-4 text-zinc-300">
						We’re fine-tuning the style on your uploaded selfies and creating
						20–30 high-quality variations for final selection.
					</p>

					<div className="mt-8 space-y-4">
						{[
							"Analyzing 12 selfies",
							"Aligning face landmarks",
							"Training LoRA adapter",
							"Generating 30 candidate photos",
							"Preparing final review gallery",
						].map((label, index) => (
							<div
								key={label}
								className="flex items-center gap-3 text-left text-sm text-zinc-300"
							>
								<div
									className={`h-2.5 w-2.5 rounded-full ${
										index === 0 ||
										index === 1 ||
										index === 2 ||
										index === 3
											? "bg-pink-400"
											: "bg-zinc-700"
									}`}
								/>
								<span>{label}</span>
							</div>
						))}
					</div>

					{!isProcessing ? (
						<button
							onClick={() => setCurrentStep("review")}
							className="mt-8 rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white"
						>
							Continue
						</button>
					) : null}
				</div>
			);
		}

		if (currentStep === "review") {
			return (
				<div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-5 sm:p-8">
					<div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-pink-200">
								Step 4
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-white">
								Pick your favorite 10
							</h2>
						</div>
						<div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-zinc-300">
							{selectedCandidates.length}/10 selected
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{reviewCandidates.map((candidate) => {
							const isSelected = selectedCandidates.includes(candidate.id);
							return (
								<button
									key={candidate.id}
									onClick={() => toggleCandidate(candidate.id)}
									className={`relative overflow-hidden rounded-[1.5rem] border p-2 text-left transition ${
										isSelected
											? "border-pink-500 bg-pink-500/10"
											: "border-white/10 bg-white/[0.02]"
									}`}
								>
									<div className="relative h-72 overflow-hidden rounded-[1.15rem] bg-[radial-gradient(circle_at_top,_#f9d7ea,_#f3e7e5_38%,_#171717_100%)]">
										<div className="absolute left-1/2 top-8 h-20 w-20 -translate-x-1/2 rounded-full bg-[#d9b89d]" />
										<div className="absolute left-1/2 top-24 h-32 w-28 -translate-x-1/2 rounded-[38%] bg-[#f4e2d4]" />
										<div className="absolute left-1/2 top-[56%] h-12 w-28 -translate-x-1/2 rounded-full bg-[#efd0c4]" />
									</div>
									<div className="flex items-center justify-between px-1 pb-1 pt-3">
										<div>
											<div className="text-sm font-medium text-white">
												{candidate.name}
											</div>
											<div className="text-xs text-zinc-400">
												{candidate.label}
											</div>
										</div>
										<div
											className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
												isSelected
													? "border-pink-500 bg-pink-500 text-white"
													: "border-white/20 bg-transparent text-zinc-400"
											}`}
										>
											{isSelected ? "✓" : ""}
										</div>
									</div>
								</button>
							);
						})}
					</div>

					<div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
						<button
							onClick={() => setCurrentStep("payment")}
							className="text-sm text-zinc-400 transition hover:text-white"
						>
							Back
						</button>
						<button
							onClick={continueToDownload}
							disabled={selectedCandidates.length !== 10}
							className={`rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
								selectedCandidates.length === 10
									? "bg-pink-500 hover:bg-pink-400"
									: "cursor-not-allowed bg-zinc-700 text-zinc-400"
							}`}
						>
							Download final 10
						</button>
					</div>
				</div>
			);
		}

		if (currentStep === "download") {
			return (
				<div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10 text-center">
					<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-pink-500/15 text-3xl text-pink-300">
						✓
					</div>
					<p className="text-xs uppercase tracking-[0.2em] text-pink-200">
						Ready
					</p>
					<h2 className="mt-3 text-3xl font-semibold text-white">
						Your final 10 images are ready
					</h2>
					<p className="mt-4 text-zinc-300">
						A ZIP file with high-resolution headshots is available for download and
						a delivery link has been emailed to your inbox.
					</p>

					<div className="mt-8 grid gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
							<div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
								Format
							</div>
							<div className="mt-2 text-lg font-semibold text-white">
								ZIP / 300 DPI
							</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
							<div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
								Delivery
							</div>
							<div className="mt-2 text-lg font-semibold text-white">
								Email + in-app
							</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
							<div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
								Status
							</div>
							<div className="mt-2 text-lg font-semibold text-white">
								Complete
							</div>
						</div>
					</div>

					<div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
						<button className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400">
							Download ZIP
						</button>
						<button className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10">
							Request another set
						</button>
					</div>
				</div>
			);
		}

		return null;
	};

	return (
		<main className="min-h-screen bg-[#090909] text-white">
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				{renderFlow()}
			</div>
		</main>
	);
}
