"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SchoolStatus, SchoolStatusSelect } from "@/components/SchoolStatusSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import NotesLog from "@/components/NotesLog";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Database } from "@/types/database";

type Profile = Database['public']['Tables']['profiles']['Row'];
type ContactLog = Database['public']['Tables']['contact_logs']['Row'] & {
  language_school_id: string | null;
};

interface LanguageSchool {
  id: string;
  org_id: string;
  name: string;
  city: string | null;
  state: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  source: string | null;
  status: SchoolStatus;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  next_step: string | null;
  notes: string | null;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function daysSince(value: string | null) {
  if (!value) return "Never";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.floor((today.getTime() - date.getTime()) / 86400000));
  if (days === 0) return "Today";
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function formatDate(value: string | null | undefined, fallback = "Not provided") {
  if (!value) return fallback;
  const date = DATE_RE.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function LanguageSchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [school, setSchool] = useState<LanguageSchool | null>(null);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function fetchSchoolData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }

      const { data: schoolData, error: schoolError } = await supabase
        .from('language_schools')
        .select('*')
        .eq('id', id)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData as LanguageSchool);

      if (schoolData.assigned_staff_id) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', schoolData.assigned_staff_id)
          .single();
        setStaff(staffData);
      } else {
        setStaff(null);
      }

      const { data: logData } = await supabase
        .from('contact_logs')
        .select('*')
        .eq('language_school_id', id)
        .order('contact_date', { ascending: false });
      setContactLogs((logData || []) as ContactLog[]);
    } catch (err) {
      console.error(err);
    } finally {
      if (showPageLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSchoolData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading language school details...</p>
      </Card>
    );
  }

  if (!school) {
    notFound();
  }

  return (
    <div className="space-y-stack-lg">
      <Link
        href="/language-schools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Language Schools
      </Link>

      <section className="glass-card overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-container/15 font-headline text-headline-lg font-semibold text-primary">
              {getInitials(school.name)}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{school.source || "No source listed"}</Badge>
                </div>
                <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
                  {school.name}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Partner since {formatDate(school.created_at, "Not recorded")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  icon={MessageSquare}
                  onClick={() => {
                    window.location.href = `/language-schools/${school.id}/log`;
                  }}
                >
                  Log Contact
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Pencil}
                  onClick={() => {
                    window.location.href = `/language-schools/${school.id}/edit`;
                  }}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-cs-md md:grid-cols-4">
        <Card padding="md" className="space-y-3">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Current Status
          </span>
          <div>
            <SchoolStatusSelect
              id={school.id}
              value={school.status}
              onSaved={status => setSchool(prev => prev ? { ...prev, status } : prev)}
            />
          </div>
          <p className="text-sm text-on-surface-variant">Acquisition funnel stage</p>
        </Card>
        <Card padding="md" className="space-y-3">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Days Since Contact
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums text-on-surface">
            {daysSince(school.last_contact_date)}
          </p>
          <p className="text-sm text-on-surface-variant">Since last logged contact</p>
        </Card>
        <Card padding="md" className="space-y-3">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Next Follow-up
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums text-on-surface">
            {school.next_follow_up_date ? formatDate(school.next_follow_up_date) : "None scheduled"}
          </p>
          <p className="text-sm text-on-surface-variant">{school.next_step || "No next step set"}</p>
        </Card>
        <Card padding="md" className="space-y-3">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Assigned Staff
          </span>
          <p className="font-headline text-headline-md font-bold text-on-surface">
            {staff?.full_name || "Unassigned"}
          </p>
          <p className="text-sm text-on-surface-variant">Responsible team member</p>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <aside className="space-y-gutter lg:col-span-1">
          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <QuickAction
                icon={MessageSquare}
                label="Log Contact"
                href={`/language-schools/${school.id}/log`}
              />
              <QuickAction
                icon={Pencil}
                label="Edit Profile"
                href={`/language-schools/${school.id}/edit`}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Contact Information
            </h2>
            <div className="space-y-4">
              <DetailRow icon={UserIcon} label="Contact" value={school.contact_person || "Not listed"} />
              <DetailRow icon={Mail} label="Email" value={school.email || "No email provided"} />
              <DetailRow icon={Phone} label="Phone" value={school.phone || "No phone provided"} />
              <DetailRow
                icon={MapPin}
                label="Location"
                value={[school.city, school.state].filter(Boolean).join(", ") || "No location provided"}
              />
              <DetailRow icon={Globe} label="Website" value={school.website || "No website provided"} />
              <div
                className={
                  school.next_follow_up_date
                    ? "flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
                    : "flex items-center gap-3 px-3 py-2 text-sm font-semibold text-on-surface-variant"
                }
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {school.next_follow_up_date
                    ? `Next follow-up: ${new Date(school.next_follow_up_date + "T00:00:00").toLocaleDateString()}`
                    : "No follow-up scheduled"}
                </span>
              </div>
              <DetailRow icon={Clock} label="Next Step" value={school.next_step || "Not set"} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Internal Details
            </h2>
            <div className="space-y-5">
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Assigned To
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <UserIcon className="h-4 w-4 text-primary" />
                  {staff?.full_name || "Unassigned"}
                </div>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Organization ID
                </p>
                <p className="break-all text-sm font-semibold text-on-surface">{school.org_id}</p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  School ID
                </p>
                <p className="break-all text-sm font-semibold text-on-surface">{school.id}</p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Created
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {new Date(school.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Updated
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {new Date(school.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </aside>

        <main className="space-y-gutter lg:col-span-2">
          <Card>
            <h2 className="mb-4 font-headline text-headline-md text-on-surface">
              Notes / Next Step
            </h2>
            <NotesLog
              entityType="language_school"
              entityId={school.id}
              entityLabel={school.name}
              onNextStepSaved={next_step => setSchool(prev => prev ? { ...prev, next_step } : prev)}
              onFollowUpDateSaved={next_follow_up_date => setSchool(prev => prev ? { ...prev, next_follow_up_date } : prev)}
            />
          </Card>

          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Contact History
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Real logged contacts and outcomes.
                </p>
              </div>
              <Link
                href={`/language-schools/${school.id}/log`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                + Log Contact
              </Link>
            </Card.Header>
            <Card.Body>
              {contactLogs.length > 0 ? (
                <div className="relative space-y-6 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-outline-variant/20">
                  {contactLogs.map((log) => (
                    <div key={log.id} className="relative flex gap-5">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="rounded-xl border border-outline-variant/15 bg-white/40 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-on-surface">
                            {log.type.charAt(0).toUpperCase() + log.type.slice(1)} contact
                          </p>
                          <span className="text-xs text-on-surface-variant">
                            {formatDate(log.contact_date)}
                          </span>
                        </div>
                        {log.notes ? (
                          <p className="mt-2 text-sm text-on-surface-variant">{log.notes}</p>
                        ) : null}
                        {log.outcome ? (
                          <p className="mt-2 text-xs italic text-on-surface-variant">
                            Outcome: {log.outcome}
                          </p>
                        ) : null}
                        {log.next_step ? (
                          <p className="mt-2 text-xs italic text-on-surface-variant">
                            Next step: {log.next_step}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No contacts logged yet.
                </div>
              )}
            </Card.Body>
          </Card>
        </main>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: typeof MessageSquare;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex items-center gap-3 text-sm font-semibold text-on-surface">
        <Icon className="h-4 w-4 text-primary-container" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-on-surface-variant" />
    </>
  );

  const className =
    "flex w-full items-center justify-between rounded-lg border border-outline-variant/20 bg-white/50 px-4 py-3 text-left transition-colors hover:border-primary-container/40 hover:bg-primary-container/5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="mt-1 text-on-surface">{value}</p>
      </div>
    </div>
  );
}
