"use client";

import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";

import WorkspaceShell from "../../components/WorkspaceShell";
import TablePagination from "../../components/TablePagination";
import { apiRequest, getCurrentUser } from "../../lib/api";

const emptyForm = {
  account_masked: "",
  counterparty: "",
  direction: "debit",
  amount: "",
  currency: "USD",
  description: "",
};

export default function TransactionsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    params.set("offset", String(page * pageSize));
    params.set("limit", String(pageSize));
    try {
      const transactions = await apiRequest(`/api/transactions?${params}`);
      setItems(transactions.items);
      setTotal(transactions.total);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [search, status, page]);

  useEffect(() => {
    getCurrentUser()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    params.set("offset", String(page * pageSize));
    params.set("limit", String(pageSize));

    apiRequest(`/api/transactions?${params}`)
      .then((transactions) => {
        if (!active) return;
        setItems(transactions.items);
        setTotal(transactions.total);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => { active = false; };
  }, [search, status, page]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await apiRequest("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      setForm(emptyForm);
      setShowForm(false);
      setNotice("Synthetic ledger transaction created and submitted for approval.");
      await load();
    } catch (requestError) { setError(requestError.message); }
  };

  const decide = async (transactionId, action) => {
    try {
      await apiRequest(`/api/transactions/${transactionId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "" }),
      });
      setNotice(`Transaction ${action}d.`);
      await load();
    } catch (requestError) { setError(requestError.message); }
  };

  return (
    <WorkspaceShell>
      <main className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div><p className="text-xs font-semibold uppercase text-[#95298E]">Internal ledger · synthetic records</p><h1 className="mt-1 text-2xl font-bold">Transactions</h1></div>
          {user && ["admin", "manager", "operator"].includes(user.role) && <button onClick={() => setShowForm((shown) => !shown)} className="flex items-center gap-2 rounded-md bg-[#95298E] px-4 py-2.5 text-sm font-semibold text-white"><FiPlus /> New entry</button>}
        </div>

        {notice && <p role="status" className="mt-4 border border-[#95298E] bg-[#95298E] p-3 text-sm text-white">{notice}</p>}
        {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        {showForm && (
          <form onSubmit={create} className="my-5 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-600">Account (masked)<input required maxLength={32} placeholder="•••• 1042" value={form.account_masked} onChange={(event) => setForm({ ...form, account_masked: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-slate-600">Counterparty<input required value={form.counterparty} onChange={(event) => setForm({ ...form, counterparty: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-slate-600">Direction<select value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="debit">Debit</option><option value="credit">Credit</option></select></label>
            <label className="text-xs font-medium text-slate-600">Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-slate-600">Currency<input required pattern="[A-Z]{3}" maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2">Description<input maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
            <div className="flex items-end gap-2"><button className="rounded-md bg-[#95298E] px-4 py-2 text-sm font-semibold text-white">Create pending entry</button><button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button></div>
          </form>
        )}

        <div className="my-5 flex flex-wrap items-center gap-3">
          <label className="flex min-w-60 flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2"><FiSearch className="text-slate-400" /><input value={search} onChange={(event) => { setPage(0); setSearch(event.target.value); }} placeholder="Search reference, account, counterparty" className="w-full text-sm outline-none" /></label>
          <select value={status} onChange={(event) => { setPage(0); setStatus(event.target.value); }} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
        </div>

        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Account / counterparty</th><th className="px-4 py-3">Direction</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(item.occurred_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className="block font-medium">{item.counterparty}</span><span className="text-xs text-slate-500">{item.account_masked}</span></td>
                  <td className="px-4 py-3 capitalize">{item.direction}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.currency} {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3"><span className="rounded-sm bg-slate-100 px-2 py-1 text-xs capitalize">{item.status}</span></td>
                  <td className="px-4 py-3">{item.status === "pending" && user && ["admin", "manager"].includes(user.role) ? <div className="flex gap-2"><button onClick={() => decide(item.id, "approve")} className="text-xs font-semibold text-[#95298E]">Approve</button><button onClick={() => decide(item.id, "reject")} className="text-xs font-semibold text-rose-700">Reject</button></div> : <span className="text-xs text-slate-400">—</span>}</td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No transactions match these filters.</td></tr>}
            </tbody>
          </table>
          <TablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </main>
    </WorkspaceShell>
  );
}