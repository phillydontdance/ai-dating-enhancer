import { GeneratorForm } from "../components/GeneratorForm";

export default function Home() {
	return (
		<main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_12px_24px_var(--shadow)] sm:p-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Headshotly</p>
							<h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
								Create your headshots
							</h1>
						</div>
						<div className="rounded-full border border-[var(--lime)] bg-[var(--lime-soft)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--lime)]">
							$15 one-time payment
						</div>
					</div>
				</div>
				<GeneratorForm />
			</div>
		</main>
	);
}
