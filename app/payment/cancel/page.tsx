export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-4 py-12 text-white">
      <div className="max-w-lg rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700 text-2xl">!</div>
        <h1 className="text-3xl font-semibold tracking-[-0.06em]">Payment cancelled</h1>
        <p className="mt-4 text-zinc-300">Your checkout was cancelled. You can try again or choose M-Pesa instead.</p>
      </div>
    </main>
  );
}
