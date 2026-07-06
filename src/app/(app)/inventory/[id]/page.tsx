"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HeartHandshake, Loader2, Pencil, Plus, ShoppingCart } from "lucide-react";
import DateField from "@/components/DateField";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";

type TransactionType = 'sale' | 'giveaway';

interface Resource {
  id: string;
  title: string;
  category: string | null;
  quantity_available: number | null;
  quantity_sold: number | null;
  quantity_given: number | null;
  price: number | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface RecipientOption {
  id: string;
  name: string;
}

interface RecipientProfile {
  name: string | null;
}

interface ResourceTransactionRow {
  id: string;
  resource_id: string | null;
  donor_id: string | null;
  church_id: string | null;
  staff_id: string | null;
  quantity: number;
  type: TransactionType;
  amount: number | null;
  transaction_date: string | null;
  notes: string | null;
  donors: RecipientProfile | RecipientProfile[] | null;
  churches: RecipientProfile | RecipientProfile[] | null;
}

interface ResourceTransaction {
  id: string;
  quantity: number;
  type: TransactionType;
  amount: number | null;
  transaction_date: string | null;
  notes: string | null;
  recipientName: string | null;
}

interface TransactionFormData {
  type: TransactionType;
  quantity: string;
  donor_id: string;
  church_id: string;
  amount: string;
  transaction_date: string;
  notes: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatMoney(value: number | null) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function todayDateInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function validDateOrNull(value: string) {
  if (!DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

function getRecipientName(transaction: ResourceTransactionRow) {
  const donor = Array.isArray(transaction.donors) ? transaction.donors[0] : transaction.donors;
  const church = Array.isArray(transaction.churches) ? transaction.churches[0] : transaction.churches;
  return donor?.name || church?.name || null;
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString();
}

function getAbbreviation(title: string) {
  const words = title.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join("");
}

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [resource, setResource] = useState<Resource | null>(null);
  const [transactions, setTransactions] = useState<ResourceTransaction[]>([]);
  const [donors, setDonors] = useState<RecipientOption[]>([]);
  const [churches, setChurches] = useState<RecipientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionForm, setTransactionForm] = useState<TransactionFormData>({
    type: "sale",
    quantity: "",
    donor_id: "",
    church_id: "",
    amount: "",
    transaction_date: todayDateInputValue(),
    notes: "",
  });
  const [amountWasAutoFilled, setAmountWasAutoFilled] = useState(true);

  async function fetchResourceData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }

      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (resourceError) throw resourceError;
      setResource(resourceData as Resource);

      const [{ data: donorData }, { data: churchData }, { data: transactionData }] = await Promise.all([
        supabase.from('donors').select('id, name').order('name'),
        supabase.from('churches').select('id, name').order('name'),
        supabase
          .from('resource_transactions')
          .select('id, resource_id, donor_id, church_id, staff_id, quantity, type, amount, transaction_date, notes, donors(name), churches(name)')
          .eq('resource_id', id)
          .order('transaction_date', { ascending: false }),
      ]);

      setDonors((donorData || []) as RecipientOption[]);
      setChurches((churchData || []) as RecipientOption[]);
      setTransactions(((transactionData || []) as ResourceTransactionRow[]).map(transaction => ({
        id: transaction.id,
        quantity: transaction.quantity,
        type: transaction.type,
        amount: transaction.amount,
        transaction_date: transaction.transaction_date,
        notes: transaction.notes,
        recipientName: getRecipientName(transaction),
      })));
    } catch (err) {
      console.error(err);
    } finally {
      if (showPageLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchResourceData(true);
  }, [id]);

  function getAutoAmount(quantityValue: string) {
    if (resource?.price === null || resource?.price === undefined) return null;

    const quantity = Number(quantityValue);
    if (!quantity || quantity <= 0) return "";

    return (Number(resource.price) * quantity).toFixed(2);
  }

  const handleTransactionTypeChange = (type: TransactionType) => {
    const shouldAutoFill = amountWasAutoFilled || !transactionForm.amount;
    const autoAmount = type === "sale" && shouldAutoFill ? getAutoAmount(transactionForm.quantity) : null;

    setTransactionForm(prev => ({
      ...prev,
      type,
      amount: type === "giveaway" && amountWasAutoFilled ? "" : autoAmount !== null ? autoAmount : prev.amount,
    }));

    if (type === "sale" && shouldAutoFill && autoAmount !== null) {
      setAmountWasAutoFilled(true);
    }
  };

