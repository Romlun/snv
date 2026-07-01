"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChurchEngagementScore } from "@/components/ChurchEngagementScore";
import DateField from "@/components/DateField";
import NotesLog from "@/components/NotesLog";
import { RelationshipStatusSelect } from "@/components/RelationshipStatusSelect";
import {
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  Clock,
  Landmark,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Database } from "@/types/database";

type Church = Database['public']['Tables']['churches']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type ContactLog = Database['public']['Tables']['contact_logs']['Row'];
type PlanVisitType = 'call' | 'meeting' | 'church visit' | 'event';

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

const planVisitTypes: PlanVisitType[] = ['call', 'meeting', 'church visit', 'event'];
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

function getPlanVisitTitle(type: PlanVisitType, churchName: string) {
  if (type === 'church visit') return `Planned visit to ${churchName}`;
  if (type === 'meeting') return `Planned meeting with ${churchName}`;
  if (type === 'event') return `Planned event with ${churchName}`;
  return `Planned call to ${churchName}`;
}

export default function ChurchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [church, setChurch] = useState<Church | null>(null);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [visitLogs, setVisitLogs] = useState<ContactLog[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanVisit, setShowPlanVisit] = useState(false);
  const [planVisitForm, setPlanVisitForm] = useState<{ date: string; note: string; type: PlanVisitType }>({ date: "", note: "", type: "church visit" });
  const [planVisitSaving, setPlanVisitSaving] = useState(false);
  const [showAddGift, setShowAddGift] = useState(false);
  const [addingGift, setAddingGift] = useState(false);
  const [giftForm, setGiftForm] = useState<AddGiftFormData>({
    amount: "",
    project_id: "",
    gift_date: todayDateInputValue(),
    method: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  async function fetchChurchData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }

      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .select('*')
        .eq('id', id)
        .single();

      if (churchError) throw churchError;
      setChurch(churchData);

      if (churchData.assigned_staff_id) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', churchData.assigned_staff_id)
          .single();
        setStaff(staffData);
      } else {
        setStaff(null);
      }

      const { data: logData } = await supabase
        .from('contact_logs')
        .select('*')
        .eq('church_id', id)
        .eq('type', 'church visit')
        .order('contact_date', { ascending: false });
      setVisitLogs(logData || []);

      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      setProjects((projectData || []) as ProjectOption[]);

      const { data: giftData } = await supabase
        .from('gifts')
        .select('id, amount, gift_date, notes, method, project_id, projects(name)')
        .eq('church_id', id)
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
    void fetchChurchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePlanVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planVisitForm.date) return;
    setPlanVisitSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: churchError } = await supabase
        .from('churches')
        .update({ next_visit_date: planVisitForm.date })
        .eq('id', id);
      if (churchError) throw churchError;

      await supabase.from('tasks').insert({
        title: getPlanVisitTitle(planVisitForm.type, church?.name || 'church'),
        related_to_type: 'church',
        related_to_id: id,
        due_date: new Date(planVisitForm.date).toISOString(),
        priority: 'Medium',
        status: 'Not started',
        assigned_to: user?.id,
        description: planVisitForm.note || null,
      });

      setChurch(prev => prev ? { ...prev, next_visit_date: planVisitForm.date } : null);
      setPlanVisitForm({ date: '', note: '', type: 'church visit' });
      setShowPlanVisit(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error planning visit");
    } finally {
      setPlanVisitSaving(false);
    }
  };

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
        church_id: id,
        project_id: giftForm.project_id || null,
        amount,
        gift_date: giftDate || undefined,
        method: giftForm.method || null,
        notes: giftForm.notes || null,
      });

      if (error) throw error;

      await fetchChurchData();
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
        <p className="mt-4 text-zinc-500">Loading church details...</p>
      </div>
    );
  }

  if (!church) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/churches" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Churches
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400">
            {church.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight">{church.name}</h1>
               <Link href={`/churches/${church.id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">Edit</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <RelationshipStatusSelect
                id={church.id}
                table="churches"
                value={church.relationship_status}
                onSaved={relationship_status => setChurch(prev => prev ? { ...prev, relationship_status } : prev)}
              />
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                {church.denomination || "No denomination listed"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-right">
            <p className="text-sm text-zinc-500 font-medium">Engagement Score</p>
            <p className="text-xs text-zinc-400">Based on recent activity</p>
          </div>
          <ChurchEngagementScore churchId={church.id} score={church.engagement_score} />
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
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <UserIcon className="h-4 w-4 text-zinc-400" />
                <span>Pastor: {church.pastor || 'Not listed'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>{church.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span>{church.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                <span>{church.address || 'No address provided'}</span>
              </div>
              <div className={`flex items-center gap-3 text-sm font-semibold rounded-lg px-3 py-2 ${church.next_visit_date ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'text-zinc-400'}`}>
                <Clock className="h-4 w-4 shrink-0" />
                <span>{church.next_visit_date ? `Next visit: ${new Date(church.next_visit_date + 'T00:00:00').toLocaleDateString()}` : 'No visit planned'}</span>
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
                <p className="text-sm font-medium break-all">{church.org_id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Church ID</p>
                <p className="text-sm font-medium break-all">{church.id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Created</p>
                <p className="text-sm font-medium">{new Date(church.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Updated</p>
                <p className="text-sm font-medium">{new Date(church.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Total Giving</p>
              <p className="text-2xl font-bold">${church.total_giving.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Denomination</p>
              <p className="text-2xl font-bold">{church.denomination || "None"}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Relationship</p>
              <p className="text-2xl font-bold">{church.relationship_status}</p>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Notes / Next Step</h2>
            <NotesLog entityType="church" entityId={church.id} />
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
              <h2 className="font-semibold">Visit History</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlanVisit(v => !v)}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Plan Visit
                </button>
                <Link href={`/churches/${church.id}/visit`} className="text-sm text-blue-600 font-medium">+ Log Visit</Link>
              </div>
            </div>
            {showPlanVisit && (
              <form onSubmit={handlePlanVisit} className="p-4 border-b dark:border-zinc-800 space-y-3 bg-blue-50/50 dark:bg-blue-900/10">
                <DateField
                  label="Planned Visit Date"
                  value={planVisitForm.date}
                  onChange={val => setPlanVisitForm(f => ({ ...f, date: val }))}
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={planVisitForm.type}
                    onChange={e => setPlanVisitForm(f => ({ ...f, type: e.target.value as PlanVisitType }))}
                  >
                    {planVisitTypes.map(type => (
                      <option key={type} value={type}>{type === 'church visit' ? 'Visit' : type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Note (optional)</label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Any details about the visit..."
                    value={planVisitForm.note}
                    onChange={e => setPlanVisitForm(f => ({ ...f, note: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={planVisitSaving || !planVisitForm.date}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {planVisitSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Schedule Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlanVisit(false)}
                    className="rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <div className="p-6">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {visitLogs.length > 0 ? visitLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center gap-6">
                    <div className="absolute left-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 z-10">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="ml-12">
                      <p className="text-sm font-semibold">Church visit</p>
                      <p className="text-xs text-zinc-500">{new Date(log.contact_date).toLocaleDateString()}</p>
                      <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">{log.notes}</p>
                      {log.outcome && <p className="text-xs mt-1 text-zinc-500 italic">Outcome: {log.outcome}</p>}
                      {log.next_step && <p className="text-xs mt-1 text-zinc-500 italic">Next step: {log.next_step}</p>}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-zinc-500">
                    No visits logged yet.
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
