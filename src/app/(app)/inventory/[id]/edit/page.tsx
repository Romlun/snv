"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading resource...</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href={`/inventory/${id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Resource
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
                Edit Resource
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Update inventory details and stock levels.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              icon={deleting ? undefined : Trash2}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-on-surface">Title</label>
                <Input
                  required
                  variant="box"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Category</label>
                <Input
                  variant="box"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Quantity Available</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  variant="box"
                  value={formData.quantity_available}
                  onChange={e => setFormData({ ...formData, quantity_available: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Quantity Sold</label>
                <div className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2.5 text-sm text-on-surface-variant">
                  {formData.quantity_sold || 0}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Quantity Given</label>
                <div className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2.5 text-sm text-on-surface-variant">
                  {formData.quantity_given || 0}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  variant="box"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Location</label>
                <Input
                  variant="box"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-outline-variant/20 pt-6">
              <Button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-60">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
