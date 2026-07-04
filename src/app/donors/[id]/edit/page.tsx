"use client";

import { use, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Church = Database["public"]["Tables"]["churches"]["Row"];
type DonorRow = Database["public"]["Tables"]["donors"]["Row"] & {
  birthday: string | null;
  address: string | null;
};
type DonorUpdate = Database["public"]["Tables"]["donors"]["Update"] & {
  birthday?: string | null;
  address?: string | null;
};
type DonorStage = Database["public"]["Tables"]["donors"]["Row"]["stage"];
type RelationshipStatus =
  Database["public"]["Tables"]["donors"]["Row"]["relationship_status"];
type RecurringCadence = "monthly" | "quarterly";

interface FormData {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  stage: DonorStage;
  relationship_status: RelationshipStatus;
  assigned_staff_id: string;
  church_id: string;
  is_recurring: boolean;
  recurring_amount: string;
  recurring_cadence: RecurringCadence;
}

export default function EditDonorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    address: "",
    stage: "New contact",
    relationship_status: "Steady",
    assigned_staff_id: "",
    church_id: "",
    is_recurring: false,
    recurring_amount: "",
    recurring_cadence: "monthly",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: staffData } = await supabase.from("profiles").select("*");
        const { data: churchData } = await supabase.from("churches").select("*");
        const { data: donor, error } = await supabase
          .from("donors")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        const donorData = donor as DonorRow;
        setStaff(staffData || []);
        setChurches(churchData || []);
        setFormData({
          name: donorData.name,
          email: donorData.email || "",
          phone: donorData.phone || "",
          birthday: donorData.birthday || "",
          address: donorData.address || "",
          stage: donorData.stage,
          relationship_status: donorData.relationship_status,
          assigned_staff_id: donorData.assigned_staff_id || "",
          church_id: donorData.church_id || "",
          is_recurring: donorData.is_recurring,
          recurring_amount: donorData.recurring_amount
            ? String(donorData.recurring_amount)
            : "",
          recurring_cadence:
            (donorData.recurring_cadence as RecurringCadence | null) ||
            "monthly",
        });
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
      const payload: DonorUpdate = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        birthday: formData.birthday || null,
        address: formData.address || null,
        stage: formData.stage,
        relationship_status: formData.relationship_status,
        assigned_staff_id: formData.assigned_staff_id || null,
        church_id: formData.church_id || null,
        is_recurring: formData.is_recurring,
        recurring_amount: formData.is_recurring
          ? Number(formData.recurring_amount)
          : null,
        recurring_cadence: formData.is_recurring
          ? formData.recurring_cadence
          : null,
      };

      const { error } = await supabase
        .from("donors")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      router.push(`/donors/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating donor");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-zinc-500">Loading donor data...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/donors/${id}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Donor
      </Link>

      <div className="rounded-xl border bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-2xl font-bold">Edit Donor</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                required
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Birthday</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.birthday}
                onChange={(e) =>
                  setFormData({ ...formData, birthday: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Relationship Stage</label>
              <select
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.stage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stage: e.target.value as DonorStage,
                  })
                }
              >
                <option value="New contact">New contact</option>
                <option value="First conversation">First conversation</option>
                <option value="Interested">Interested</option>
                <option value="Active donor">Active donor</option>
                <option value="Monthly supporter">Monthly supporter</option>
                <option value="Major donor">Major donor</option>
                <option value="Needs re-engagement">Needs re-engagement</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Staff</label>
              <select
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.assigned_staff_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assigned_staff_id: e.target.value,
                  })
                }
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Church Connection</label>
              <select
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.church_id}
                onChange={(e) =>
                  setFormData({ ...formData, church_id: e.target.value })
                }
              >
                <option value="">None</option>
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <textarea
                className="min-h-24 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4 dark:border-zinc-800">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                checked={formData.is_recurring}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_recurring: e.target.checked,
                    recurring_amount: e.target.checked
                      ? formData.recurring_amount
                      : "",
                    recurring_cadence: e.target.checked
                      ? formData.recurring_cadence
                      : "monthly",
                  })
                }
              />
              Recurring donor
            </label>

            {formData.is_recurring ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Recurring Amount
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formData.recurring_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurring_amount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Recurring Cadence
                  </label>
                  <select
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formData.recurring_cadence}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurring_cadence: e.target.value as RecurringCadence,
                      })
                    }
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
