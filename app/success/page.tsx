import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-16 sm:px-8">
        <div className="w-full rounded-2xl border border-[#eeeeee] bg-[#fafafa] p-6 text-center sm:p-10">
          <Link className="mx-auto mb-8 flex w-fit items-center gap-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d4d4d4] bg-white text-sm font-semibold">
              S
            </span>
            <span className="text-sm font-semibold tracking-tight">SignalProof</span>
          </Link>
          <p className="text-sm font-medium text-[#737373]">Thank you</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            We received your order.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#525252]">
            Your Reddit opportunity report will be delivered within 24 hours.
            We will review your niche, extract the strongest public market
            signals, and send the report to your email.
          </p>
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-[#eeeeee] bg-white p-5 text-left">
            <p className="text-sm font-semibold">Contact email</p>
            <a
              className="mt-2 block text-sm text-[#525252] underline underline-offset-4 transition hover:text-[#0a0a0a]"
              href="mailto:hello@signalproof.co"
            >
              hello@signalproof.co
            </a>
          </div>
          <Link
            className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-[#0a0a0a] px-5 py-3.5 text-base font-medium text-white transition hover:bg-[#2a2a2a] sm:w-auto"
            href="/"
          >
            Back to homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
