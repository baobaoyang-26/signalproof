# SignalProof

Landing page MVP for a Reddit pain point and opportunity report service.

## Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Pages

- `/` - Landing page

Checkout uses LemonSqueezy for **Single Memo** ($29 equivalent; billed as ¥199 CNY at checkout):

| Plan | Status | Env var |
|------|--------|---------|
| Single Memo | Available | `LEMONSQUEEZY_CHECKOUT_SINGLE_MEMO_URL` |
| Advanced Competitive Intelligence | Coming soon | — |

The order form at `/order` redirects to secure checkout after submit. Payment is processed in CNY.

### After payment (local)

1. Set `CHECKOUT_SUCCESS_URL=http://localhost:3000/success` in `.env.local` (default in dev).
2. In LemonSqueezy product settings, set the confirmation / thank-you redirect to the same URL, **or** add `LEMONSQUEEZY_API_KEY` so the app creates checkouts with `redirect_url` automatically.
3. If LemonSqueezy still sends users to `/`, the app detects a pending local order and forwards to `/success`.
