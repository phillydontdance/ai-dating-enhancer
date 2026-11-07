"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BarChart3, LogOut } from "lucide-react";

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
      <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
        <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 text-[var(--muted)] shadow-[0_12px_24px_var(--shadow)]">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
              Operations
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Analytics dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-sm text-[var(--accent)]">Live</div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
              Log out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((item) => (
            <div key={item.label} className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_12px_24px_var(--shadow)]">
              <div className="text-sm text-[var(--muted)]">{item.label}</div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="text-3xl font-semibold text-[var(--foreground)]">{item.value}</div>
                <div className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-xs font-medium text-[var(--accent)]">{item.change}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_24px_var(--shadow)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Funnel</div>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Conversion flow</h2>
              </div>
              <div className="text-sm text-[var(--muted)]">Last 30 days</div>
            </div>

            <div className="space-y-4">
              {data.funnel.map((item) => (
                <div key={item.step}>
                  <div className="mb-2 flex justify-between text-sm text-[var(--muted)]">
                    <span>{item.step}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--panel-strong)]">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_24px_var(--shadow)]">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Overview</div>
            <div className="mt-5 grid gap-4 text-sm text-[var(--muted)]">
              <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div>Conversion rate</div>
                <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{data.overview.conversionRate}</div>
              </div>
              <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div>Avg. revenue / order</div>
                <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{data.overview.avgRevenue}</div>
              </div>
              <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div>Refund risk</div>
                <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{data.overview.refundRisk}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_24px_var(--shadow)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Payments</div>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Transactions</h2>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs text-[var(--muted)]">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                Filterable
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[var(--muted)]">
                <thead className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
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
                    <tr key={row.id} className="border-t border-[var(--border)]">
                      <td className="py-3 pr-4 text-[var(--foreground)]">{row.id}</td>
                      <td className="py-3 pr-4">{row.method}</td>
                      <td className="py-3 pr-4">{row.amount}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-2 py-1 text-xs text-[var(--foreground)]">{row.status}</span>
                      </td>
                      <td className="py-3 pr-4">{new Date(row.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_24px_var(--shadow)]">
            <div className="mb-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Failures</div>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Follow-up</h2>
            </div>

            <div className="space-y-4">
              {data.failedJobs.map((job) => (
                <div key={job.id} className="rounded-[1rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[var(--foreground)]">{job.id}</div>
                    <div className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">{job.status}</div>
                  </div>
                  <div className="mt-3 text-sm text-[var(--muted)]">{job.issue}</div>
                  <div className="mt-3 text-xs text-[var(--muted)]">{job.user} • {new Date(job.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
