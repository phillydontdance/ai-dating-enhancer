const privacyItems = [
  {
    title: "What we store",
    description:
      "We store the selfies you upload, the selected style/background settings, payment metadata, and generated output files needed to produce your final headshots.",
  },
  {
    title: "How long photos are kept",
    description:
      "Uploaded selfies are auto-deleted after 7 days unless you request a download of the final generated set. Final image packages remain available for your account until you delete them or request removal.",
  },
  {
    title: "Analytics",
    description:
      "We log product events such as page views, uploads started, payment initiation, payment completion, and downloads for internal analytics, conversion measurement, and service reliability monitoring.",
  },
  {
    title: "Payments and compliance",
    description:
      "Stripe and M-Pesa transactions are processed through their respective secure payment systems. We maintain a payment record with method, amount, status, user ID, and timestamps to support fraud checks, refunds, and Kenya Data Protection Act obligations.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#090909] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-10">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.22em] text-pink-200">Privacy policy</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-white">Your photos, data, and analytics usage</h1>
        </div>

        <div className="space-y-6 text-zinc-300">
          <p>
            Headshotly is committed to handling personal data with care. We collect only the information needed to provide the AI portrait service, process payments, and improve the platform.
          </p>

          {privacyItems.map((item) => (
            <section key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
              <h2 className="mb-2 text-xl font-semibold text-white">{item.title}</h2>
              <p className="leading-7">{item.description}</p>
            </section>
          ))}

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-2 text-xl font-semibold text-white">Your rights</h2>
            <p className="leading-7">
              You may request access to your stored photos, payment history, or deletion of your account records. For Kenyan users, this includes requests regarding data processing under the Kenya Data Protection Act and related safeguards for personal data and mobile payments.
            </p>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-2 text-xl font-semibold text-white">Retention and deletion</h2>
            <p className="leading-7">
              Uploaded selfies are automatically removed after 7 days from secure storage. We use encryption at rest and secure access controls. Payment records are retained only as long as necessary for compliance, fraud review, and refund tracking.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
