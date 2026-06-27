"use client";

import { budgetEntries } from "@/lib/mock-data";
import { Filter } from "lucide-react";

export default function BudgetPage() {
  const totalNeeded = budgetEntries.reduce((acc, curr) => acc + curr.needed, 0);
  const totalRaised = budgetEntries.reduce((acc, curr) => acc + curr.raised, 0);
  const totalProgress = Math.round((totalRaised / totalNeeded) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget & Fundraising</h1>
          <p className="text-zinc-500">Track annual goals and project funding.</p>
        </div>
        <button className="inline-flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filter Year
        </button>
      </div>

      {/* Summary Header */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200 dark:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <p className="text-blue-100 font-medium">Total Annual Funding Goal</p>
            <h2 className="text-4xl font-bold">${totalNeeded.toLocaleString()}</h2>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-2 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider">Current Year</span>
              <span className="text-blue-100 text-sm font-medium">Progress: {totalProgress}%</span>
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Raised: ${totalRaised.toLocaleString()}</span>
            </div>
            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <p className="text-xs text-blue-100 text-right">Remaining: ${(totalNeeded - totalRaised).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <h3 className="font-bold text-lg pt-4">Category Breakdown</h3>
        <div className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Budget Item</th>
                <th className="px-6 py-4">Goal</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-800">
              {budgetEntries.map((entry) => {
                const progress = Math.round((entry.raised / entry.needed) * 100);
                return (
                  <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">{entry.name}</td>
                    <td className="px-6 py-4">${entry.needed.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-zinc-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:underline font-bold">Details</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
