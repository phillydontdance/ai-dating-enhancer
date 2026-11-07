import { CircleAlert } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12 text-[var(--foreground)]">
      <div className="max-w-lg rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-[0_12px_24px_var(--shadow)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--warning)]">
          <CircleAlert className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Payment cancelled</h1>
        <p className="mt-4 text-[var(--muted)]">The checkout was cancelled. You can try again or choose M-Pesa instead.</p>
      </div>
    </main>
  );
}
