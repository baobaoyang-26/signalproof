import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createReportForOrder } from "@/lib/reports";

export type OrderStatus = "pending";

export type Order = {
  id: string;
  reportId: string;
  email: string;
  socialProfileUrl: string;
  industryNiche: string;
  mainConcern: string;
  additionalNotes: string;
  createdAt: string;
  status: OrderStatus;
};

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

export async function readOrders(): Promise<Order[]> {
  await ensureOrdersFile();
  const raw = await readFile(ORDERS_FILE, "utf8");
  const orders = JSON.parse(raw) as Order[];
  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export type CreateOrderInput = {
  email: string;
  socialProfileUrl: string;
  industryNiche: string;
  mainConcern: string;
  additionalNotes: string;
};

export async function createOrderWithReport(
  input: CreateOrderInput,
): Promise<{ order: Order; reportId: string }> {
  await ensureOrdersFile();
  const orders = await readOrders();

  const orderId = randomUUID();
  const reportId = randomUUID();

  await createReportForOrder(orderId, input, reportId);

  const order: Order = {
    id: orderId,
    reportId,
    email: input.email,
    socialProfileUrl: input.socialProfileUrl,
    industryNiche: input.industryNiche,
    mainConcern: input.mainConcern,
    additionalNotes: input.additionalNotes,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  orders.unshift(order);
  await writeFile(ORDERS_FILE, `${JSON.stringify(orders, null, 2)}\n`, "utf8");

  return { order, reportId };
}
