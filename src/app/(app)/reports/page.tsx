"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Church as ChurchIcon,
  Coins,
  GraduationCap,
  Landmark,
  Loader2,
  MapPinned,
  Receipt,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { createClient } from "@/lib/supabase/client";

interface ReportStats {
  totalDonors: number;
  totalChurches: number;
  totalLanguageSchools: number;
  totalProjects: number;
  totalGivingAllTime: number;
  totalGivingThisYear: number;
  totalGiftsRecorded: number;
  churchVisitsLogged: number;
  distinctChurchesVisited: number;
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatCount(value: number) {
  return value.toLocaleString();
}

export default function ReportsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const currentYear = new Date().getFullYear();

        const [
          donorsResult,
          churchesResult,
          languageSchoolsResult,
          projectsResult,
          giftsResult,
          churchVisitsResult,
        ] = await Promise.all([
          supabase.from("donors").select("*", { count: "exact", head: true }),
          supabase.from("churches").select("*", { count: "exact", head: true }),
          supabase
            .from("language_schools")
            .select("*", { count: "exact", head: true }),
          supabase.from("projects").select("*", { count: "exact", head: true }),
          supabase.from("gifts").select("amount, gift_date"),
          supabase
            .from("contact_logs")
            .select("church_id")
            .eq("type", "church visit"),
        ]);

        const gifts = (giftsResult.data || []) as {
          amount: number;
          gift_date: string;
        }[];
        const totalGivingAllTime = gifts.reduce(
          (sum, gift) => sum + Number(gift.amount || 0),
          0,
        );
        const totalGivingThisYear = gifts
          .filter((gift) => gift.gift_date.startsWith(`${currentYear}-`))
          .reduce((sum, gift) => sum + Number(gift.amount || 0), 0);

        const churchVisitRows = (churchVisitsResult.data || []) as {
          church_id: string | null;
        }[];
        const distinctChurchesVisited = new Set(
          churchVisitRows
            .map((row) => row.church_id)
            .filter((id): id is string => Boolean(id)),
        ).size;

        setStats({
          totalDonors: donorsResult.count ?? 0,
          totalChurches: churchesResult.count ?? 0,
          totalLanguageSchools: languageSchoolsResult.count ?? 0,
          totalProjects: projectsResult.count ?? 0,
          totalGivingAllTime,
          totalGivingThisYear,
          totalGiftsRecorded: gifts.length,
          churchVisitsLogged: churchVisitRows.length,
          distinctChurchesVisited,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !stats) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading reports...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
            Reports
          </h1>
          <p className="text-sm text-on-surface-variant">
            A first look at the metrics already tracked across the CRM.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-headline text-headline-md text-on-surface">
          People &amp; Partners
        </h2>
        <div className="grid grid-cols-1 gap-cs-md sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Donors"
            value={formatCount(stats.totalDonors)}
            icon={Users}
          />
          <StatCard
            label="Total Churches"
            value={formatCount(stats.totalChurches)}
            icon={ChurchIcon}
          />
          <StatCard
            label="Total Language Schools"
            value={formatCount(stats.totalLanguageSchools)}
            icon={GraduationCap}
          />
          <StatCard
            label="Total Projects"
            value={formatCount(stats.totalProjects)}
            icon={Briefcase}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-headline-md text-on-surface">
          Giving
        </h2>
        <div className="grid grid-cols-1 gap-cs-md sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Giving, All-Time"
            value={formatMoney(stats.totalGivingAllTime)}
            icon={Landmark}
          />
          <StatCard
            label="Total Giving, This Year"
            value={formatMoney(stats.totalGivingThisYear)}
            icon={Coins}
          />
          <StatCard
            label="Total Gifts Recorded"
            value={formatCount(stats.totalGiftsRecorded)}
            icon={Receipt}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-headline-md text-on-surface">
          Field Activity
        </h2>
        <div className="grid grid-cols-1 gap-cs-md sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Church Visits Logged"
            value={formatCount(stats.churchVisitsLogged)}
            icon={MapPinned}
          />
          <StatCard
            label="Distinct Churches Visited"
            value={formatCount(stats.distinctChurchesVisited)}
            icon={ChurchIcon}
          />
          <StatCard
            label="Total Projects"
            value={formatCount(stats.totalProjects)}
            icon={Briefcase}
          />
        </div>
        <p className="text-sm text-on-surface-variant">
          Trips aren&apos;t tracked separately from other projects yet — tag a
          project to distinguish it once that matters.
        </p>
      </section>
    </div>
  );
}
