"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@headshotly.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (email === "admin@headshotly.com" && password === "admin123") {
      window.location.href = "/admin/dashboard";
      return;
    }

    setError("Invalid admin credentials.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-xl font-bold text-white">A</div>
          <div className="text-xs uppercase tracking-[0.2em] text-pink-200">Admin access</div>
          <h1 className="mt-3 text-3xl font-semibold text-white">Headshotly dashboard</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-pink-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-pink-500"
            />
          </div>

          {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div> : null}

          <button type="submit" className="w-full rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-400">
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
