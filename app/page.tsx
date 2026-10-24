"use client";

import { GeneratorForm } from "../components/GeneratorForm";

export default function Home() {
	return (
		<main className="min-h-screen bg-[#090909] text-white">
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<GeneratorForm />
			</div>
		</main>
	);
}
