"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

interface FormData {
  name: string;
  email: string;
  phone: string;
  helps_with: string;
  notes: string;
  is_active: boolean;
}

export default function EditVolunteerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    helps_with: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    async function fetchVolunteer() {
      try {
        const { data } = await supabase
          .from("volunteers")
          .select("*")
          .eq("id", id)
          .single();

        if (data) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            helps_with: data.helps_with || "",
            notes: data.notes || "",
            is_active: data.is_active,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }

    fetchVolunteer();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("volunteers")
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          helps_with: formData.helps_with || null,
          notes: formData.notes || null,
          is_active: formData.is_active,
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/volunteers");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating volunteer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this volunteer?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("volunteers")
        .delete()
        .eq("id", id);
      if (error) throw error;
      router.push("/volunteers");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error deleting volunteer");
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading volunteer...</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href="/volunteers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Volunteers
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
                Edit Volunteer
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Update contact info and status.
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
                <label className="text-sm font-semibold text-on-surface">
                  Name
                </label>
                <Input
                  required
                  variant="box"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Email
                </label>
                <Input
                  type="email"
                  variant="box"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Phone
                </label>
                <Input
                  type="tel"
                  variant="box"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-on-surface">
                  Helps With
                </label>
                <Input
                  variant="box"
                  placeholder="Sunday setup, event photography, ..."
                  value={formData.helps_with}
                  onChange={(e) =>
                    setFormData({ ...formData, helps_with: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-on-surface">
                  Notes
                </label>
                <Textarea
                  variant="box"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-on-surface">
                  Status
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.is_active ? "primary" : "tertiary"}
                    onClick={() =>
                      setFormData({ ...formData, is_active: true })
                    }
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!formData.is_active ? "primary" : "tertiary"}
                    onClick={() =>
                      setFormData({ ...formData, is_active: false })
                    }
                  >
                    Inactive
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-outline-variant/20 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:min-w-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
