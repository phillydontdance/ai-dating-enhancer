export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-4 py-12 text-white">
      <div className="max-w-lg rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-2xl">✓</div>
        <h1 className="text-3xl font-semibold tracking-[-0.06em]">Payment successful</h1>
        <p className="mt-4 text-zinc-300">Your order has been confirmed and processing will begin shortly.</p>
      </div>
    </main>
  );
}
