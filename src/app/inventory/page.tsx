"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTransactionDateRange, type TimeRange } from "@/lib/date-ranges";

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
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

function formatMoney(value: number | null) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function InventoryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<InventoryStats>({ booksSold: 0, revenue: 0, booksGivenAway: 0 });
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('title');

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
        .from('resource_transactions')
        .select('quantity, type, amount')
        .lte('transaction_date', end.toISOString());

      if (start) {
        query = query.gte('transaction_date', start.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setStats({ booksSold: 0, revenue: 0, booksGivenAway: 0 });
        return;
      }

      const nextStats = ((data || []) as ResourceTransaction[]).reduce<InventoryStats>((totals, transaction) => {
        if (transaction.type === 'sale') {
          totals.booksSold += Number(transaction.quantity || 0);
          totals.revenue += Number(transaction.amount || 0);
        } else if (transaction.type === 'giveaway') {
          totals.booksGivenAway += Number(transaction.quantity || 0);
        }

        return totals;
      }, { booksSold: 0, revenue: 0, booksGivenAway: 0 });

      setStats(nextStats);
    }

    fetchTransactionStats();
  }, [supabase, timeRange]);

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-zinc-500">Track books and resources available for sale or giveaway.</p>
        </div>
        <Link href="/inventory/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add resource
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Inventory Activity</h2>
            <p className="text-sm text-zinc-500">Sales and giveaways by transaction date.</p>
          </div>
          <select
            className="w-full sm:w-48 px-3 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as TimeRange)}
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">Books Sold</p>
            <p className="text-2xl font-bold">{stats.booksSold}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(stats.revenue)}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">Books Given Away</p>
            <p className="text-2xl font-bold">{stats.booksGivenAway}</p>
          </div>
        </div>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search resources..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-zinc-500">Loading inventory...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600">Error loading inventory: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-red-700 underline">Try again</button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <BookOpen className="h-8 w-8 text-zinc-300" />
          <p className="mt-4 text-zinc-500">No resources found.</p>
          {searchTerm && <button onClick={() => setSearchTerm("")} className="mt-2 text-blue-600 hover:underline">Clear search</button>}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 font-medium">
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
            <tbody className="divide-y dark:divide-zinc-800">
              {filteredResources.map(resource => (
                <tr key={resource.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/inventory/${resource.id}`} className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline">
                      {resource.title}
                    </Link>
                    {resource.location ? <p className="text-xs text-zinc-500">{resource.location}</p> : null}
                  </td>
                  <td className="px-6 py-4">{resource.category || "Uncategorized"}</td>
                  <td className="px-6 py-4 font-medium">{resource.quantity_available || 0}</td>
                  <td className="px-6 py-4 font-medium">{resource.quantity_sold || 0}</td>
                  <td className="px-6 py-4 font-medium">{resource.quantity_given || 0}</td>
                  <td className="px-6 py-4">{formatMoney(resource.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/inventory/${resource.id}`} className="text-blue-600 hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
