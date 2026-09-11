import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { StatusBadge } from "@/components/ui/badges";
import { formatAmount } from "@/lib/format/currency";

// TODO(Phase 2): make this an admin-configurable org setting (Section 46/48)
// instead of a constant, once the admin settings screen exists.
const ESTIMATED_MANUAL_MINUTES_PER_FORM = 120;

export default async function DashboardPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [formsToday, formsThisMonth, needsReview, recent] = await Promise.all([
    prisma.transaction.count({ where: { organizationId, createdAt: { gte: startOfToday } } }),
    prisma.transaction.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
    prisma.transaction.count({ where: { organizationId, status: "REVIEW_REQUIRED" } }),
    prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const hoursSaved = Math.round((formsThisMonth * ESTIMATED_MANUAL_MINUTES_PER_FORM) / 60);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Forms Today" value={formsToday} />
        <StatCard label="Forms This Month" value={formsThisMonth} />
        <StatCard label="Hours Saved This Month" value={hoursSaved} />
        <StatCard label="Needs Review" value={needsReview} highlight={needsReview > 0} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
        <Link
          href="/transactions/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Create Filled Form
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Document ID</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Created By</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No transactions yet.
                </td>
              </tr>
            )}
            {recent.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/transactions/${tx.id}`} className="font-medium text-slate-900 hover:underline">
                    {tx.documentNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{tx.supplierName ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{tx.invoiceNumber ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">
                  {tx.amount ? `${tx.currency ?? ""} ${formatAmount(tx.amount.toString())}` : "—"}
                </td>
                <td className="px-4 py-2 text-slate-600">{tx.createdBy.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
