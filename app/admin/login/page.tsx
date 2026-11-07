"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Invalid admin credentials.");
      }

      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid admin credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-[0_12px_24px_var(--shadow)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Admin access</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Dashboard</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="admin@yourdomain.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="Enter admin password"
            />
          </div>

          {error ? <div className="rounded-xl border border-[#d8b3ad] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error-text)]">{error}</div> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
