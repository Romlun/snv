"use client";

import { churches } from "@/lib/mock-data";
import { EngagementScoreRing } from "@/components/EngagementScoreRing";
import Link from "next/link";
import { Search, Plus, MapPin } from "lucide-react";
import { useState } from "react";

export default function ChurchesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChurches = churches.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.pastor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Churches</h1>
          <p className="text-zinc-500">Track church relationships and visit history.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Church
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search churches by name or pastor..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChurches.map((church) => (
          <div key={church.id} className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/churches/${church.id}`} className="text-xl font-bold hover:underline">{church.name}</Link>
                  <p className="text-sm text-zinc-500 mt-1">Pastor: {church.pastor}</p>
                </div>
                <EngagementScoreRing score={church.engagementScore} />
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="h-4 w-4" />
                  <span>{church.address}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 font-medium">Next Visit:</span>
                  <span className="font-semibold text-blue-600">{church.nextVisitDate || 'Not planned'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 font-medium">Total Partnership Giving:</span>
                  <span className="font-semibold">${church.totalGiving.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="border-t px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{church.denomination}</span>
              <Link href={`/churches/${church.id}`} className="text-sm text-blue-600 font-bold hover:underline">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
