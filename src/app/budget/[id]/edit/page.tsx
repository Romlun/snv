"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DateField from "@/components/DateField";

interface ProjectOption {
  id: string;
  name: string;
}

interface FormData {
  category: string;
  name: string;
  needed: string;
  raised: string;
  is_project_based: boolean;
  project_id: string;
}

interface BudgetContribution {
  id: string;
  budget_entry_id: string;
  amount: number;
  contribution_date: string;
  note: string | null;
  created_at: string;
}

interface AddFundsFormData {
  amount: string;
  contribution_date: string;
  note: string;
}

const suggestedCategories = [
  "General Operations",
  "Projects",
  "Events",
  "Travel",
  "Books & Resources",
  "Staff",
  "Media",
  "Church Visits",
  "Mission Trips",
  "Special Campaigns",
];

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function todayDateInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function EditBudgetEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [contributions, setContributions] = useState<BudgetContribution[]>([]);
  const [formData, setFormData] = useState<FormData>({
    category: "",
    name: "",
    needed: "",
    raised: "",
    is_project_based: false,
    project_id: "",
  });
  const [fundForm, setFundForm] = useState<AddFundsFormData>({
    amount: "",
    contribution_date: todayDateInputValue(),
    note: "",
  });

  async function fetchData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setFetching(true);
      }

      const [{ data: entry }, { data: projectData }, { data: contributionData }] = await Promise.all([
        supabase.from('budget_entries').select('*').eq('id', id).single(),
        supabase.from('projects').select('id, name').order('name'),
        supabase
          .from('budget_contributions')
          .select('*')
          .eq('budget_entry_id', id)
          .order('contribution_date', { ascending: false })
          .order('created_at', { ascending: false }),
      ]);

      setProjects((projectData || []) as ProjectOption[]);
      setContributions((contributionData || []) as BudgetContribution[]);

      if (entry) {
        setFormData({
          category: entry.category || "General Operations",
          name: entry.name || "",
          needed: String(entry.needed || ""),
          raised: String(entry.raised || ""),
          is_project_based: Boolean(entry.is_project_based),
          project_id: entry.project_id || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showPageLoading) {
        setFetching(false);
      }
    }
  }

  useEffect(() => {
    fetchData(true);
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('budget_entries').update({
        category: formData.category,
        name: formData.name,
        needed: Number(formData.needed || 0),
        is_project_based: formData.is_project_based,
        project_id: formData.is_project_based && formData.project_id ? formData.project_id : null,
      }).eq('id', id);

      if (error) throw error;
      router.push("/budget");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating budget entry");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFunds(true);

    try {
      const amount = Number(fundForm.amount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('budget_contributions').insert({
        budget_entry_id: id,
        amount,
        contribution_date: fundForm.contribution_date || undefined,
        note: fundForm.note || null,
        created_by: user?.id || null,
      });

      if (error) throw error;

      await fetchData();
      setFundForm({
        amount: "",
        contribution_date: todayDateInputValue(),
        note: "",
      });
      setShowAddFunds(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding funds");
    } finally {
      setAddingFunds(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this budget entry?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('budget_entries').delete().eq('id', id);
      if (error) throw error;
      router.push("/budget");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error deleting budget entry");
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading budget entry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/budget" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Budget
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Edit Budget Entry</h1>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {suggestedCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Needed</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.needed}
                onChange={e => setFormData({ ...formData, needed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Raised</label>
              <div className="w-full px-3 py-2 border rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:border-zinc-800">
                {formatMoney(Number(formData.raised || 0))}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium dark:border-zinc-800">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={formData.is_project_based}
              onChange={e => setFormData({ ...formData, is_project_based: e.target.checked, project_id: e.target.checked ? formData.project_id : "" })}
            />
            Project based
          </label>

          {formData.is_project_based ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">No project selected</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Save Changes"}
          </button>
        </form>
      </div>

      <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold">Contributions</h2>
          <button
            type="button"
            onClick={() => setShowAddFunds(value => !value)}
            className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Funds
          </button>
        </div>
        {showAddFunds ? (
          <form onSubmit={handleAddFunds} className="p-4 border-b dark:border-zinc-800 space-y-4 bg-blue-50/50 dark:bg-blue-900/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <DateField
                label="Contribution Date"
                value={fundForm.contribution_date}
                onChange={val => setFundForm({ ...fundForm, contribution_date: val })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                value={fundForm.note}
                onChange={e => setFundForm({ ...fundForm, note: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingFunds}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {addingFunds ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save Funds
              </button>
              <button
                type="button"
                onClick={() => setShowAddFunds(false)}
                className="rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
        <div className="p-6">
          {contributions.length > 0 ? (
            <div className="space-y-3">
              {contributions.map(contribution => (
                <div key={contribution.id} className="flex flex-col gap-2 border rounded-lg p-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{formatMoney(Number(contribution.amount || 0))}</p>
                    <p className="text-xs text-zinc-500">{contribution.contribution_date}</p>
                    {contribution.note ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{contribution.note}</p> : null}
                  </div>
                  <p className="text-xs text-zinc-500">{new Date(contribution.created_at).toLocaleString()}</p>
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
    </div>
  );
}
