"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiCheck, FiDatabase, FiPlay } from "react-icons/fi";

import WorkspaceShell from "../../components/WorkspaceShell";
import TablePagination from "../../components/TablePagination";
import { apiRequest } from "../../lib/api";

export default function DataQueryPage() {
  const [question, setQuestion] = useState("");
  const [proposal, setProposal] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resultsPage, setResultsPage] = useState(0);
  const resultPageSize = 10;
  const resultRows = result?.rows?.slice(
    resultsPage * resultPageSize,
    (resultsPage + 1) * resultPageSize
  ) || [];

  const numericColumn = useMemo(() => {
    if (!result?.rows?.length) return null;
    return result.columns.find((column) => result.rows.some((row) => {
      const value = row[column];
      return value !== null && value !== "" && Number.isFinite(Number(value));
    })) || null;
  }, [result]);

  const ask = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setProposal(null);
    setResult(null);
    setResultsPage(0);
    setConfirmed(false);
    try {
      const response = await apiRequest("/api/data/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      setProposal(response);
      if (!response.requires_confirmation) setResult(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!proposal?.proposal_id) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest("/api/data/query/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposal.proposal_id }),
      });
      setResult(response);
      setConfirmed(true);
      setProposal(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkspaceShell>
      <main className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-8">
        <div className="border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold uppercase text-[#95298E]">AI data workspace</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><FiDatabase /> Ask the ledger</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ask a question in natural language. Read queries run against the synthetic transaction ledger; any AI-proposed entry is previewed and must be confirmed before it is added as pending.</p>
        </div>

        <section className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <form onSubmit={ask} className="border border-slate-300 bg-white p-4">
              <label htmlFor="ledger-question" className="mb-2 block text-sm font-semibold">Your question</label>
              <textarea id="ledger-question" required minLength={3} maxLength={2000} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: Show pending debit transactions over 500 USD" rows={3} className="w-full resize-y border border-slate-200 p-3 text-sm outline-none focus:border-[#95298E]" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">Only the transaction table is available to the AI.</span>
                <button disabled={loading || question.trim().length < 3} className="flex items-center gap-2 rounded-md bg-[#95298E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FiPlay size={14} />{loading ? "Working..." : "Generate query"}</button>
              </div>
            </form>

            {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

            {proposal && (
              <section className="mt-5 border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3"><h2 className="font-semibold">Generated SQL</h2><p className="mt-1 text-sm text-slate-600">{proposal.explanation}</p></div>
                <pre className="overflow-x-auto bg-slate-950 p-4 text-xs leading-6 text-purple-100"><code>{proposal.sql}</code></pre>
                {proposal.requires_confirmation && (
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-amber-200 bg-amber-50 p-4">
                    <p className="flex max-w-2xl items-start gap-2 text-sm text-amber-950"><FiAlertTriangle className="mt-0.5 shrink-0" />This creates one synthetic transaction in pending status. Review the SQL above; it will not run until you confirm.</p>
                    <button disabled={loading} onClick={confirm} className="rounded-md bg-[#95298E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Applying..." : "Confirm and add pending entry"}</button>
                  </div>
                )}
              </section>
            )}

            {result && (
              <section className="mt-5 min-w-0 border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div><h2 className="font-semibold">{confirmed ? "Entry created" : "Query results"}</h2><p className="mt-1 text-sm text-slate-500">{result.message || `${result.row_count} rows returned`}</p></div>
                  {confirmed && <span className="flex items-center gap-1 text-sm font-medium text-[#95298E]"><FiCheck /> Awaiting approval</span>}
                </div>
                {result.sql && <pre className="overflow-x-auto bg-slate-950 p-3 text-xs leading-5 text-purple-100"><code>{result.sql}</code></pre>}
                {result.rows?.length > 0 && numericColumn && <MiniChart rows={result.rows} columns={result.columns} numericColumn={numericColumn} />}
                {result.rows?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr>{result.columns.map((column) => <th key={column} className="px-4 py-2.5">{column.replaceAll("_", " ")}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">{resultRows.map((row, rowIndex) => <tr key={resultsPage * resultPageSize + rowIndex}>{result.columns.map((column) => <td key={column} className="whitespace-nowrap px-4 py-2.5">{String(row[column] ?? "—")}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ) : !result.message && <p className="p-5 text-sm text-slate-500">No rows matched the question.</p>}
                {result.rows?.length > 0 && <TablePagination page={resultsPage} pageSize={resultPageSize} total={result.rows.length} onPageChange={setResultsPage} />}
              </section>
            )}
          </div>

          <aside className="border-l border-slate-200 pl-5">
            <h2 className="text-sm font-semibold">Available fields</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["reference", "Synthetic transaction ID"],
                ["account_masked", "Masked account only"],
                ["counterparty", "Synthetic recipient or sender"],
                ["direction", "Credit or debit"],
                ["amount / currency", "Entry amount and currency"],
                ["status", "Pending, approved, rejected, posted"],
                ["occurred_at", "Recorded transaction date"],
              ].map(([name, description]) => <div key={name}><dt className="font-mono text-xs text-[#95298E]">{name}</dt><dd className="mt-0.5 text-xs text-slate-500">{description}</dd></div>)}
            </dl>
            <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">AI query reads are capped at 100 rows. Destructive SQL, access to users, and external money movement are not supported.</p>
          </aside>
        </section>
      </main>
    </WorkspaceShell>
  );
}

function MiniChart({ rows, columns, numericColumn }) {
  const labelColumn = columns.find((column) => column !== numericColumn);
  const chartRows = rows.slice(0, 12).map((row, index) => ({
    label: String(row[labelColumn] ?? index + 1),
    value: Number(row[numericColumn]) || 0,
  }));
  const maximum = Math.max(...chartRows.map((row) => Math.abs(row.value)), 1);

  return (
    <div className="border-b border-slate-200 px-4 py-4">
      <p className="mb-3 text-xs font-semibold uppercase text-slate-500">{numericColumn.replaceAll("_", " ")} · first {chartRows.length} results</p>
      <div className="flex h-32 items-end gap-2 overflow-x-auto pb-5" role="img" aria-label={`Bar chart of ${numericColumn} by ${labelColumn}`}>
        {chartRows.map((row, index) => <div key={`${row.label}-${index}`} title={`${row.label}: ${row.value}`} className="relative min-w-6 flex-1 bg-[#95298E]" style={{ height: `${Math.max((Math.abs(row.value) / maximum) * 100, 3)}%` }}><span className="absolute top-full mt-1 block max-w-16 truncate text-[10px] text-slate-500">{row.label}</span></div>)}
      </div>
    </div>
  );
}