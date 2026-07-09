"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface GivingStatementGift {
  id: string;
  gift_date: string;
  amount: number;
  method: string | null;
}

interface GivingStatementViewProps {
  orgName: string;
  entityName: string;
  entityType: "donor" | "church";
  year: number;
  gifts: GivingStatementGift[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatGiftDate(value: string) {
  const date = DATE_RE.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatMethod(value: string | null) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function GivingStatementView({
  orgName,
  entityName,
  entityType,
  year,
  gifts,
}: GivingStatementViewProps) {
  const sortedGifts = [...gifts].sort((a, b) =>
    a.gift_date.localeCompare(b.gift_date),
  );
  const total = sortedGifts.reduce(
    (sum, gift) => sum + Number(gift.amount || 0),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="mb-6 flex justify-end print:hidden">
        <Button type="button" icon={Printer} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <div className="rounded-xl border border-outline-variant/15 bg-white p-8 text-black shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="mb-8 border-b border-black/15 pb-6 text-center">
          <p className="text-lg font-bold">{orgName}</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold">
            Annual Giving Statement
          </h1>
          <p className="mt-1 text-sm text-black/60">{year}</p>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-black/50">
            {entityType === "church" ? "Church" : "Donor"}
          </p>
          <p className="text-base font-semibold">{entityName}</p>
        </header>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left">
              <th className="py-2 pr-4 font-semibold">Date</th>
              <th className="py-2 pr-4 font-semibold">Method</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sortedGifts.length > 0 ? (
              sortedGifts.map((gift) => (
                <tr key={gift.id} className="border-b border-black/10">
                  <td className="py-2 pr-4">{formatGiftDate(gift.gift_date)}</td>
                  <td className="py-2 pr-4">{formatMethod(gift.method)}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatCurrency(Number(gift.amount || 0))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-6 text-center text-black/60">
                  No gifts recorded for {year}.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black/40 font-semibold">
              <td className="py-3 pr-4" colSpan={2}>
                Total
              </td>
              <td className="py-3 text-right tabular-nums">
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-10 text-xs text-black/70">
          No goods or services were provided in exchange for these contributions.
        </p>
      </div>
    </div>
  );
}
