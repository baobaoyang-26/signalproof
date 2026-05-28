import { cookies } from "next/headers";
import { PENDING_ORDER_COOKIE } from "@/lib/orders";
import { isValidPendingOrderId } from "@/lib/pending-order";
import { SuccessClient } from "./success-client";

export default async function SuccessPage() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(PENDING_ORDER_COOKIE)?.value;
  const cookieOrderId = isValidPendingOrderId(rawCookie) ? rawCookie!.trim() : null;

  return (
    <SuccessClient
      cookieOrderId={cookieOrderId}
      isDev={process.env.NODE_ENV !== "production"}
    />
  );
}
