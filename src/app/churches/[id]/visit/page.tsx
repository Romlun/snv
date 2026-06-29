"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database";

type Church = Database['public']['Tables']['churches']['Row'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function validDateOrNull(value: string) {
  if (!DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

function validDateTimeIsoOrNull(value: string) {
  if (!DATETIME_LOCAL_RE.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function localDateTimeInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

interface VisitFormData {
  contact_date: string;
  notes: string;
  outcome: string;
  next_step: string;
  next_follow_up_date: string;
}

export default function LogChurchVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [church, setChurch] = useState<Church | null>(null);

  const [formData, setFormData] = useState<VisitFormData>({
    contact_date: localDateTimeInputValue(),
    notes: "",
    outcome: "",
    next_step: "",
    next_follow_up_date: "",
  });

  useEffect(() => {
    async function fetchChurch() {
      const { data } = await supabase.from('churches').select('*').eq('id', id).single();
      setChurch(data);
    }
    fetchChurch();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const contactDate = validDateTimeIsoOrNull(formData.contact_date);
      const nextFollowUpDate = validDateOrNull(formData.next_follow_up_date);

      const { error: logError } = await supabase.from('contact_logs').insert({
        church_id: id,
        staff_id: user?.id,
        type: 'church visit',
        ...(contactDate ? { contact_date: contactDate } : {}),
        notes: formData.notes,
        outcome: formData.outcome || null,
        next_step: formData.next_step || null,
        next_follow_up_date: nextFollowUpDate,
      });

      if (logError) throw logError;

      if (formData.next_step && nextFollowUpDate) {
        await supabase.from('tasks').insert({
          title: `Follow up: ${formData.next_step}`,
          description: `Automatically created from church visit with ${church?.name}. Notes: ${formData.notes}`,
          assigned_to: user?.id,
          related_to_id: id,
          related_to_type: 'church',
          due_date: new Date(nextFollowUpDate).toISOString(),
          priority: 'Medium',
          status: 'Not started',
        });
      }

      router.push(`/churches/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error logging church visit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/churches/${id}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to {church?.name || 'Church'}
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Log Church Visit</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Visit Date</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.contact_date}
              onChange={e => setFormData({ ...formData, contact_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-24"
              placeholder="What was discussed?"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Outcome</label>
            <input
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What was the result?"
              value={formData.outcome}
              onChange={e => setFormData({ ...formData, outcome: e.target.value })}
            />
          </div>
          <div className="pt-4 border-t dark:border-zinc-800 space-y-4">
            <h3 className="font-semibold text-sm">Next Step & Follow-up</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-500">What needs to happen next?</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Schedule a presentation"
                value={formData.next_step}
                onChange={e => setFormData({ ...formData, next_step: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-500">Follow-up Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.next_follow_up_date}
                onChange={e => setFormData({ ...formData, next_follow_up_date: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Log & Save Visit"}
          </button>
        </form>
      </div>
    </div>
  );
}
