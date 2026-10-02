"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowUpRight, FiClock, FiRepeat } from "react-icons/fi";

import WorkspaceShell from "../../components/WorkspaceShell";
import { apiRequest } from "../../lib/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/transactions/summary")
      .then(setSummary)
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <WorkspaceShell>
      <main className="w-full px-4 py-6 sm:px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase text-[#95298E]">Operations overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal">Executive dashboard</h1>
          </div>
          <Link href="/transactions" className="flex items-center gap-2 rounded-md bg-[#95298E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7a206f]">
            Review transactions <FiArrowUpRight size={16} />
          </Link>
        </div>

        {error && <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <section className="grid gap-0 border-b border-slate-200 py-5 sm:grid-cols-3">
          <Metric label="Transaction records" value={summary?.total_transactions} icon={<FiRepeat />} />
          <Metric label="Awaiting approval" value={summary?.pending_approval} icon={<FiClock />} accent />
          <Metric label="Approved records" value={summary?.by_status?.approved || 0} icon={<FiArrowUpRight />} />
        </section>

        <section className="grid gap-8 py-7 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
              <h2 className="font-semibold">Transaction status</h2>
              <span className="text-xs text-slate-500">All recorded entries</span>
            </div>
            <div className="space-y-4 py-5">
              {[
                ["Pending", summary?.by_status?.pending || 0, "bg-amber-500"],
                ["Approved", summary?.by_status?.approved || 0, "bg-emerald-700"],
                ["Rejected", summary?.by_status?.rejected || 0, "bg-rose-600"],
              ].map(([label, count, color]) => {
                const max = Math.max(summary?.total_transactions || 0, 1);
                return (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="tabular-nums text-slate-600">{count}</span></div>
                    <div className="h-2 overflow-hidden rounded-sm bg-slate-100"><div className={`h-full ${color}`} style={{ width: `${Math.min((count / max) * 100, 100)}%` }} /></div>
                  </div>
                );
              })}
              {!summary && !error && <p className="text-sm text-slate-500">Loading summary...</p>}
            </div>
          </div>

          <div>
            <div className="border-b border-slate-200 pb-3">
              <h2 className="font-semibold">Workspace modules</h2>
            </div>
            <div className="divide-y divide-slate-200">
              <Module href="/transactions" title="Transaction register" description="Create entries and review pending approvals." />
              <Module href="/data" title="AI data query" description="Ask questions about approved ledger data." />
              <Module href="/" title="AI assistant" description="Continue multilingual assistant conversations." />
            </div>
          </div>
        </section>
      </main>
    </WorkspaceShell>
  );
}

function Metric({ label, value, icon, accent = false }) {
  return (
    <div className="flex items-center gap-4 border-r border-slate-200 py-3 last:border-0 sm:px-5 first:pl-0">
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${accent ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-900"}`}>{icon}</span>
      <div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? "—"}</p></div>
    </div>
  );
}

function Module({ href, title, description }) {
  return <Link href={href} className="block py-4 hover:text-emerald-900"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></Link>;
}