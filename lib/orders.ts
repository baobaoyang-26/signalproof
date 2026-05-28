import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseCheckoutPlan, type CheckoutPlan } from "@/lib/checkout";

export type OrderStatus =
  | "pending_payment"
  | "generating"
  | "completed"
  | "failed"
  | "pending";

export type Order = {
  id: string;
  reportId?: string;
  email: string;
  startupIdea: string;
  additionalContext: string;
  createdAt: string;
  status: OrderStatus;
  plan?: CheckoutPlan;
  /** Legacy records */
  socialProfileUrl?: string;
  industryNiche?: string;
  mainConcern?: string;
  additionalNotes?: string;
};

export const PENDING_ORDER_COOKIE = "signalproof_order_id";

const ORDERS_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(ORDERS_DIR, "orders.json");

async function ensureOrdersFile() {
  await mkdir(ORDERS_DIR, { recursive: true });
  try {
    await readFile(ORDERS_FILE, "utf8");
  } catch {
    await writeFile(ORDERS_FILE, "[]\n", "utf8");
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  await writeFile(ORDERS_FILE, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

export async function getOrderByReportId(reportId: string): Promise<Order | null> {
  const orders = await readOrders();
  return orders.find((o) => o.reportId === reportId) ?? null;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const orders = await readOrders();
  return orders.find((o) => o.id === orderId) ?? null;
}

export async function readOrders(): Promise<Order[]> {
  await ensureOrdersFile();
  const raw = await readFile(ORDERS_FILE, "utf8");
  const orders = JSON.parse(raw) as Order[];
  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Newest order useful for local dev bypass on /success. */
export async function getLatestPendingOrderForDev(): Promise<Order | null> {
  const orders = await readOrders();
  const withoutReport = orders.filter((o) => !o.reportId);
  const candidate =
    withoutReport.find(
      (o) =>
        o.status === "pending_payment" ||
        o.status === "pending" ||
        o.status === "generating" ||
        o.status === "failed",
    ) ?? withoutReport[0];
  return candidate ?? orders[0] ?? null;
}

export type CreateOrderInput = {
  email: string;
  startupIdea: string;
  additionalContext: string;
  plan?: CheckoutPlan;
};

/** Normalize stored orders (legacy website flow → startup intelligence). */
export function orderToCreateInput(order: Order): CreateOrderInput {
  if (order.startupIdea?.trim()) {
    return {
      email: order.email,
      startupIdea: order.startupIdea.trim(),
      additionalContext: order.additionalContext?.trim() ?? "",
      plan: order.plan,
    };
  }
  const legacyNotes = [order.socialProfileUrl, order.additionalNotes]
    .filter((s) => s?.trim())
    .join("\n");
  return {
    email: order.email,
    startupIdea:
      order.mainConcern?.trim() ||
      [order.industryNiche, order.mainConcern].filter(Boolean).join("\n\n") ||
      "Startup submission",
    additionalContext: legacyNotes,
    plan: order.plan,
  };
}

export async function createPendingOrder(input: CreateOrderInput): Promise<Order> {
  await ensureOrdersFile();
  const orders = await readOrders();

  const order: Order = {
    id: randomUUID(),
    email: input.email.trim(),
    startupIdea: input.startupIdea.trim(),
    additionalContext: input.additionalContext.trim(),
    plan: parseCheckoutPlan(input.plan),
    createdAt: new Date().toISOString(),
    status: "pending_payment",
  };

  orders.unshift(order);
  await writeOrders(orders);
  return order;
}

async function updateOrder(orderId: string, patch: Partial<Order>): Promise<Order | null> {
  await ensureOrdersFile();
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch };
  await writeOrders(orders);
  return orders[idx];
}

export async function fulfillOrderWithReport(orderId: string): Promise<{
  order: Order;
  reportId: string;
}> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const { createReportForOrder, getReportById } = await import("@/lib/reports");

  if (order.reportId) {
    const existing = await getReportById(order.reportId);
    if (existing) {
      console.info("[SignalProof] report already exists for order", orderId, order.reportId);
      return { order, reportId: order.reportId };
    }
  }

  console.info("[SignalProof] report generation started after payment", orderId);
  await updateOrder(orderId, { status: "generating" });

  const reportId = order.reportId ?? randomUUID();
  const input = orderToCreateInput(order);

  try {
    await createReportForOrder(orderId, input, reportId);
    const updated = await updateOrder(orderId, {
      reportId,
      status: "completed",
    });
    console.info("[SignalProof] report generation completed", reportId);
    return { order: updated ?? { ...order, reportId, status: "completed" }, reportId };
  } catch (error) {
    console.error("[SignalProof] report generation failed for order", orderId, error);
    await updateOrder(orderId, { status: "failed" });
    throw error;
  }
}

export async function createOrderWithReport(
  input: CreateOrderInput,
): Promise<{ order: Order; reportId: string }> {
  const order = await createPendingOrder(input);
  const { reportId } = await fulfillOrderWithReport(order.id);
  const final = (await getOrderById(order.id)) ?? order;
  return { order: final, reportId };
}
