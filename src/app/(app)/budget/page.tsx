"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface BudgetEntry {
  id: string;
  org_id: string;
  project_id: string | null;
  category: string;
  name: string;
  needed: number;
  raised: number;
  is_project_based: boolean;
  created_at: string;
  updated_at: string;
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function getFundingPercent(raised: number, needed: number) {
  if (!needed) return 0;
  return Math.min(100, Math.round((raised / needed) * 100));
}

function groupByCategory(entries: BudgetEntry[]) {
  return entries.reduce<Record<string, BudgetEntry[]>>((groups, entry) => {
    const category = entry.category || "Uncategorized";
    groups[category] = groups[category] || [];
    groups[category].push(entry);
    return groups;
  }, {});
}

export default function BudgetPage() {
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchBudgetEntries() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("budget_entries")
          .select("*")
          .order("category")
          .order("name");

        if (error) throw error;
        setEntries((data || []) as BudgetEntry[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetEntries();
  }, [supabase]);

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalNeeded = entries.reduce(
    (sum, entry) => sum + Number(entry.needed || 0),
    0,
  );
  const totalRaised = entries.reduce(
    (sum, entry) => sum + Number(entry.raised || 0),
    0,
  );
  const remaining = totalNeeded - totalRaised;
  const overallPercent = getFundingPercent(totalRaised, totalNeeded);
  const groupedEntries = groupByCategory(filteredEntries);

  const metrics = [
    {
      label: "Total Needed",
      value: formatMoney(totalNeeded),
      detail: "Budget required",
    },
    {
      label: "Total Raised",
      value: formatMoney(totalRaised),
      detail: "Funds received",
    },
    {
      label: "Remaining",
      value: formatMoney(remaining),
      detail: "Still needed",
    },
    {
      label: "Overall Funded",
      value: `${overallPercent}%`,
      detail: "Raised / needed",
      progress: overallPercent,
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Budget Overview
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Budget
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Track ministry budget needs and funding progress.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/budget/new";
          }}
        >
          Add Entry
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-cs-md md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} padding="md" className="space-y-3">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              {metric.label}
            </span>
            <p className="font-headline text-headline-md font-bold tabular-nums text-on-surface">
              {metric.value}
            </p>
            <p className="text-sm text-on-surface-variant">{metric.detail}</p>
            {typeof metric.progress === "number" ? (
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary-container"
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            ) : null}
          </Card>
        ))}
      </section>

      <section className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
        <Input
          variant="search"
          type="text"
          placeholder="Search budget entries..."
          className="pl-11"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </section>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-on-surface-variant">Loading budget...</p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading budget: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <DollarSign className="h-8 w-8 text-on-surface-variant/50" />
          <p className="mt-4 text-on-surface-variant">
            No budget entries found.
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              Clear search
            </button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-gutter">
          {Object.entries(groupedEntries).map(([category, categoryEntries]) => (
            <Card
              key={category}
              padding="none"
              className="overflow-hidden"
            >
              <Card.Header>
                <h2 className="font-headline text-headline-md text-on-surface">
                  {category}
                </h2>
              </Card.Header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Needed</th>
                      <th className="px-6 py-3">Raised</th>
                      <th className="px-6 py-3">Progress</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryEntries.map((entry) => {
                      const percent = getFundingPercent(
                        Number(entry.raised || 0),
                        Number(entry.needed || 0),
                      );

                      return (
                        <tr
                          key={entry.id}
                          className="border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                        >
                          <td className="px-6 py-4">
                            <Link
                              href={`/budget/${entry.id}/edit`}
                              className="font-bold text-on-surface hover:text-primary"
                            >
                              {entry.name}
                            </Link>
                            {entry.is_project_based ? (
                              <p className="text-xs text-on-surface-variant">
                                Project-based
                              </p>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 font-semibold tabular-nums text-on-surface">
                            {formatMoney(Number(entry.needed || 0))}
                          </td>
                          <td className="px-6 py-4 font-semibold tabular-nums text-primary">
                            {formatMoney(Number(entry.raised || 0))}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="font-semibold tabular-nums text-on-surface">
                                  {percent}%
                                </span>
                                <span className="tabular-nums text-on-surface-variant">
                                  {formatMoney(
                                    Number(entry.needed || 0) -
                                      Number(entry.raised || 0),
                                  )}{" "}
                                  left
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                                <div
                                  className="h-full rounded-full bg-primary-container"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/budget/${entry.id}/edit`}
                              className="font-semibold text-primary hover:underline"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
