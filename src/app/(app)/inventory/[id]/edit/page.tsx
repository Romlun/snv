"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FormData {
  title: string;
  category: string;
  quantity_available: string;
  quantity_sold: string;
  quantity_given: string;
  price: string;
  location: string;
}

export default function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    quantity_available: "",
    quantity_sold: "",
    quantity_given: "",
    price: "",
    location: "",
  });

  useEffect(() => {
    async function fetchResource() {
      try {
        const { data } = await supabase
          .from('resources')
          .select('*')
          .eq('id', id)
          .single();

        if (data) {
          setFormData({
            title: data.title || "",
            category: data.category || "",
            quantity_available: String(data.quantity_available || ""),
            quantity_sold: String(data.quantity_sold || 0),
            quantity_given: String(data.quantity_given || 0),
            price: data.price === null ? "" : String(data.price),
            location: data.location || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }

    fetchResource();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('resources').update({
        title: formData.title,
        category: formData.category || null,
        quantity_available: Number(formData.quantity_available || 0),
        price: formData.price ? Number(formData.price) : null,
        location: formData.location || null,
      }).eq('id', id);

      if (error) throw error;
      router.push(`/inventory/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating resource");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this resource?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      router.push("/inventory");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error deleting resource");
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading resource...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/inventory/${id}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Resource
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Edit Resource</h1>
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
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Title</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Available</label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.quantity_available}
                onChange={e => setFormData({ ...formData, quantity_available: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Sold</label>
              <div className="w-full px-3 py-2 border rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:border-zinc-800">
                {formData.quantity_sold || 0}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Given</label>
              <div className="w-full px-3 py-2 border rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:border-zinc-800">
                {formData.quantity_given || 0}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
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
