"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getTransactionDateRange, type TimeRange } from "@/lib/date-ranges";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Resource {
  id: string;
  title: string;
  category: string | null;
  quantity_available: number | null;
  quantity_sold: number | null;
  quantity_given: number | null;
  price: number | null;
  location: string | null;
}

interface ResourceTransaction {
  quantity: number;
  type: string;
  amount: number | null;
}

interface InventoryStats {
  booksSold: number;
  revenue: number;
  booksGivenAway: number;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

function formatMoney(value: number | null) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export default function InventoryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    booksSold: 0,
    revenue: 0,
    booksGivenAway: 0,
  });
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .order("title");

        if (error) throw error;
        setResources((data || []) as Resource[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, [supabase]);

  useEffect(() => {
    async function fetchTransactionStats() {
      const { start, end } = getTransactionDateRange(timeRange);

      let query = supabase
        .from("resource_transactions")
        .select("quantity, type, amount")
        .lte("transaction_date", end.toISOString());

      if (start) {
        query = query.gte("transaction_date", start.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setStats({ booksSold: 0, revenue: 0, booksGivenAway: 0 });
        return;
      }

      const nextStats = ((data || []) as ResourceTransaction[]).reduce<InventoryStats>(
        (totals, transaction) => {
          if (transaction.type === "sale") {
            totals.booksSold += Number(transaction.quantity || 0);
            totals.revenue += Number(transaction.amount || 0);
          } else if (transaction.type === "giveaway") {
            totals.booksGivenAway += Number(transaction.quantity || 0);
          }
          return totals;
        },
        { booksSold: 0, revenue: 0, booksGivenAway: 0 },
      );

      setStats(nextStats);
    }

    fetchTransactionStats();
  }, [supabase, timeRange]);

  const filteredResources = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.category || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const selectedRangeLabel =
    timeRangeOptions.find((option) => option.value === timeRange)?.label ??
    "Selected range";

  const metrics = [
    {
      label: "Books Sold",
      value: stats.booksSold.toLocaleString(),
      detail: selectedRangeLabel,
    },
    {
      label: "Revenue",
      value: formatMoney(stats.revenue),
      detail: selectedRangeLabel,
    },
    {
      label: "Books Given",
      value: stats.booksGivenAway.toLocaleString(),
      detail: selectedRangeLabel,
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Literature Inventory
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Inventory
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Track books, resources, and distribution activity.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/inventory/new";
          }}
        >
          Add Resource
        </Button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-headline text-headline-md text-on-surface">
              Inventory Activity
            </h2>
            <p className="text-sm text-on-surface-variant">
              Sales and giveaways for the selected range.
            </p>
          </div>
          <select
            className="focus-ring w-full rounded-lg border border-outline-variant/20 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus-visible:border-primary sm:w-48"
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value as TimeRange)}
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label} padding="md" className="space-y-3">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                {metric.label}
              </span>
              <p className="font-headline text-headline-md font-bold tabular-nums text-on-surface">
                {metric.value}
              </p>
              <p className="text-sm text-on-surface-variant">
                {metric.detail}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
        <Input
          variant="search"
          type="text"
          placeholder="Search resources..."
          className="pl-11"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </section>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-on-surface-variant">Loading inventory...</p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading inventory: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : filteredResources.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <BookOpen className="h-8 w-8 text-on-surface-variant/50" />
          <p className="mt-4 text-on-surface-variant">No resources found.</p>
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
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Available</th>
                  <th className="px-6 py-3">Sold</th>
                  <th className="px-6 py-3">Given</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((resource) => (
                  <tr
                    key={resource.id}
                    className="border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/inventory/${resource.id}`}
                        className="font-bold text-on-surface hover:text-primary"
                      >
                        {resource.title}
                      </Link>
                      {resource.location ? (
                        <p className="text-xs text-on-surface-variant">
                          {resource.location}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-on-surface">
                      {resource.category || "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 font-semibold tabular-nums text-on-surface">
                      {resource.quantity_available || 0}
                    </td>
                    <td className="px-6 py-4 font-semibold tabular-nums text-on-surface">
                      {resource.quantity_sold || 0}
                    </td>
                    <td className="px-6 py-4 font-semibold tabular-nums text-on-surface">
                      {resource.quantity_given || 0}
                    </td>
                    <td className="px-6 py-4 tabular-nums text-on-surface">
                      {formatMoney(resource.price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/inventory/${resource.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
