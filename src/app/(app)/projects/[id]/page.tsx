"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DateField from "@/components/DateField";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Tags,
  Target,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProjectStatus = 'Idea' | 'Planning' | 'Active' | 'Waiting' | 'Completed' | 'Cancelled';

interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  goal_description: string | null;
  budget_needed: number;
  current_funding: number;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface AssignedStaff {
  id: string;
  name: string;
}

interface BudgetEntry {
  id: string;
  project_id: string | null;
  category: string;
  name: string;
  needed: number;
  raised: number;
  is_project_based: boolean;
  created_at: string;
  updated_at: string;
}

interface Donor {
  id: string;
  name: string;
}

interface GiftProfile {
  name: string | null;
}

interface GiftContributionRow {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  donor_id: string | null;
  donors: GiftProfile | GiftProfile[] | null;
}

interface Contribution {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  donorName: string | null;
}

interface AddFundsFormData {
  amount: string;
  donor_id: string;
  gift_date: string;
  method: string;
  notes: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getFundingPercent(project: Project) {
  if (!project.budget_needed) return 0;
  return Math.min(100, Math.round((project.current_funding / project.budget_needed) * 100));
}

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

function getDonorName(donors: GiftContributionRow['donors']) {
  const donor = Array.isArray(donors) ? donors[0] : donors;
  return donor?.name || null;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);
  const [fundForm, setFundForm] = useState<AddFundsFormData>({
    amount: "",
    donor_id: "",
    gift_date: todayDateInputValue(),
    method: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function fetchProjectData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: staffData } = await supabase
        .from('project_staff')
        .select('staff_id, profiles(full_name, email)')
        .eq('project_id', id);
      setAssignedStaff((staffData || []).map(row => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          id: row.staff_id,
          name: profile?.full_name || profile?.email || row.staff_id,
        };
      }));

      const { data: budgetData } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('project_id', id)
        .order('category');
      setBudgetEntries((budgetData || []) as BudgetEntry[]);

      const { data: donorData } = await supabase
        .from('donors')
        .select('id, name')
        .order('name');
      setDonors((donorData || []) as Donor[]);

      const { data: giftData } = await supabase
        .from('gifts')
        .select('id, amount, gift_date, notes, method, donor_id, donors(name)')
        .eq('project_id', id)
        .order('gift_date', { ascending: false });
      setContributions(((giftData || []) as GiftContributionRow[]).map(gift => ({
        id: gift.id,
        amount: gift.amount,
        gift_date: gift.gift_date,
        notes: gift.notes,
        method: gift.method,
        donorName: getDonorName(gift.donors),
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
    fetchProjectData(true);
  }, [id]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFunds(true);

    try {
      const amount = Number(fundForm.amount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const giftDate = validDateOrNull(fundForm.gift_date);
      const { error } = await supabase.from('gifts').insert({
        project_id: id,
        amount,
        donor_id: fundForm.donor_id || null,
        gift_date: giftDate || undefined,
        method: fundForm.method || null,
        notes: fundForm.notes || null,
      });

      if (error) throw error;

      await fetchProjectData();
      setFundForm({
        amount: "",
        donor_id: "",
        gift_date: todayDateInputValue(),
        method: "",
        notes: "",
      });
      setShowAddFunds(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding funds");
    } finally {
      setAddingFunds(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  const fundingPercent = getFundingPercent(project);

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400">
            {project.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
               <Link href={`/projects/${project.id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">Edit</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {project.status}
              </span>
              {project.tags && project.tags.length > 0 ? project.tags.map(tag => (
                <span key={tag} className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                  {tag}
                </span>
              )) : null}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800 min-w-72">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-zinc-500 font-medium">Funding Progress</p>
            <p className="text-sm font-bold">{fundingPercent}%</p>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${fundingPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">${project.current_funding.toLocaleString()} of ${project.budget_needed.toLocaleString()}</p>
          <button
            type="button"
            onClick={() => setShowAddFunds(value => !value)}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Funds
          </button>
        </div>
      </div>

      {showAddFunds ? (
        <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="font-semibold mb-4">Add Funds</h2>
          <form onSubmit={handleAddFunds} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={fundForm.amount}
                onChange={e => setFundForm({ ...fundForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Donor</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={fundForm.donor_id}
                onChange={e => setFundForm({ ...fundForm, donor_id: e.target.value })}
              >
                <option value="">No donor selected</option>
                {donors.map(donor => (
                  <option key={donor.id} value={donor.id}>{donor.name}</option>
                ))}
              </select>
            </div>
            <DateField
              label="Gift Date"
              value={fundForm.gift_date}
              onChange={val => setFundForm({ ...fundForm, gift_date: val })}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="cash, check, card, online"
                value={fundForm.method}
                onChange={e => setFundForm({ ...fundForm, method: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Note</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                value={fundForm.notes}
                onChange={e => setFundForm({ ...fundForm, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={addingFunds}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {addingFunds ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Save Funds
              </button>
              <button
                type="button"
                onClick={() => setShowAddFunds(false)}
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
            <h2 className="font-semibold mb-4">Project Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Start: {project.start_date || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>End: {project.end_date || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-zinc-400" />
                <span>Budget: ${project.budget_needed.toLocaleString()}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Tags className="h-4 w-4 text-zinc-400 mt-0.5" />
                <span>{project.tags && project.tags.length > 0 ? project.tags.join(", ") : "No tags"}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Assigned Staff</h2>
            <div className="space-y-3">
              {assignedStaff.length > 0 ? assignedStaff.map(row => (
                <div key={row.id} className="flex items-center gap-2 text-sm font-medium">
                  <UserIcon className="h-4 w-4 text-zinc-400" />
                  <span>{row.name}</span>
                </div>
              )) : (
                <p className="text-sm text-zinc-400 italic">No staff assigned.</p>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Internal Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Organization ID</p>
                <p className="text-sm font-medium break-all">{project.org_id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Project ID</p>
                <p className="text-sm font-medium break-all">{project.id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Created</p>
                <p className="text-sm font-medium">{new Date(project.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Updated</p>
                <p className="text-sm font-medium">{new Date(project.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Budget Needed</p>
              <p className="text-2xl font-bold">${project.budget_needed.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Current Funding</p>
              <p className="text-2xl font-bold text-green-600">${project.current_funding.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">Status</p>
              <p className="text-2xl font-bold">{project.status}</p>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-400" />
              Description
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{project.description || "No description yet."}</p>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-zinc-400" />
              Goal
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{project.goal_description || "No goal description yet."}</p>
          </section>

          <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800">
              <h2 className="font-semibold">Contributions</h2>
            </div>
            <div className="p-6">
              {contributions.length > 0 ? (
                <div className="space-y-3">
                  {contributions.map(gift => (
                    <div key={gift.id} className="flex flex-col gap-2 border rounded-lg p-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{gift.donorName || "No donor selected"}</p>
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
                  No contributions recorded yet.
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800">
              <h2 className="font-semibold">Linked Budget Entries</h2>
            </div>
            <div className="p-6">
              {budgetEntries.length > 0 ? (
                <div className="space-y-3">
                  {budgetEntries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between border rounded-lg p-4 dark:border-zinc-800">
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-zinc-500">{entry.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${entry.raised.toLocaleString()} raised</p>
                        <p className="text-xs text-zinc-500">of ${entry.needed.toLocaleString()} needed</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500">
                  No budget entries linked yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
