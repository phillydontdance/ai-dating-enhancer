const privacyItems = [
  {
    title: "What we store",
    description:
      "We store the selfies you upload, the selected background choice, payment details, and the generated image files needed to deliver the final headshots.",
  },
  {
    title: "How long photos are kept",
    description:
      "Uploaded selfies are deleted after 7 days unless you request a final download. Final image packages remain available until you ask for removal.",
  },
  {
    title: "Analytics",
    description:
      "We record product events such as uploads, checkout starts, payments, and downloads to measure usage and improve reliability.",
  },
  {
    title: "Payments and compliance",
    description:
      "Stripe and M-Pesa handle the transaction processing. We retain a payment record with amounts, status, method, and timestamps for fraud checks, refunds, and compliance.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-12 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_24px_var(--shadow)] sm:p-10">
        <div className="mb-10">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Privacy policy</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">Your photos, data, and account usage</h1>
        </div>

        <div className="space-y-6 text-[var(--muted)]">
          <p>
            Headshotly handles personal data only as needed to produce your photos, process payments, and keep the service reliable.
          </p>

          {privacyItems.map((item) => (
            <section key={item.title} className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-5">
              <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">{item.title}</h2>
              <p className="leading-7">{item.description}</p>
            </section>
          ))}

          <section className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-5">
            <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Your rights</h2>
            <p className="leading-7">
              You can request access to your stored photos or payment history, or ask for account data removal. We handle these requests through the account and service workflow.
            </p>
          </section>

          <section className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-5">
            <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Retention and deletion</h2>
            <p className="leading-7">
              Uploaded selfies are removed after 7 days from secure storage. Payment records are kept only as long as needed for compliance, refunds, and support.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
