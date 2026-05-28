"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  isExpectingCheckoutReturn,
  readPendingOrderId,
} from "@/lib/pending-order";

/**
 * LemonSqueezy products often redirect to the store homepage (/) instead of /success.
 * If we have a pending local order, send the user to /success to generate the report.
 */
export function CheckoutReturnGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/") return;
    if (!isExpectingCheckoutReturn()) return;

    const orderId = readPendingOrderId();
    if (!orderId) return;

    console.info(
      "[SignalProof] checkout returned to homepage — redirecting to /success",
      orderId,
    );
    router.replace("/success");
  }, [pathname, router]);

  return null;
}
