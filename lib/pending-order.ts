/** Client-persisted pending order id (survives LemonSqueezy return without URL placeholders). */

export const PENDING_ORDER_STORAGE_KEY = "signalproof_pending_order_id";
/** Set when user leaves for LemonSqueezy; used to recover if LS redirects to / instead of /success. */
export const EXPECTING_CHECKOUT_RETURN_KEY = "signalproof_expecting_checkout_return";

const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPendingOrderId(value: string | null | undefined): boolean {
  const id = value?.trim();
  if (!id) return false;
  if (id.includes("{") || id.includes("}")) return false;
  return ORDER_ID_PATTERN.test(id);
}

export function readPendingOrderId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (isValidPendingOrderId(fromSession)) return fromSession!.trim();
    const fromLocal = localStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (isValidPendingOrderId(fromLocal)) return fromLocal!.trim();
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

export function savePendingOrderId(orderId: string): void {
  if (typeof window === "undefined" || !isValidPendingOrderId(orderId)) return;
  try {
    sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, orderId.trim());
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, orderId.trim());
  } catch {
    /* ignore */
  }
}

export function clearPendingOrderId(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
    localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function markExpectingCheckoutReturn(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(EXPECTING_CHECKOUT_RETURN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isExpectingCheckoutReturn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(EXPECTING_CHECKOUT_RETURN_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearExpectingCheckoutReturn(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(EXPECTING_CHECKOUT_RETURN_KEY);
  } catch {
    /* ignore */
  }
}
