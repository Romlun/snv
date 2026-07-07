"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Church = Database['public']['Tables']['churches']['Row'];
type DonorStage = NonNullable<Database['public']['Tables']['donors']['Row']['stage']>;
type RelationshipStatus = NonNullable<Database['public']['Tables']['donors']['Row']['relationship_status']>;
type RecurringCadence = 'monthly' | 'quarterly';

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
  notes: string;
  is_recurring: boolean;
  recurring_amount: string;
  recurring_cadence: RecurringCadence;
}

export default function NewDonorPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
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
    notes: "",
    is_recurring: false,
    recurring_amount: "",
    recurring_cadence: "monthly",
  });

  useEffect(() => {
    async function fetchData() {
      const { data: staffData } = await supabase.from('profiles').select('*');
      const { data: churchData } = await supabase.from('churches').select('*');
      setStaff(staffData || []);
      setChurches(churchData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({ ...prev, assigned_staff_id: user.id }));
      }
    }
    fetchData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('donors').insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        birthday: formData.birthday || null,
        address: formData.address || null,
        stage: formData.stage,
        relationship_status: formData.relationship_status,
        notes: formData.notes || null,
        assigned_staff_id: formData.assigned_staff_id || null,
        church_id: formData.church_id || null,
        is_recurring: formData.is_recurring,
        recurring_amount: formData.is_recurring ? Number(formData.recurring_amount) : null,
        recurring_cadence: formData.is_recurring ? formData.recurring_cadence : null,
      });

      if (error) throw error;
      router.push("/donors");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating donor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href="/donors"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Donors
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Add New Donor
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Capture donor contact details and relationship context.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Contact Details
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Birthday and address are optional.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Full Name</label>
                  <Input
                    required
                    variant="box"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Email</label>
                  <Input
                    type="email"
                    variant="box"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Phone</label>
                  <Input
                    variant="box"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Birthday</label>
                  <Input
                    type="date"
                    variant="box"
                    value={formData.birthday}
                    onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">Address</label>
                  <Textarea
                    variant="box"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                  Assign ownership and initial relationship posture.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Relationship Stage</label>
                  <Select
                    variant="box"
                    value={formData.stage}
                    onChange={e => setFormData({ ...formData, stage: e.target.value as DonorStage })}
                  >
                    <option value="New contact">New contact</option>
                    <option value="First conversation">First conversation</option>
                    <option value="Interested">Interested</option>
                    <option value="Active donor">Active donor</option>
                    <option value="Monthly supporter">Monthly supporter</option>
                    <option value="Major donor">Major donor</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Relationship Status</label>
                  <Select
                    variant="box"
                    value={formData.relationship_status}
                    onChange={e => setFormData({ ...formData, relationship_status: e.target.value as RelationshipStatus })}
                  >
                    <option value="Engaged">Engaged</option>
                    <option value="Steady">Steady</option>
                    <option value="Cooling">Cooling</option>
                    <option value="At risk">At risk</option>
                    <option value="Inactive">Inactive</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Assigned Staff</label>
                  <Select
                    variant="box"
                    value={formData.assigned_staff_id}
                    onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Church Connection</label>
                  <Select
                    variant="box"
                    value={formData.church_id}
                    onChange={e => setFormData({ ...formData, church_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {churches.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Giving Profile
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Optional recurring donor details.
                </p>
              </div>
              <div className="rounded-lg border border-outline-variant/20 bg-white/40 p-4">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-outline-variant text-primary-container focus:ring-primary-container/40"
                    checked={formData.is_recurring}
                    onChange={e => setFormData({
                      ...formData,
                      is_recurring: e.target.checked,
                      recurring_amount: e.target.checked ? formData.recurring_amount : "",
                      recurring_cadence: e.target.checked ? formData.recurring_cadence : "monthly",
                    })}
                  />
                  Recurring donor
                </label>
                {formData.is_recurring ? (
                  <div className="mt-4 grid grid-cols-1 gap-gutter md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface">Recurring Amount</label>
                      <Input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        variant="box"
                        value={formData.recurring_amount}
                        onChange={e => setFormData({ ...formData, recurring_amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface">Recurring Cadence</label>
                      <Select
                        variant="box"
                        value={formData.recurring_cadence}
                        onChange={e => setFormData({ ...formData, recurring_cadence: e.target.value as RecurringCadence })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </Select>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Notes
                </h2>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Notes</label>
                <Textarea
                  variant="box"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </section>

            <div className="flex flex-col items-center gap-4 border-t border-outline-variant/20 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:min-w-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Donor"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
