"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DateField from "@/components/DateField";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

type ContactType = 'call' | 'email' | 'text' | 'meeting' | 'event';

interface LanguageSchool {
  id: string;
  name: string;
}

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

interface ContactFormData {
  contact_date: string;
  type: ContactType;
  notes: string;
  outcome: string;
  next_step: string;
  next_follow_up_date: string;
}

const contactTypes: ContactType[] = ['call', 'email', 'text', 'meeting', 'event'];

export default function LogLanguageSchoolContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<LanguageSchool | null>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    contact_date: localDateTimeInputValue(),
    type: 'call',
    notes: "",
    outcome: "",
    next_step: "",
    next_follow_up_date: "",
  });

  useEffect(() => {
    async function fetchSchool() {
      const { data } = await supabase.from('language_schools').select('id, name').eq('id', id).single();
      setSchool(data as LanguageSchool | null);
    }
    fetchSchool();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const contactDate = validDateTimeIsoOrNull(formData.contact_date);
      const nextFollowUpDate = validDateOrNull(formData.next_follow_up_date);

      const { error: logError } = await supabase.from('contact_logs').insert({
        language_school_id: id,
        staff_id: user?.id,
        type: formData.type,
        ...(contactDate ? { contact_date: contactDate } : {}),
        notes: formData.notes,
        outcome: formData.outcome || null,
        next_step: formData.next_step || null,
        next_follow_up_date: nextFollowUpDate,
      });

      if (logError) throw logError;

      const { error: schoolError } = await supabase
        .from('language_schools')
        .update({
          last_contact_date: contactDate ? contactDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
          next_follow_up_date: nextFollowUpDate,
          next_step: formData.next_step || null,
          assigned_staff_id: user?.id || null,
        })
        .eq('id', id);

      if (schoolError) throw schoolError;

      if (formData.next_step && nextFollowUpDate) {
        await supabase.from('tasks').insert({
          title: `Follow up: ${formData.next_step}`,
          description: `Automatically created from language school contact with ${school?.name}. Notes: ${formData.notes}`,
          assigned_to: user?.id,
          related_to_id: id,
          related_to_type: 'language_school',
          due_date: new Date(nextFollowUpDate).toISOString(),
          priority: 'Medium',
          status: 'Not started',
        });
      }

      router.push(`/language-schools/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error logging language school contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/language-schools/${id}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to {school?.name || 'Language School'}
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Log Contact</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Date</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.contact_date}
              onChange={e => setFormData({ ...formData, contact_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as ContactType })}
            >
              {contactTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
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
                placeholder="e.g., Send magazine subscription details"
                value={formData.next_step}
                onChange={e => setFormData({ ...formData, next_step: e.target.value })}
              />
            </div>
            <DateField
              label="Follow-up Date"
              value={formData.next_follow_up_date}
              onChange={val => setFormData({ ...formData, next_follow_up_date: val })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Log & Save Contact"}
          </button>
        </form>
      </div>
    </div>
  );
}
