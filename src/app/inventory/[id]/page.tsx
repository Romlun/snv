"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Loader2, Plus } from "lucide-react";
import DateField from "@/components/DateField";
import { createClient } from "@/lib/supabase/client";

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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading resource details...</p>
      </div>
    );
  }

  if (!resource) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/inventory" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <BookOpen className="h-9 w-9" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{resource.title}</h1>
              <Link href={`/inventory/${resource.id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">Edit</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {resource.category || "Uncategorized"}
              </span>
              {resource.location ? (
                <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                  {resource.location}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800 min-w-72">
          <p className="text-sm text-zinc-500 font-medium">Price</p>
          <p className="text-2xl font-bold">{formatMoney(resource.price)}</p>
          <button
            type="button"
            onClick={() => setShowTransactionForm(value => !value)}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Record Transaction
          </button>
        </div>
      </div>

      {showTransactionForm ? (
        <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="font-semibold mb-4">Record Transaction</h2>
          <form onSubmit={handleRecordTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={transactionForm.type}
                onChange={e => setTransactionForm({ ...transactionForm, type: e.target.value as TransactionType })}
              >
                <option value="sale">sale</option>
                <option value="giveaway">giveaway</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <input
                required
                type="number"
                min="1"
                step="1"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={transactionForm.quantity}
                onChange={e => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Donor</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={transactionForm.donor_id}
                onChange={e => setTransactionForm({ ...transactionForm, donor_id: e.target.value, church_id: e.target.value ? "" : transactionForm.church_id })}
              >
                <option value="">No donor selected</option>
                {donors.map(donor => (
                  <option key={donor.id} value={donor.id}>{donor.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Church</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={transactionForm.church_id}
                onChange={e => setTransactionForm({ ...transactionForm, church_id: e.target.value, donor_id: e.target.value ? "" : transactionForm.donor_id })}
              >
                <option value="">No church selected</option>
                {churches.map(church => (
                  <option key={church.id} value={church.id}>{church.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={transactionForm.amount}
                onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
              />
            </div>
            <DateField
              label="Transaction Date"
              value={transactionForm.transaction_date}
              onChange={val => setTransactionForm({ ...transactionForm, transaction_date: val })}
            />
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                value={transactionForm.notes}
                onChange={e => setTransactionForm({ ...transactionForm, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={addingTransaction}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {addingTransaction ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Save Transaction
              </button>
              <button
                type="button"
                onClick={() => setShowTransactionForm(false)}
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="font-semibold mb-4">Resource Details</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-zinc-500">Title</dt>
              <dd className="font-medium">{resource.title}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Category</dt>
              <dd className="font-medium">{resource.category || "Uncategorized"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Quantity Available</dt>
              <dd className="font-medium">{resource.quantity_available || 0}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Quantity Sold</dt>
              <dd className="font-medium">{resource.quantity_sold || 0}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Quantity Given</dt>
              <dd className="font-medium">{resource.quantity_given || 0}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Price</dt>
              <dd className="font-medium">{formatMoney(resource.price)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Location</dt>
              <dd className="font-medium">{resource.location || "Not set"}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 lg:col-span-2">
          <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800">
            <h2 className="font-semibold">Transaction History</h2>
          </div>
          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="flex flex-col gap-3 border rounded-lg p-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {transaction.type}
                        </span>
                        <p className="font-medium">Qty {transaction.quantity}</p>
                        {transaction.amount !== null ? <p className="text-sm text-green-600">{formatMoney(transaction.amount)}</p> : null}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{formatDate(transaction.transaction_date)}</p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Recipient: {transaction.recipientName || "Not set"}
                      </p>
                      {transaction.notes ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{transaction.notes}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500">
                No transactions recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
