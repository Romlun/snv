"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { SchoolStatus } from "@/components/SchoolStatusSelect";
import { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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
      const { data: staffData } = await supabase.from("profiles").select("*");
      setStaff(staffData || []);

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const { error } = await supabase.from("language_schools").insert({
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
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href="/language-schools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Language Schools
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Add New Language School
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Capture school contact details and outreach context.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Contact Details
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    School Name
                  </label>
                  <Input
                    required
                    variant="box"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Contact Person
                  </label>
                  <Input
                    variant="box"
                    value={formData.contact_person}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
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
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Phone
                  </label>
                  <Input
                    variant="box"
                    value={formData.phone}
                    onChange={e =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    City
                  </label>
                  <Input
                    variant="box"
                    value={formData.city}
                    onChange={e =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    State
                  </label>
                  <Input
                    variant="box"
                    value={formData.state}
                    onChange={e =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Website
                  </label>
                  <Input
                    variant="box"
                    value={formData.website}
                    onChange={e =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Outreach
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Track source, status, ownership, and next step.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Source
                  </label>
                  <Input
                    variant="box"
                    value={formData.source}
                    onChange={e =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Status
                  </label>
                  <Select
                    variant="box"
                    value={formData.status}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        status: e.target.value as SchoolStatus,
                      })
                    }
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Connected">Connected</option>
                    <option value="Declined">Declined</option>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Assigned Staff
                  </label>
                  <Select
                    variant="box"
                    value={formData.assigned_staff_id}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        assigned_staff_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {staff.map(row => (
                      <option key={row.id} value={row.id}>
                        {row.full_name || row.email}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Next Step
                  </label>
                  <Input
                    variant="box"
                    value={formData.next_step}
                    onChange={e =>
                      setFormData({ ...formData, next_step: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Notes
                </h2>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Notes
                </label>
                <Textarea
                  variant="box"
                  value={formData.notes}
                  onChange={e =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </section>

            <div className="flex flex-col items-center gap-4 border-t border-outline-variant/20 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:min-w-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Create Language School"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
