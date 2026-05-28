import Link from "next/link";
import { AdminShell } from "@/components/ui/admin-shell";
import { Card } from "@/components/ui/card";
import { readOrders } from "@/lib/orders";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminOrdersPage() {
  const orders = await readOrders();
  const pending = orders.filter(
    (o) => o.status === "pending_payment" || o.status === "pending",
  ).length;

  return (
    <AdminShell
      description={`${orders.length} submission${orders.length === 1 ? "" : "s"} in data/orders.json · ${pending} pending.`}
      title="Order submissions"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">Total</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{orders.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">Pending</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-warn">{pending}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">With report</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-success">
            {orders.filter((o) => o.reportId).length}
          </p>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card className="mt-10 p-10 text-center">
          <p className="text-muted">No submissions yet.</p>
          <Link
            className="mt-6 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-white/90"
            href="/order"
          >
            Go to order form
          </Link>
        </Card>
      ) : (
        <>
          <div className="mt-10 grid gap-4 lg:hidden">
            {orders.map((order) => (
              <Card className="p-5" key={order.id}>
                <p className="text-xs text-subtle">{formatDate(order.createdAt)}</p>
                <p className="mt-2 font-medium">{order.email}</p>
                <p className="mt-1 text-sm text-muted line-clamp-3">
                  {order.startupIdea ?? order.mainConcern ?? "—"}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs capitalize text-muted">
                    {order.status}
                  </span>
                  {order.reportId ? (
                    <Link
                      className="text-sm font-medium text-accent"
                      href={`/report/${order.reportId}`}
                    >
                      View report →
                    </Link>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-10 hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-5 py-4 font-medium text-subtle">Created</th>
                    <th className="px-5 py-4 font-medium text-subtle">Report</th>
                    <th className="px-5 py-4 font-medium text-subtle">Email</th>
                    <th className="px-5 py-4 font-medium text-subtle">Startup idea</th>
                    <th className="px-5 py-4 font-medium text-subtle">Context</th>
                    <th className="px-5 py-4 font-medium text-subtle">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {orders.map((order) => (
                    <tr className="align-top hover:bg-white/[0.02]" key={order.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-muted">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        {order.reportId ? (
                          <Link
                            className="font-mono text-xs text-accent hover:underline"
                            href={`/report/${order.reportId}`}
                          >
                            {order.reportId.slice(0, 8)}…
                          </Link>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium">{order.email}</td>
                      <td className="max-w-[16rem] px-5 py-4 text-muted line-clamp-3">
                        {order.startupIdea ?? order.mainConcern ?? "—"}
                      </td>
                      <td className="max-w-[10rem] px-5 py-4 text-muted line-clamp-2">
                        {order.additionalContext ?? order.additionalNotes ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs capitalize text-muted">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AdminShell>
  );
}
