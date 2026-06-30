"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Loader2, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
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
          .from('budget_entries')
          .select('*')
          .order('category')
          .order('name');

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

  const filteredEntries = entries.filter(entry =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const groupedEntries = groupByCategory(filteredEntries);
  const totalNeeded = entries.reduce((sum, entry) => sum + Number(entry.needed || 0), 0);
  const totalRaised = entries.reduce((sum, entry) => sum + Number(entry.raised || 0), 0);
  const remaining = totalNeeded - totalRaised;
  const overallPercent = getFundingPercent(totalRaised, totalNeeded);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget</h1>
          <p className="text-zinc-500">Track planned budget lines across the organization.</p>
        </div>
        <Link href="/budget/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          New budget entry
        </Link>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 font-medium">Total Needed</p>
          <p className="text-2xl font-bold">{formatMoney(totalNeeded)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 font-medium">Total Raised</p>
          <p className="text-2xl font-bold text-green-600">{formatMoney(totalRaised)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 font-medium">Remaining</p>
          <p className="text-2xl font-bold">{formatMoney(remaining)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 font-medium">Overall Funded</p>
          <p className="text-2xl font-bold">{overallPercent}%</p>
          <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search budget entries..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-zinc-500">Loading budget...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600">Error loading budget: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-red-700 underline">Try again</button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <DollarSign className="h-8 w-8 text-zinc-300" />
          <p className="mt-4 text-zinc-500">No budget entries found.</p>
          {searchTerm && <button onClick={() => setSearchTerm("")} className="mt-2 text-blue-600 hover:underline">Clear search</button>}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([category, categoryEntries]) => (
            <section key={category} className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
              <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800">
                <h2 className="font-semibold">{category}</h2>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50/70 border-b dark:bg-zinc-800/30 dark:border-zinc-800 text-zinc-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Needed</th>
                    <th className="px-6 py-3">Raised</th>
                    <th className="px-6 py-3">Progress</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-800">
                  {categoryEntries.map(entry => {
                    const percent = getFundingPercent(Number(entry.raised || 0), Number(entry.needed || 0));

                    return (
                      <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/budget/${entry.id}/edit`} className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline">
                            {entry.name}
                          </Link>
                          {entry.is_project_based ? <p className="text-xs text-zinc-500">Project based</p> : null}
                        </td>
                        <td className="px-6 py-4 font-medium">{formatMoney(Number(entry.needed || 0))}</td>
                        <td className="px-6 py-4 font-medium text-green-600">{formatMoney(Number(entry.raised || 0))}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{percent}%</span>
                              <span className="text-zinc-500">{formatMoney(Number(entry.needed || 0) - Number(entry.raised || 0))} left</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/budget/${entry.id}/edit`} className="text-blue-600 hover:underline font-medium">Edit</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
