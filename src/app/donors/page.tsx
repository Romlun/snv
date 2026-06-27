"use client";

import { donors } from "@/lib/mock-data";
import { EngagementScoreRing } from "@/components/EngagementScoreRing";
import Link from "next/link";
import { Search, Plus, Filter } from "lucide-react";
import { useState } from "react";

export default function DonorsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDonors = donors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donors</h1>
          <p className="text-zinc-500">Manage your relationships with supporters.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Donor
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search donors..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Score</th>
              <th className="px-6 py-4 text-right">Lifetime Giving</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-zinc-800">
            {filteredDonors.map((donor) => (
              <tr key={donor.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <Link href={`/donors/${donor.id}`} className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline">
                      {donor.name}
                    </Link>
                    <p className="text-zinc-500 text-xs">{donor.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {donor.stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <EngagementScoreRing score={donor.engagementScore} />
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  ${donor.lifetimeGiving.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/donors/${donor.id}`} className="text-blue-600 hover:underline font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
