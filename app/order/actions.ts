"use server";

import { cookies } from "next/headers";
import {
  CHECKOUT_NOT_CONFIGURED_MESSAGE,
  isSellablePlan,
  parseCheckoutPlan,
  resolveCheckoutUrlAsync,
} from "@/lib/checkout";
import { getCheckoutSuccessUrl } from "@/lib/checkout-success-url";
import { validateOrderFields } from "@/lib/order-form-validation";
import { isValidPendingOrderId } from "@/lib/pending-order";
import {
  createPendingOrder,
  fulfillOrderWithReport,
  getLatestPendingOrderForDev,
  getOrderById,
  PENDING_ORDER_COOKIE,
} from "@/lib/orders";

function getField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type OrderFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "startupIdea", string>>;
  orderId?: string;
  checkoutUrl?: string;
};

export type ProcessPendingOrderResult =
  | { reportId: string; existing?: boolean }
  | { error: string };

export async function submitOrderForm(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  console.info("[SignalProof] submit order");

  const email = getField(formData, "email");
  const startupIdea = getField(formData, "startupIdea");
  const additionalContext = getField(formData, "additionalContext");
  const plan = parseCheckoutPlan(getField(formData, "plan"));

  const validation = validateOrderFields({ email, startupIdea });

  if (!validation.allValid) {
    return { fieldErrors: validation.fieldErrors };
  }

  if (!isSellablePlan(plan)) {
    return { error: "Advanced Competitive Intelligence is coming soon." };
  }

  const order = await createPendingOrder({
    email,
    startupIdea,
    additionalContext,
    plan: "single_memo",
  });

  console.info("[SignalProof] local order created orderId=", order.id);

  const cookieStore = await cookies();
  cookieStore.set(PENDING_ORDER_COOKIE, order.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  const successUrl = getCheckoutSuccessUrl();
  console.info("[SignalProof] checkout success URL", successUrl || "(not set)");

  const checkout = await resolveCheckoutUrlAsync("single_memo", {
    id: order.id,
    email: order.email,
  });
  if (!checkout.ok) {
    console.warn("[SignalProof] checkout not configured", checkout.message);
    return { error: CHECKOUT_NOT_CONFIGURED_MESSAGE };
  }

  console.info("[SignalProof] redirecting checkout", checkout.url.slice(0, 80) + "…");
  return { orderId: order.id, checkoutUrl: checkout.url };
}

export async function processPendingOrder(
  orderId: string,
): Promise<ProcessPendingOrderResult> {
  if (!isValidPendingOrderId(orderId)) {
    return { error: "No pending order found." };
  }

  const id = orderId.trim();
  console.info("[SignalProof] generating report for orderId=", id);

  const order = await getOrderById(id);
  if (!order) {
    return {
      error: `Order not found (${id}). Submit the order form again before checkout.`,
    };
  }

  console.info(
    "[SignalProof] order loaded=",
    order.id,
    "status=",
    order.status,
    "reportId=",
    order.reportId ?? "(none)",
  );

  if (order.reportId) {
    const { getReportById } = await import("@/lib/reports");
    const existing = await getReportById(order.reportId);
    if (existing) {
      console.info("[SignalProof] report generated reportId=", order.reportId, "(existing)");
      const cookieStore = await cookies();
      cookieStore.delete(PENDING_ORDER_COOKIE);
      return { reportId: order.reportId, existing: true };
    }
  }

  try {
    const { reportId } = await fulfillOrderWithReport(id);
    const cookieStore = await cookies();
    cookieStore.delete(PENDING_ORDER_COOKIE);
    console.info("[SignalProof] report generated reportId=", reportId);
    return { reportId };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Report generation failed. Check server logs or try again.";
    console.error("[SignalProof] processPendingOrder failed:", message);
    return { error: message };
  }
}

/** @deprecated Use processPendingOrder */
export async function generateReportAfterPayment(
  orderId: string,
): Promise<{ reportId: string } | { error: string }> {
  const result = await processPendingOrder(orderId);
  if ("error" in result) return { error: result.error };
  return { reportId: result.reportId };
}

export async function resolveLatestPendingOrderForDev(): Promise<
  { orderId: string } | { error: string }
> {
  if (process.env.NODE_ENV === "production") {
    return { error: "Dev bypass is not available in production." };
  }

  const order = await getLatestPendingOrderForDev();
  if (!order) {
    return { error: "No orders found in data/orders.json." };
  }

  console.info("[SignalProof] dev bypass latest order", order.id);
  return { orderId: order.id };
}