  const handleQuantityChange = (quantity: string) => {
    const shouldAutoFill = transactionForm.type === "sale" && (amountWasAutoFilled || !transactionForm.amount);
    const autoAmount = shouldAutoFill ? getAutoAmount(quantity) : null;

    setTransactionForm(prev => ({
      ...prev,
      quantity,
      amount: autoAmount !== null ? autoAmount : prev.amount,
    }));

    if (shouldAutoFill && autoAmount !== null) {
      setAmountWasAutoFilled(true);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTransaction(true);

    try {
      const quantity = Number(transactionForm.quantity);
      if (!quantity || quantity <= 0) {
        throw new Error("Enter a valid quantity");
      }

      const transactionDate = validDateOrNull(transactionForm.transaction_date);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('resource_transactions').insert({
        resource_id: id,
        donor_id: transactionForm.donor_id || null,
        church_id: transactionForm.church_id || null,
        staff_id: user?.id || null,
        quantity,
        type: transactionForm.type,
        amount: transactionForm.amount ? Number(transactionForm.amount) : null,
        transaction_date: transactionDate || undefined,
        notes: transactionForm.notes || null,
      });

      if (error) throw error;

      await fetchResourceData();
      setTransactionForm({
        type: "sale",
        quantity: "",
        donor_id: "",
        church_id: "",
        amount: "",
        transaction_date: todayDateInputValue(),
        notes: "",
      });
      setAmountWasAutoFilled(true);
      setShowTransactionForm(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error recording transaction");
    } finally {
      setAddingTransaction(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading resource details...</p>
      </Card>
    );
  }

  if (!resource) {
    notFound();
  }

  return (
    <div className="space-y-gutter">
      <Link
        href="/inventory"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      <section className="glass-card overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg border border-outline-variant/20 bg-primary-container/10 p-2 text-center">
              <span className="font-headline text-headline-md font-semibold text-primary/40 select-none">
                {getAbbreviation(resource.title)}
              </span>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{resource.category || "Uncategorized"}</Badge>
                  {resource.location ? <Badge variant="neutral">{resource.location}</Badge> : null}
                </div>
                <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
                  {resource.title}
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  icon={Plus}
                  onClick={() => setShowTransactionForm(value => !value)}
                >
                  Record Transaction
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Pencil}
                  onClick={() => {
                    window.location.href = `/inventory/${resource.id}/edit`;
                  }}
                >
                  Edit Resource
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/15 bg-white/45 p-4 lg:min-w-64">
            <div>
              <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Price
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">Per unit</p>
            </div>
            <p className="font-headline text-headline-md font-bold text-primary">
              {formatMoney(resource.price)}
            </p>
          </div>
        </div>
      </section>

      {showTransactionForm ? (
        <Card>
          <h2 className="mb-4 font-headline text-headline-md text-on-surface">
            Record Transaction
          </h2>
          <form onSubmit={handleRecordTransaction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Type</label>
              <Select
                variant="box"
                value={transactionForm.type}
                onChange={e => handleTransactionTypeChange(e.target.value as TransactionType)}
              >
                <option value="sale">sale</option>
                <option value="giveaway">giveaway</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Quantity</label>
              <Input
                required
                variant="box"
                type="number"
                min="1"
                step="1"
                value={transactionForm.quantity}
                onChange={e => handleQuantityChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Donor</label>
              <Select
                variant="box"
                value={transactionForm.donor_id}
                onChange={e => setTransactionForm({ ...transactionForm, donor_id: e.target.value, church_id: e.target.value ? "" : transactionForm.church_id })}
              >
                <option value="">No donor selected</option>
                {donors.map(donor => (
                  <option key={donor.id} value={donor.id}>{donor.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Church</label>
              <Select
                variant="box"
                value={transactionForm.church_id}
                onChange={e => setTransactionForm({ ...transactionForm, church_id: e.target.value, donor_id: e.target.value ? "" : transactionForm.donor_id })}
              >
                <option value="">No church selected</option>
                {churches.map(church => (
                  <option key={church.id} value={church.id}>{church.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Amount</label>
              <Input
                variant="box"
                type="number"
                min="0"
                step="0.01"
                value={transactionForm.amount}
                onChange={e => {
                  setAmountWasAutoFilled(false);
                  setTransactionForm({ ...transactionForm, amount: e.target.value });
                }}
              />
            </div>
            <DateField
              label="Transaction Date"
              value={transactionForm.transaction_date}
              onChange={val => setTransactionForm({ ...transactionForm, transaction_date: val })}
            />
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-on-surface">Notes</label>
              <Textarea
                variant="box"
                value={transactionForm.notes}
                onChange={e => setTransactionForm({ ...transactionForm, notes: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
              <Button type="submit" disabled={addingTransaction}>
                {addingTransaction ? "Saving..." : "Save Transaction"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowTransactionForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <aside className="space-y-gutter lg:col-span-1">
          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Resource Details
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                <span className="text-on-surface-variant">Category</span>
                <span className="font-semibold text-on-surface">{resource.category || "Uncategorized"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                <span className="text-on-surface-variant">Quantity Available</span>
                <span className="font-semibold tabular-nums text-on-surface">{resource.quantity_available || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                <span className="text-on-surface-variant">Quantity Sold</span>
                <span className="font-semibold tabular-nums text-on-surface">{resource.quantity_sold || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                <span className="text-on-surface-variant">Quantity Given</span>
                <span className="font-semibold tabular-nums text-on-surface">{resource.quantity_given || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                <span className="text-on-surface-variant">Price</span>
                <span className="font-semibold tabular-nums text-on-surface">{formatMoney(resource.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Location</span>
                <span className="font-semibold text-on-surface">{resource.location || "Not set"}</span>
              </div>
            </div>
          </Card>
        </aside>

        <main className="space-y-gutter lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <h2 className="font-headline text-headline-md text-on-surface">
                Transaction History
              </h2>
            </Card.Header>
            <Card.Body>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex flex-col gap-3 rounded-xl border border-outline-variant/15 bg-white/40 p-4 transition-colors hover:bg-primary-container/5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                          {transaction.type === "sale" ? (
                            <ShoppingCart className="h-5 w-5" />
                          ) : (
                            <HeartHandshake className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold capitalize text-on-surface">
                            {transaction.type} - {transaction.quantity} units
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {transaction.recipientName || "No recipient recorded"}
                          </p>
                          {transaction.notes ? (
                            <p className="mt-1 text-sm text-on-surface-variant">{transaction.notes}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-primary">
                          {transaction.amount !== null ? formatMoney(transaction.amount) : "Free"}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(transaction.transaction_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No transactions recorded yet.
                </div>
              )}
            </Card.Body>
          </Card>
        </main>
      </div>
    </div>
  );
}
