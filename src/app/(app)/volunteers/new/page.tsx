"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
}

export default function NewVolunteerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    helps_with: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("volunteers").insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        helps_with: formData.helps_with || null,
        notes: formData.notes || null,
      });

      if (error) throw error;
      router.push("/volunteers");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating volunteer");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Add Volunteer
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Add someone to the volunteer roster.
            </p>
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
                  "Add Volunteer"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
