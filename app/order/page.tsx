import Link from "next/link";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/placeholder";

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d4d4d4] bg-white text-sm font-semibold">
            S
          </span>
          <span className="text-sm font-semibold tracking-tight">SignalProof</span>
        </Link>
        <Link className="text-sm font-medium text-[#666] transition hover:text-[#0a0a0a]" href="/">
          Back to site
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
        <div>
          <p className="text-sm font-medium text-[#737373]">Order report</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Tell us what market you want to validate.
          </h1>
          <p className="mt-5 text-base leading-7 text-[#525252]">
            Submit the details below. In the live version, this page will send
            you through a Stripe Payment Link before confirmation.
          </p>
          <div className="mt-8 rounded-xl border border-[#e5e5e5] bg-white p-5">
            <p className="text-sm font-semibold">Payment placeholder</p>
            <p className="mt-2 text-sm leading-6 text-[#525252]">
              Replace this with your real Stripe Payment Link:
            </p>
            <a
            className="mt-3 inline-flex rounded-md border border-[#d4d4d4] bg-[#fafafa] px-3 py-2 text-sm text-[#525252]"
              href={STRIPE_PAYMENT_LINK}
            >
              {STRIPE_PAYMENT_LINK}
            </a>
          </div>
        </div>

        <form
          action="/success"
          className="rounded-2xl border border-[#eeeeee] bg-[#fafafa] p-5 sm:p-6"
          method="get"
        >
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Email</span>
              <input
                className="rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-base outline-none transition placeholder:text-[#a3a3a3] focus:border-[#0a0a0a]"
                name="email"
                placeholder="founder@company.com"
                required
                type="email"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Niche</span>
              <input
                className="rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-base outline-none transition placeholder:text-[#a3a3a3] focus:border-[#0a0a0a]"
                name="niche"
                placeholder="AI tools for freelancers"
                required
                type="text"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Target audience</span>
              <input
                className="rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-base outline-none transition placeholder:text-[#a3a3a3] focus:border-[#0a0a0a]"
                name="audience"
                placeholder="Solo consultants, small agencies, indie hackers"
                required
                type="text"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Competitors</span>
              <input
                className="rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-base outline-none transition placeholder:text-[#a3a3a3] focus:border-[#0a0a0a]"
                name="competitors"
                placeholder="Optional: tools, alternatives, or products to compare"
                type="text"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Goal</span>
              <textarea
                className="min-h-28 resize-y rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-base outline-none transition placeholder:text-[#a3a3a3] focus:border-[#0a0a0a]"
                name="goal"
                placeholder="What decision should this report help you make?"
                required
              />
            </label>
          </div>

          <button
            className="mt-6 w-full rounded-md bg-[#0a0a0a] px-5 py-3.5 text-base font-medium text-white transition hover:bg-[#2a2a2a]"
            type="submit"
          >
            Continue to confirmation
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-[#737373]">
            MVP note: this lightweight form does not create an account or store
            data yet.
          </p>
        </form>
      </section>
    </main>
  );
}
