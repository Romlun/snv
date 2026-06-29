"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database";

type RelationshipStatus = Database['public']['Tables']['churches']['Row']['relationship_status'];

interface FormData {
  name: string;
  pastor: string;
  address: string;
  phone: string;
  email: string;
  denomination: string;
  relationship_status: RelationshipStatus;
  notes: string;
}

export default function EditChurchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    pastor: "",
    address: "",
    phone: "",
    email: "",
    denomination: "",
    relationship_status: "Steady",
    notes: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: church } = await supabase.from('churches').select('*').eq('id', id).single();
        if (church) {
          setFormData({
            name: church.name,
            pastor: church.pastor || "",
            address: church.address || "",
            phone: church.phone || "",
            email: church.email || "",
            denomination: church.denomination || "",
            relationship_status: church.relationship_status,
            notes: church.notes || "",
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
      const { error } = await supabase.from('churches').update({
        name: formData.name,
        pastor: formData.pastor || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        denomination: formData.denomination || null,
        relationship_status: formData.relationship_status,
        notes: formData.notes || null,
      }).eq('id', id);

      if (error) throw error;
      router.push(`/churches/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error updating church");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading church data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/churches/${id}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Church
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Edit Church</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Church Name</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pastor</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.pastor}
                onChange={e => setFormData({ ...formData, pastor: e.target.value })}
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
              <label className="text-sm font-medium">Denomination</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.denomination}
                onChange={e => setFormData({ ...formData, denomination: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Relationship Status</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.relationship_status}
                onChange={e => setFormData({ ...formData, relationship_status: e.target.value as RelationshipStatus })}
              >
                <option value="Engaged">Engaged</option>
                <option value="Steady">Steady</option>
                <option value="Cooling">Cooling</option>
                <option value="At risk">At risk</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <input
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
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
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
