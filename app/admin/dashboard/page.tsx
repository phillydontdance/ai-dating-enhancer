"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardMetric = {
  label: string;
  value: string;
  change: string;
};

type DashboardFunnel = {
  step: string;
  value: number;
  count: number;
};

type DashboardPayment = {
  id: string;
  method: string;
  amount: string;
  status: string;
  date: string;
};

type DashboardJob = {
  id: string;
  issue: string;
  user: string;
  status: string;
  date: string;
};

type DashboardData = {
  metrics: DashboardMetric[];
  funnel: DashboardFunnel[];
  overview: {
    conversionRate: string;
    avgRevenue: string;
    refundRisk: string;
  };
  payments: DashboardPayment[];
  failedJobs: DashboardJob[];
};

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/admin/dashboard");
  if (!response.ok) {
    throw new Error("Unable to load dashboard data.");
  }
  return response.json();
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .catch(() =>
        setData({
          metrics: [],
          funnel: [],
          payments: [],
          failedJobs: [],
          overview: { conversionRate: "0%", avgRevenue: "$0", refundRisk: "0%" },
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-[#090909] px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl">Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-pink-200">Operations</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">Analytics dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-zinc-300">Live</div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-zinc-300 transition hover:border-pink-500/40 hover:text-white"
            >
              Log out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((item) => (
            <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-zinc-950/90 p-5">
              <div className="text-sm text-zinc-400">{item.label}</div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="text-3xl font-semibold text-white">{item.value}</div>
                <div className="rounded-full bg-pink-500/10 px-2 py-1 text-xs font-medium text-pink-200">{item.change}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/90 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-pink-200">Funnel</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Conversion flow</h2>
              </div>
              <div className="text-sm text-zinc-400">Last 30 days</div>
            </div>

            <div className="space-y-4">
              {data.funnel.map((item) => (
                <div key={item.step}>
                  <div className="mb-2 flex justify-between text-sm text-zinc-300">
                    <span>{item.step}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-pink-500" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/90 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-pink-200">Overview</div>
            <div className="mt-5 grid gap-4 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-zinc-400">Conversion rate</div>
                <div className="mt-2 text-2xl font-semibold text-white">{data.overview.conversionRate}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-zinc-400">Avg. revenue / order</div>
                <div className="mt-2 text-2xl font-semibold text-white">{data.overview.avgRevenue}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-zinc-400">Refund risk</div>
                <div className="mt-2 text-2xl font-semibold text-white">{data.overview.refundRisk}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/90 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-pink-200">Payments</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Transactions</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-300">Filterable</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-zinc-300">
                <thead className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                  <tr>
                    <th className="pb-3 pr-4">Invoice</th>
                    <th className="pb-3 pr-4">Method</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((row) => (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="py-3 pr-4 text-white">{row.id}</td>
                      <td className="py-3 pr-4">{row.method}</td>
                      <td className="py-3 pr-4">{row.amount}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-zinc-200">{row.status}</span>
                      </td>
                      <td className="py-3 pr-4">{new Date(row.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/90 p-6">
            <div className="mb-5">
              <div className="text-xs uppercase tracking-[0.2em] text-pink-200">Failures</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Refund follow-up</h2>
            </div>

            <div className="space-y-4">
              {data.failedJobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">{job.id}</div>
                    <div className="rounded-full border border-pink-500/30 bg-pink-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-pink-100">{job.status}</div>
                  </div>
                  <div className="mt-3 text-sm text-zinc-300">{job.issue}</div>
                  <div className="mt-3 text-xs text-zinc-400">{job.user} • {new Date(job.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
