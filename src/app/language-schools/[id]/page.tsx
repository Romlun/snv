"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SchoolStatus, SchoolStatusSelect } from "@/components/SchoolStatusSelect";
import NotesLog from "@/components/NotesLog";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  MessageSquare,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  Clock,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Database } from "@/types/database";

type Profile = Database['public']['Tables']['profiles']['Row'];
type ContactLog = Database['public']['Tables']['contact_logs']['Row'] & {
  language_school_id: string | null;
};

interface LanguageSchool {
  id: string;
  org_id: string;
  name: string;
  city: string | null;
  state: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  source: string | null;
  status: SchoolStatus;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  next_step: string | null;
  notes: string | null;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

function daysSince(value: string | null) {
  if (!value) return "Never";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.floor((today.getTime() - date.getTime()) / 86400000));
  if (days === 0) return "Today";
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export default function LanguageSchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [school, setSchool] = useState<LanguageSchool | null>(null);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function fetchSchoolData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }

      const { data: schoolData, error: schoolError } = await supabase
        .from('language_schools')
        .select('*')
        .eq('id', id)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData as LanguageSchool);

      if (schoolData.assigned_staff_id) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', schoolData.assigned_staff_id)
          .single();
        setStaff(staffData);
      } else {
        setStaff(null);
      }

      const { data: logData } = await supabase
        .from('contact_logs')
        .select('*')
        .eq('language_school_id', id)
        .order('contact_date', { ascending: false });
      setContactLogs((logData || []) as ContactLog[]);
    } catch (err) {
      console.error(err);
    } finally {
      if (showPageLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSchoolData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading language school details...</p>
      </div>
    );
  }

  if (!school) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/language-schools" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Language Schools
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400">
            {school.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight">{school.name}</h1>
               <Link href={`/language-schools/${school.id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">Edit</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <SchoolStatusSelect
                id={school.id}
                value={school.status}
                onSaved={status => setSchool(prev => prev ? { ...prev, status } : prev)}
              />
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                {school.source || "No source listed"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <UserIcon className="h-4 w-4 text-zinc-400" />
                <span>Contact: {school.contact_person || 'Not listed'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>{school.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span>{school.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                <span>{[school.city, school.state].filter(Boolean).join(", ") || 'No location provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-zinc-400" />
                <span>{school.website || 'No website provided'}</span>
              </div>
              <div className={`flex items-center gap-3 text-sm font-semibold rounded-lg px-3 py-2 ${school.next_follow_up_date ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'text-zinc-400'}`}>
                <Clock className="h-4 w-4 shrink-0" />
                <span>{school.next_follow_up_date ? `Next follow-up: ${new Date(school.next_follow_up_date + 'T00:00:00').toLocaleDateString()}` : 'No follow-up scheduled'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                <span>Next Step: {school.next_step || 'Not set'}</span>
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
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Organization ID</p>
                <p className="text-sm font-medium break-all">{school.org_id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">School ID</p>
                <p className="text-sm font-medium break-all">{school.id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Created</p>
                <p className="text-sm font-medium">{new Date(school.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Updated</p>
                <p className="text-sm font-medium">{new Date(school.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Current Status</p>
              <div className="mt-2">
                <SchoolStatusSelect
                  id={school.id}
                  value={school.status}
                  onSaved={status => setSchool(prev => prev ? { ...prev, status } : prev)}
                />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Days Since Contact</p>
              <p className="text-2xl font-bold">{daysSince(school.last_contact_date)}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Next Follow-up</p>
              <p className="text-2xl font-bold">{school.next_follow_up_date || "None"}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Assigned Staff</p>
              <p className="text-2xl font-bold">{staff?.full_name || "Unassigned"}</p>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Notes / Next Step</h2>
            <NotesLog
              entityType="language_school"
              entityId={school.id}
              onNextStepSaved={next_step => setSchool(prev => prev ? { ...prev, next_step } : prev)}
            />
          </section>

          <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold">Contact History</h2>
              <Link href={`/language-schools/${school.id}/log`} className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline">
                <Plus className="h-3.5 w-3.5" />
                Log Contact
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {contactLogs.length > 0 ? contactLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center gap-6">
                    <div className="absolute left-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 z-10">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="ml-12">
                      <p className="text-sm font-semibold">{log.type.charAt(0).toUpperCase() + log.type.slice(1)} contact</p>
                      <p className="text-xs text-zinc-500">{new Date(log.contact_date).toLocaleDateString()}</p>
                      <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">{log.notes}</p>
                      {log.outcome && <p className="text-xs mt-1 text-zinc-500 italic">Outcome: {log.outcome}</p>}
                      {log.next_step && <p className="text-xs mt-1 text-zinc-500 italic">Next step: {log.next_step}</p>}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-zinc-500">
                    No contacts logged yet.
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
