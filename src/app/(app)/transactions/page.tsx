import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { StatusBadge } from "@/components/ui/badges";
import { formatAmount } from "@/lib/format/currency";
import type { TransactionStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

const STATUS_OPTIONS: TransactionStatus[] = [
  "NEW",
  "FILES_UPLOADED",
  "FORM_ANALYZED",
  "DOCUMENTS_ANALYZED",
  "MAPPING_COMPLETE",
  "REVIEW_REQUIRED",
  "APPROVED_FOR_GENERATION",
  "GENERATED",
  "ARCHIVED",
  "FAILED",
];

/**
 * Full transaction history (Section 24): the "database of every form filled"
 * — the dashboard only surfaces the 10 most recent, this is the complete,
 * searchable record for every transaction in the organization.
 */
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where: Prisma.TransactionWhereInput = {
    organizationId: session.user.organizationId,
    ...(status && STATUS_OPTIONS.includes(status as TransactionStatus)
      ? { status: status as TransactionStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { documentNumber: { contains: q, mode: "insensitive" } },
            { supplierName: { contains: q, mode: "insensitive" } },
            { invoiceNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Transaction History</h1>
        <Link
          href="/transactions/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Create Filled Form
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3" action="/transactions" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search document #, supplier, invoice #"
          className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filter
        </button>
        {(q || status) && (
          <Link href="/transactions" className="text-sm text-slate-500 hover:underline">
            Clear
          </Link>
        )}
        <span className="ml-auto text-sm text-slate-500">{total} total</span>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Document ID</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Created By</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No transactions match.
                </td>
              </tr>
            )}
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/transactions/${tx.id}`} className="font-medium text-slate-900 hover:underline">
                    {tx.documentNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{tx.createdAt.toISOString().slice(0, 10)}</td>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <PageLink page={page - 1} disabled={page <= 1} q={q} status={status} label="Previous" />
          <span>
            Page {page} of {totalPages}
          </span>
          <PageLink page={page + 1} disabled={page >= totalPages} q={q} status={status} label="Next" />
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  q,
  status,
  label,
}: {
  page: number;
  disabled: boolean;
  q?: string;
  status?: string;
  label: string;
}) {
  if (disabled) {
    return <span className="text-slate-300">{label}</span>;
  }
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return (
    <Link href={`/transactions?${params.toString()}`} className="hover:underline">
      {label}
    </Link>
  );
}
