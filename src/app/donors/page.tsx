
"use client";

import { createClient } from "@/lib/supabase/client";
import { DonorEngagementScore } from "@/components/DonorEngagementScore";
import { RelationshipStatusSelect } from "@/components/RelationshipStatusSelect";
import Link from "next/link";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Database } from "@/types/database";

type Donor = Database['public']['Tables']['donors']['Row'];

export default function DonorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDonors() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('donors')
          .select('*')
          .order('name');

        if (error) throw error;
        setDonors(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchDonors();
  }, [supabase]);

  const filteredDonors = donors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donors</h1>
          <p className="text-zinc-500">Manage your relationships with supporters.</p>
        </div>
        <Link href="/donors/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Donor
        </Link>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-zinc-500">Loading donors...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600">Error loading donors: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-red-700 underline">Try again</button>
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-zinc-500">No donors found.</p>
          {searchTerm && <button onClick={() => setSearchTerm("")} className="mt-2 text-blue-600 hover:underline">Clear search</button>}
        </div>
      ) : (
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
                    <RelationshipStatusSelect
                      id={donor.id}
                      table="donors"
                      value={donor.relationship_status}
                      onSaved={relationship_status => setDonors(prev => prev.map(row => (
                        row.id === donor.id ? { ...row, relationship_status } : row
                      )))}
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DonorEngagementScore donorId={donor.id} score={donor.engagement_score} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ${donor.lifetime_giving.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/donors/${donor.id}`} className="text-blue-600 hover:underline font-medium">View</Link>
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
