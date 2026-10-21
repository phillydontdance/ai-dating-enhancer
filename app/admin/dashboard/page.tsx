const kpis = [
  { label: "Live visitors", value: "2,418", change: "+12%" },
  { label: "Uploads started", value: "684", change: "+9%" },
  { label: "Payments completed", value: "231", change: "+18%" },
  { label: "Downloads", value: "148", change: "+24%" },
];

const funnel = [
  { step: "Visitors", value: 100, count: 2842 },
  { step: "Uploads started", value: 62, count: 1768 },
  { step: "Payments initiated", value: 42, count: 1193 },
  { step: "Payments completed", value: 31, count: 897 },
  { step: "Downloads", value: 17, count: 492 },
];

const paymentRows = [
  { id: "INV-1039", method: "Stripe", amount: "$29", status: "Completed", date: "2026-10-20" },
  { id: "INV-1042", method: "M-Pesa", amount: "KSh 3,000", status: "Pending", date: "2026-10-20" },
  { id: "INV-1048", method: "Stripe", amount: "$29", status: "Failed", date: "2026-10-19" },
  { id: "INV-1054", method: "M-Pesa", amount: "KSh 3,000", status: "Completed", date: "2026-10-18" },
  { id: "INV-1061", method: "Stripe", amount: "$29", status: "Refunded", date: "2026-10-17" },
];

const failedJobs = [
  { id: "job_4821", issue: "LoRA trainer timeout", user: "sarah@company.com", status: "Refund queued", date: "2026-10-19" },
  { id: "job_4712", issue: "Inference model timeout", user: "njeri@startup.io", status: "Manual review", date: "2026-10-18" },
  { id: "job_4500", issue: "Low-quality uploaded selfies", user: "mike@builder.dev", status: "Refund sent", date: "2026-10-17" },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-pink-200">Operations</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">Analytics dashboard</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-zinc-300">Live</div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
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
              {funnel.map((item) => (
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
                <div className="mt-2 text-2xl font-semibold text-white">17.3%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-zinc-400">Avg. revenue / order</div>
                <div className="mt-2 text-2xl font-semibold text-white">$29</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-zinc-400">Refund risk</div>
                <div className="mt-2 text-2xl font-semibold text-white">2.1%</div>
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
                  {paymentRows.map((row) => (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="py-3 pr-4 text-white">{row.id}</td>
                      <td className="py-3 pr-4">{row.method}</td>
                      <td className="py-3 pr-4">{row.amount}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-zinc-200">{row.status}</span>
                      </td>
                      <td className="py-3 pr-4">{row.date}</td>
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
              {failedJobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">{job.id}</div>
                    <div className="rounded-full border border-pink-500/30 bg-pink-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-pink-100">{job.status}</div>
                  </div>
                  <div className="mt-3 text-sm text-zinc-300">{job.issue}</div>
                  <div className="mt-3 text-xs text-zinc-400">{job.user} • {job.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
