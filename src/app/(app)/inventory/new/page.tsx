"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FormData {
  title: string;
  category: string;
  quantity_available: string;
  price: string;
  location: string;
}

export default function NewResourcePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    quantity_available: "",
    price: "",
    location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('resources').insert({
        title: formData.title,
        category: formData.category || null,
        quantity_available: Number(formData.quantity_available || 0),
        price: formData.price ? Number(formData.price) : null,
        location: formData.location || null,
      });

      if (error) throw error;
      router.push("/inventory");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/inventory" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Add Resource</h1>
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
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Create Resource"}
          </button>
        </form>
      </div>
    </div>
  );
}
