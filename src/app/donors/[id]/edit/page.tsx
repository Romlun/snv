"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Church = Database['public']['Tables']['churches']['Row'];
type DonorStage = Database['public']['Tables']['donors']['Row']['stage'];
type RelationshipStatus = Database['public']['Tables']['donors']['Row']['relationship_status'];

interface FormData {
  name: string;
  email: string;
  phone: string;
  stage: DonorStage;
  relationship_status: RelationshipStatus;
  assigned_staff_id: string;
  church_id: string;
  notes: string;
}

export default function EditDonorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    stage: "New contact",
    relationship_status: "Steady",
    assigned_staff_id: "",
    church_id: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: staffData } = await supabase.from('profiles').select('*');
        const { data: churchData } = await supabase.from('churches').select('*');
        setStaff(staffData || []);
        setChurches(churchData || []);

        const { data: donor } = await supabase.from('donors').select('*').eq('id', id).single();
        if (donor) {
          setFormData({
            name: donor.name,
            email: donor.email || "",
            phone: donor.phone || "",
            stage: donor.stage,
            relationship_status: donor.relationship_status,
            assigned_staff_id: donor.assigned_staff_id || "",
            church_id: donor.church_id || "",
            notes: donor.notes || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('donors').update({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        stage: formData.stage,
        relationship_status: formData.relationship_status,
        notes: formData.notes || null,
        assigned_staff_id: formData.assigned_staff_id || null,
        church_id: formData.church_id || null,
      }).eq('id', id);

      if (error) throw error;
      router.push(`/donors/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error updating donor");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading donor data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/donors/${id}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Donor
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Edit Donor</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
              <label className="text-sm font-medium">Relationship Stage</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.stage}
                onChange={e => setFormData({ ...formData, stage: e.target.value as DonorStage })}
              >
                <option value="New contact">New contact</option>
                <option value="First conversation">First conversation</option>
                <option value="Interested">Interested</option>
                <option value="Active donor">Active donor</option>
                <option value="Monthly supporter">Monthly supporter</option>
                <option value="Major donor">Major donor</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Staff</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.assigned_staff_id}
                onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Church Connection</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.church_id}
                onChange={e => setFormData({ ...formData, church_id: e.target.value })}
              >
                <option value="">None</option>
                {churches.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
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
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
