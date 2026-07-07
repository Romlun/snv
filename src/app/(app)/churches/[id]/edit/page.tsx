"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type RelationshipStatus =
  Database["public"]["Tables"]["churches"]["Row"]["relationship_status"];

interface FormData {
  name: string;
  pastor: string;
  address: string;
  phone: string;
  email: string;
  denomination: string;
  relationship_status: RelationshipStatus;
  assigned_staff_id: string;
}

export default function EditChurchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [staff, setStaff] = useState<Profile[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    pastor: "",
    address: "",
    phone: "",
    email: "",
    denomination: "",
    relationship_status: "Steady",
    assigned_staff_id: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: staffData } = await supabase.from("profiles").select("*");
        setStaff(staffData || []);

        const { data: church } = await supabase
          .from("churches")
          .select("*")
          .eq("id", id)
          .single();

        if (church) {
          setFormData({
            name: church.name,
            pastor: church.pastor || "",
            address: church.address || "",
            phone: church.phone || "",
            email: church.email || "",
            denomination: church.denomination || "",
            relationship_status: church.relationship_status,
            assigned_staff_id: church.assigned_staff_id || "",
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
      const { error } = await supabase
        .from("churches")
        .update({
          name: formData.name,
          pastor: formData.pastor || null,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          denomination: formData.denomination || null,
          relationship_status: formData.relationship_status,
          assigned_staff_id: formData.assigned_staff_id || null,
        })
        .eq("id", id);

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
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading church data...</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href={`/churches/${id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Church
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Edit Church
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Update church contact details and relationship context.
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
                    Church Name
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
                    Pastor
                  </label>
                  <Input
                    variant="box"
                    value={formData.pastor}
                    onChange={e =>
                      setFormData({ ...formData, pastor: e.target.value })
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
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Address
                  </label>
                  <Input
                    variant="box"
                    value={formData.address}
                    onChange={e =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Relationship
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Update ownership and relationship posture.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Denomination
                  </label>
                  <Input
                    variant="box"
                    value={formData.denomination}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        denomination: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Relationship Status
                  </label>
                  <Select
                    variant="box"
                    value={formData.relationship_status}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        relationship_status: e.target.value as RelationshipStatus,
                      })
                    }
                  >
                    <option value="Engaged">Engaged</option>
                    <option value="Steady">Steady</option>
                    <option value="Cooling">Cooling</option>
                    <option value="At risk">At risk</option>
                    <option value="Inactive">Inactive</option>
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
