"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import GivingStatementView, {
  type GivingStatementGift,
} from "@/components/GivingStatementView";

interface DonorSummary {
  id: string;
  name: string;
}

const YEAR_COUNT = 5;

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: YEAR_COUNT }, (_, i) => currentYear - i);
}

function LoadingCard() {
  return (
    <Card className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-on-surface-variant">Loading giving statement...</p>
    </Card>
  );
}

export default function DonorStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingCard />}>
      <DonorStatementContent params={params} />
    </Suspense>
  );
}

function DonorStatementContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yearOptions = useMemo(getYearOptions, []);

  const requestedYear = Number(searchParams.get("year"));
  const year = yearOptions.includes(requestedYear)
    ? requestedYear
    : yearOptions[0];

  const [donor, setDonor] = useState<DonorSummary | null>(null);
  const [orgName, setOrgName] = useState("");
  const [gifts, setGifts] = useState<GivingStatementGift[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchStatementData() {
      try {
        setLoading(true);

        const { data: donorData, error: donorError } = await supabase
          .from("donors")
          .select("id, name")
          .eq("id", id)
          .single();

        if (donorError) throw donorError;
        setDonor(donorData);

        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .limit(1)
          .single();
        setOrgName(orgData?.name || "");

        const { data: giftData } = await supabase
          .from("gifts")
          .select("id, amount, gift_date, method")
          .eq("donor_id", id)
          .order("gift_date", { ascending: true });
        setGifts((giftData || []) as GivingStatementGift[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStatementData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleYearChange(newYear: number) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("year", String(newYear));
    router.replace(`${pathname}?${nextParams.toString()}`);
  }

  if (loading) {
    return <LoadingCard />;
  }

  if (!donor) {
    notFound();
  }

  const yearGifts = gifts.filter((gift) =>
    gift.gift_date.startsWith(`${year}-`),
  );

  return (
    <div className="space-y-stack-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/donors/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Donor
        </Link>
        <div className="flex items-center gap-2">
          <label
            htmlFor="statement-year"
            className="text-sm font-semibold text-on-surface"
          >
            Year
          </label>
          <Select
            id="statement-year"
            variant="box"
            className="w-28"
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <GivingStatementView
        orgName={orgName}
        entityName={donor.name}
        entityType="donor"
        year={year}
        gifts={yearGifts}
      />
    </div>
  );
}
