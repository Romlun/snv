
"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EngagementScoreRing } from "@/components/EngagementScoreRing";
import {
  Mail,
  Phone,
  Calendar,
  Tag as TagIcon,
  MessageSquare,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  Clock
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Database } from "@/types/database";

type Donor = Database['public']['Tables']['donors']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Church = Database['public']['Tables']['churches']['Row'];
type ContactLog = Database['public']['Tables']['contact_logs']['Row'];

export default function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDonorData() {
      try {
        setLoading(true);
        const { data: donorData, error: donorError } = await supabase
          .from('donors')
          .select('*')
          .eq('id', id)
          .single();

        if (donorError) throw donorError;
        setDonor(donorData);

        if (donorData.assigned_staff_id) {
          const { data: staffData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', donorData.assigned_staff_id)
            .single();
          setStaff(staffData);
        }

        if (donorData.church_id) {
          const { data: churchData } = await supabase
            .from('churches')
            .select('*')
            .eq('id', donorData.church_id)
            .single();
          setChurch(churchData);
        }

        const { data: logData } = await supabase
          .from('contact_logs')
          .select('*')
          .eq('donor_id', id)
          .order('contact_date', { ascending: false });
        setContactLogs(logData || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDonorData();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading donor details...</p>
      </div>
    );
  }

  if (!donor) {
    notFound();
  }

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
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight">{donor.name}</h1>
               <Link href={`/donors/${donor.id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">Edit</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {donor.stage}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                {donor.relationship_status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-right">
            <p className="text-sm text-zinc-500 font-medium">Engagement Score</p>
            <p className="text-xs text-zinc-400">Based on recent activity</p>
          </div>
          <EngagementScoreRing score={donor.engagement_score} />
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
                <span>{donor.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span>{donor.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Last Contact: {donor.last_contact_date || 'Never'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-amber-600">
                <Clock className="h-4 w-4" />
                <span>Next Follow-up: {donor.next_follow_up_date || 'Not scheduled'}</span>
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
                   {staff?.full_name || 'Unassigned'}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Church Connection</p>
                <p className="text-sm font-medium">{church?.name || 'No church connected'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Interests</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {donor.interests && donor.interests.length > 0 ? donor.interests.map(interest => (
                    <span key={interest} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">{interest}</span>
                  )) : <span className="text-xs text-zinc-400 italic">None specified</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {donor.tags && donor.tags.length > 0 ? donor.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs flex items-center gap-1">
                      <TagIcon className="h-3 w-3" />
                      {tag}
                    </span>
                  )) : <span className="text-xs text-zinc-400 italic">No tags</span>}
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
              <p className="text-2xl font-bold">${donor.lifetime_giving.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Years Supported</p>
              <p className="text-2xl font-bold">{donor.years_supported} Years</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Recurring Status</p>
              {donor.is_recurring ? (
                <p className="text-2xl font-bold text-green-600">${donor.recurring_amount}/{donor.recurring_cadence === 'monthly' ? 'mo' : 'qt'}</p>
              ) : (
                <p className="text-2xl font-bold text-zinc-400 italic text-lg">One-time</p>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold">Recent Interaction Timeline</h2>
              <Link href={`/donors/${donor.id}/log`} className="text-sm text-blue-600 font-medium">+ Log Interaction</Link>
            </div>
            <div className="p-6">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {contactLogs.length > 0 ? contactLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center gap-6">
                    <div className="absolute left-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 z-10">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="ml-12">
                      <p className="text-sm font-semibold">{log.type.charAt(0).toUpperCase() + log.type.slice(1)} interaction</p>
                      <p className="text-xs text-zinc-500">{new Date(log.contact_date).toLocaleDateString()}</p>
                      <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">{log.notes}</p>
                      {log.outcome && <p className="text-xs mt-1 text-zinc-500 italic">Outcome: {log.outcome}</p>}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-zinc-500">
                    No interactions logged yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
