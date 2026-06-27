"use client";

import { use } from "react";
import { churches, staff } from "@/lib/mock-data";
import { EngagementScoreRing } from "@/components/EngagementScoreRing";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  History,
  ArrowLeft,
  User as UserIcon,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function ChurchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const church = churches.find(c => c.id === id);

  if (!church) {
    notFound();
  }

  const assignedStaff = staff.find(s => s.id === church.assignedStaffId);

  return (
    <div className="space-y-6">
      <Link href="/churches" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Churches
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{church.name}</h1>
          <p className="text-zinc-500 text-lg mt-1">{church.denomination} • Pastor {church.pastor}</p>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-right">
            <p className="text-sm text-zinc-500 font-medium">Partnership Health</p>
            <p className="text-xs text-zinc-400">Based on visits & support</p>
          </div>
          <EngagementScoreRing score={church.engagementScore} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Contact Info</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{church.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>{church.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{church.phone}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Leadership</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Mission Representative</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserIcon className="h-4 w-4 text-zinc-400" />
                  {assignedStaff?.name}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Relationship Status</p>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  {church.relationshipStatus}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Next Planned Visit</p>
              <p className="text-2xl font-bold text-blue-600">{church.nextVisitDate || 'TBD'}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Total Giving</p>
              <p className="text-2xl font-bold">${church.totalGiving.toLocaleString()}</p>
            </div>
          </section>

          <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold">Visit History</h2>
            </div>
            <div className="divide-y dark:divide-zinc-800">
              {church.visitHistory.length > 0 ? church.visitHistory.map((visit, idx) => (
                <div key={idx} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      <span className="font-semibold">{visit.date}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-md font-bold uppercase tracking-wider">
                      {visit.purpose}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 mt-4">
                    <MessageSquare className="h-4 w-4 text-zinc-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Outcome:</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{visit.outcome}</p>
                      <p className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-dashed dark:border-zinc-700 italic">
                        &quot;{visit.notes}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-zinc-500">
                  No visit history recorded yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
