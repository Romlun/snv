"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href="/inventory"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Add Resource
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Track a new item in the mission inventory.
            </p>
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Resource"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
