"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  processPendingOrder,
  resolveLatestPendingOrderForDev,
} from "@/app/order/actions";
import {
  clearExpectingCheckoutReturn,
  clearPendingOrderId,
  readPendingOrderId,
  savePendingOrderId,
} from "@/lib/pending-order";
import { SUCCESS_PAGE } from "@/lib/site-copy";

const NO_PENDING_ORDER = "No pending order found.";
/** Stop infinite spinner if OpenAI / scrape hangs. */
const GENERATION_TIMEOUT_MS = 12 * 60 * 1000;

type SuccessClientProps = {
  cookieOrderId: string | null;
  isDev: boolean;
};

type UiStatus = "idle" | "generating" | "done" | "error";

export function SuccessClient({ cookieOrderId, isDev }: SuccessClientProps) {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState<UiStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  const runGeneration = useCallback(
    async (orderId: string) => {
      setStatus("generating");
      setErrorMessage(null);
      console.info("[SignalProof] generating report");

      const timeoutPromise = new Promise<{ error: string }>((resolve) => {
        setTimeout(
          () =>
            resolve({
              error:
                "Report generation timed out after 12 minutes. Check the terminal for errors, then try again or use the dev bypass.",
            }),
          GENERATION_TIMEOUT_MS,
        );
      });

      const result = await Promise.race([processPendingOrder(orderId), timeoutPromise]);

      if ("error" in result) {
        setStatus("error");
        setErrorMessage(result.error);
        return;
      }

      clearPendingOrderId();
      clearExpectingCheckoutReturn();
      setStatus("done");
      console.info("[SignalProof] redirecting to report", result.reportId);
      router.replace(`/report/${result.reportId}`);
    },
    [router],
  );

  const resolvePendingOrderId = useCallback((): string | null => {
    const fromStorage = readPendingOrderId();
    if (fromStorage) return fromStorage;
    if (cookieOrderId) {
      savePendingOrderId(cookieOrderId);
      return cookieOrderId;
    }
    return null;
  }, [cookieOrderId]);

  useEffect(() => {
    console.info("[SignalProof] entered success page");

    if (started.current) return;
    started.current = true;

    const orderId = resolvePendingOrderId();
    if (!orderId) {
      console.warn("[SignalProof] restored pending order (none)");
      setStatus("error");
      setErrorMessage(NO_PENDING_ORDER);
      return;
    }

    console.info("[SignalProof] restored pending order", orderId);
    void runGeneration(orderId);
  }, [resolvePendingOrderId, runGeneration]);

  async function handleDevBypass() {
    setDevLoading(true);
    setErrorMessage(null);
    const latest = await resolveLatestPendingOrderForDev();
    setDevLoading(false);

    if ("error" in latest) {
      setStatus("error");
      setErrorMessage(latest.error);
      return;
    }

    savePendingOrderId(latest.orderId);
    console.info("[SignalProof] pendingOrderId restored=", latest.orderId, "(dev bypass)");
    await runGeneration(latest.orderId);
  }

  const showSpinner = status === "generating";
  const showError = status === "error";
  const showRedirect = status === "done";

  return (
    <main className="notranslate min-h-screen bg-canvas text-white" lang="en" translate="no">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-40" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-16 sm:px-8">
        <div className="w-full rounded-2xl border border-white/[0.08] bg-surface/80 p-6 text-center shadow-card sm:p-10">
          <Link className="mx-auto mb-8 flex w-fit items-center gap-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold">
              S
            </span>
            <span className="text-sm font-semibold tracking-tight">SignalProof</span>
          </Link>

          {showSpinner ? (
            <>
              <p className="text-sm font-medium text-accent">{SUCCESS_PAGE.paymentReceived}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {SUCCESS_PAGE.generatingTitle}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted">
                {SUCCESS_PAGE.generatingBody}
              </p>
              <div
                aria-hidden
                className="mx-auto mt-8 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent"
              />
            </>
          ) : showError ? (
            <>
              <p className="text-sm font-medium text-danger">{SUCCESS_PAGE.errorEyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {SUCCESS_PAGE.errorTitle}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted">
                {errorMessage}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Link
                  className="inline-flex rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-canvas hover:bg-white/90"
                  href="/order"
                >
                  {SUCCESS_PAGE.tryAgain}
                </Link>
                {isDev ? (
                  <button
                    className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white transition hover:border-white/20 disabled:opacity-50"
                    disabled={devLoading}
                    onClick={() => void handleDevBypass()}
                    type="button"
                  >
                    {devLoading ? "Loading…" : "Generate latest pending order"}
                  </button>
                ) : null}
              </div>
            </>
          ) : showRedirect ? (
            <p className="text-sm font-medium text-muted">{SUCCESS_PAGE.redirecting}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-accent">{SUCCESS_PAGE.paymentReceived}</p>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted">
                Restoring your order…
              </p>
              <div
                aria-hidden
                className="mx-auto mt-8 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent"
              />
              {isDev ? (
                <button
                  className="mt-8 inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-muted hover:text-white disabled:opacity-50"
                  disabled={devLoading}
                  onClick={() => void handleDevBypass()}
                  type="button"
                >
                  Generate latest pending order
                </button>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
