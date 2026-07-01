"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { SchoolStatus } from "@/components/SchoolStatusSelect";
import { Database } from "@/types/database";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface FormData {
  name: string;
  city: string;
  state: string;
  contact_person: string;
  phone: string;
  email: string;
  website: string;
  source: string;
  status: SchoolStatus;
  next_step: string;
  notes: string;
  assigned_staff_id: string;
}

export default function NewLanguageSchoolPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Profile[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    city: "",
    state: "",
    contact_person: "",
    phone: "",
    email: "",
    website: "",
    source: "",
    status: "New",
    next_step: "",
    notes: "",
    assigned_staff_id: "",
  });

  useEffect(() => {
    async function fetchStaff() {
      const { data: staffData } = await supabase.from('profiles').select('*');
      setStaff(staffData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({ ...prev, assigned_staff_id: user.id }));
      }
    }

    fetchStaff();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('language_schools').insert({
        name: formData.name,
        city: formData.city || null,
        state: formData.state || null,
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        source: formData.source || null,
        status: formData.status,
        next_step: formData.next_step || null,
        notes: formData.notes || null,
        assigned_staff_id: formData.assigned_staff_id || null,
      });

      if (error) throw error;
      router.push("/language-schools");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating language school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/language-schools" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Language Schools
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Add New Language School</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">School Name</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Person</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.contact_person}
                onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as SchoolStatus })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="No Answer">No Answer</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Connected">Connected</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Assigned Staff</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.assigned_staff_id}
                onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {staff.map(row => (
                  <option key={row.id} value={row.id}>{row.full_name || row.email}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <input
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Next Step</label>
            <input
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.next_step}
              onChange={e => setFormData({ ...formData, next_step: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-24"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Create Language School"}
          </button>
        </form>
      </div>
    </div>
  );
}
