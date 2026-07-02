"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DonorEngagementScore } from "@/components/DonorEngagementScore";
import DateField from "@/components/DateField";
import NotesLog from "@/components/NotesLog";
import { RelationshipStatusSelect } from "@/components/RelationshipStatusSelect";
import {
  Mail,
  Phone,
  Calendar,
  Tag as TagIcon,
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

type Donor = Database['public']['Tables']['donors']['Row'] & { next_step: string | null };
type Profile = Database['public']['Tables']['profiles']['Row'];
type Church = Database['public']['Tables']['churches']['Row'];
type ContactLog = Database['public']['Tables']['contact_logs']['Row'];

interface ProjectOption {
  id: string;
  name: string;
}

interface GiftProject {
  name: string | null;
}

interface GiftHistoryRow {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  project_id: string | null;
  projects: GiftProject | GiftProject[] | null;
}

interface GiftHistoryItem {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  projectName: string | null;
}

interface AddGiftFormData {
  amount: string;
  project_id: string;
  gift_date: string;
  method: string;
  notes: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayDateInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function validDateOrNull(value: string) {
  if (!DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

function getProjectName(projects: GiftHistoryRow['projects']) {
  const project = Array.isArray(projects) ? projects[0] : projects;
  return project?.name || null;
}

export default function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItem[]>([]);
  const [showAddGift, setShowAddGift] = useState(false);
  const [addingGift, setAddingGift] = useState(false);
  const [giftForm, setGiftForm] = useState<AddGiftFormData>({
    amount: "",
    project_id: "",
    gift_date: todayDateInputValue(),
    method: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function fetchDonorData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }

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
      } else {
        setStaff(null);
      }

      if (donorData.church_id) {
        const { data: churchData } = await supabase
          .from('churches')
          .select('*')
          .eq('id', donorData.church_id)
          .single();
        setChurch(churchData);
      } else {
        setChurch(null);
      }

      const { data: logData } = await supabase
        .from('contact_logs')
        .select('*')
        .eq('donor_id', id)
        .order('contact_date', { ascending: false });
      setContactLogs(logData || []);

      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      setProjects((projectData || []) as ProjectOption[]);

      const { data: giftData } = await supabase
        .from('gifts')
        .select('id, amount, gift_date, notes, method, project_id, projects(name)')
        .eq('donor_id', id)
        .order('gift_date', { ascending: false });
      setGiftHistory(((giftData || []) as GiftHistoryRow[]).map(gift => ({
        id: gift.id,
        amount: gift.amount,
        gift_date: gift.gift_date,
        notes: gift.notes,
        method: gift.method,
        projectName: getProjectName(gift.projects),
      })));
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
    void fetchDonorData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingGift(true);

    try {
      const amount = Number(giftForm.amount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const giftDate = validDateOrNull(giftForm.gift_date);
      const { error } = await supabase.from('gifts').insert({
        donor_id: id,
        project_id: giftForm.project_id || null,
        amount,
        gift_date: giftDate || undefined,
        method: giftForm.method || null,
        notes: giftForm.notes || null,
      });

      if (error) throw error;

      await fetchDonorData();
      setGiftForm({
        amount: "",
        project_id: "",
        gift_date: todayDateInputValue(),
        method: "",
        notes: "",
      });
      setShowAddGift(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding gift");
    } finally {
      setAddingGift(false);
    }
  };

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
              <RelationshipStatusSelect
                id={donor.id}
                table="donors"
                value={donor.relationship_status}
                onSaved={relationship_status => setDonor(prev => prev ? { ...prev, relationship_status } : prev)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-right">
            <p className="text-sm text-zinc-500 font-medium">Engagement Score</p>
            <p className="text-xs text-zinc-400">Based on recent activity</p>
          </div>
          <DonorEngagementScore donorId={donor.id} score={donor.engagement_score} />
        </div>
      </div>

      {showAddGift ? (
        <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="font-semibold mb-4">Add Gift</h2>
          <form onSubmit={handleAddGift} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={giftForm.amount}
                onChange={e => setGiftForm({ ...giftForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={giftForm.project_id}
                onChange={e => setGiftForm({ ...giftForm, project_id: e.target.value })}
              >
                <option value="">None</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <DateField
              label="Gift Date"
              value={giftForm.gift_date}
              onChange={val => setGiftForm({ ...giftForm, gift_date: val })}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="cash, check, card, online"
                value={giftForm.method}
                onChange={e => setGiftForm({ ...giftForm, method: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Note</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                value={giftForm.notes}
                onChange={e => setGiftForm({ ...giftForm, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={addingGift}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {addingGift ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Save Gift
              </button>
              <button
                type="button"
                onClick={() => setShowAddGift(false)}
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

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
              <div className="flex items-center gap-3 text-sm">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                <span>Next Step: {donor.next_step || 'Not set'}</span>
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

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Notes / Next Step</h2>
            <NotesLog
              entityType="donor"
              entityId={donor.id}
              entityLabel={donor.name}
              onNextStepSaved={next_step => setDonor(prev => prev ? { ...prev, next_step } : prev)}
              onFollowUpDateSaved={next_follow_up_date => setDonor(prev => prev ? { ...prev, next_follow_up_date } : prev)}
            />
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddGift(value => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Gift
            </button>
          </div>

          <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800">
              <h2 className="font-semibold">Gift History</h2>
            </div>
            <div className="p-6">
              {giftHistory.length > 0 ? (
                <div className="space-y-3">
                  {giftHistory.map(gift => (
                    <div key={gift.id} className="flex flex-col gap-2 border rounded-lg p-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{gift.projectName || "General gift"}</p>
                        <p className="text-xs text-zinc-500">
                          {gift.gift_date} {gift.method ? `- ${gift.method}` : ""}
                        </p>
                        {gift.notes ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{gift.notes}</p> : null}
                      </div>
                      <p className="text-sm font-bold text-green-600">${gift.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500">
                  No gifts recorded yet.
                </div>
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
