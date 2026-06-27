"use client";

import { use } from "react";
import { donors, staff, churches } from "@/lib/mock-data";
import { EngagementScoreRing } from "@/components/EngagementScoreRing";
import {
  Mail,
  Phone,
  Calendar,
  Tag as TagIcon,
  MessageSquare,
  DollarSign,
  User as UserIcon,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const donor = donors.find(d => d.id === id);

  if (!donor) {
    notFound();
  }

  const assignedStaff = staff.find(s => s.id === donor.assignedStaffId);
  const church = churches.find(c => c.id === donor.churchId);

  return (
    <div className="space-y-6">
      <Link href="/donors" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Donors
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400">
            {donor.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{donor.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {donor.stage}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                {donor.relationshipStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-right">
            <p className="text-sm text-zinc-500 font-medium">Engagement Score</p>
            <p className="text-xs text-zinc-400">Based on recent activity</p>
          </div>
          <EngagementScoreRing score={donor.engagementScore} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact & Info */}
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>{donor.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span>{donor.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Last Contact: {donor.lastContactDate || 'Never'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-amber-600">
                <Clock className="h-4 w-4" />
                <span>Next Follow-up: {donor.nextFollowUpDate || 'Not scheduled'}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Internal Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Assigned To</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                   <UserIcon className="h-4 w-4 text-zinc-400" />
                   {assignedStaff?.name}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Church Connection</p>
                <p className="text-sm font-medium">{church?.name || 'No church connected'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Interests</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {donor.interests.map(interest => (
                    <span key={interest} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">{interest}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {donor.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs flex items-center gap-1">
                      <TagIcon className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Giving & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Lifetime Giving</p>
              <p className="text-2xl font-bold">${donor.lifetimeGiving.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Years Supported</p>
              <p className="text-2xl font-bold">{donor.yearsSupported} Years</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Recurring Status</p>
              {donor.isRecurring ? (
                <p className="text-2xl font-bold text-green-600">${donor.recurringAmount}/{donor.recurringCadence === 'monthly' ? 'mo' : 'qt'}</p>
              ) : (
                <p className="text-2xl font-bold text-zinc-400 italic text-lg">One-time</p>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold">Recent Interaction Timeline</h2>
              <button className="text-sm text-blue-600 font-medium">+ Add Note</button>
            </div>
            <div className="p-6">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {/* Unified timeline view */}
                {donor.givingHistory.map((gift, idx) => (
                  <div key={idx} className="relative flex items-center gap-6">
                    <div className="absolute left-0 h-10 w-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 z-10">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="ml-12">
                      <p className="text-sm font-semibold">Gift Received: ${gift.amount.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">{gift.date} • {gift.isRecurring ? 'Monthly Recurring' : 'One-time'}</p>
                    </div>
                  </div>
                ))}

                <div className="relative flex items-center gap-6">
                  <div className="absolute left-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 z-10">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="ml-12">
                    <p className="text-sm font-semibold">Conversation with {assignedStaff?.name}</p>
                    <p className="text-xs text-zinc-500">{donor.lastContactDate} • Phone call</p>
                    <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">{donor.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
