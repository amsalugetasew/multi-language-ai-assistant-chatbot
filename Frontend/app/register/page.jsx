"use client";

import { useState } from "react";
import Link from "next/link";

import { registerUser } from "../../lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await registerUser(form);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md border border-slate-200 bg-white p-8">
          <p className="text-xs font-semibold uppercase text-emerald-800">Access request</p>
          <h1 className="mt-2 text-2xl font-bold">Registration received</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">An administrator must activate your account before you can sign in.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Return to sign in</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 border border-slate-200 bg-white p-7">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-800">Ledgerline access</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Request an account</h1>
          <p className="mt-2 text-sm text-slate-600">New accounts stay pending until an administrator activates them.</p>
        </div>
        <label className="block text-sm font-medium">Full name
          <input required minLength={2} maxLength={160} value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium">Email
          <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium">Password
          <input required type="password" minLength={12} maxLength={128} value={form.password} onChange={(event) => update("password", event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" />
          <span className="mt-1 block text-xs text-slate-500">Use at least 12 characters.</span>
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={isSubmitting} className="w-full rounded-md bg-emerald-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Submitting..." : "Request access"}</button>
        <p className="text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-emerald-800">Sign in</Link></p>
      </form>
    </main>
  );
}