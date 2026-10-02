"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceShell from "../../components/WorkspaceShell";
import { changePassword } from "../../lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      setSaved(true);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <WorkspaceShell>
      <main className="mx-auto w-full max-w-lg px-5 py-10">
        <form onSubmit={handleSubmit} className="space-y-5 border border-slate-200 bg-white p-6">
          <div>
            <h1 className="text-xl font-bold">Change your password</h1>
            <p className="mt-1 text-sm text-slate-600">A new password is required before you continue.</p>
          </div>
          <label className="block text-sm font-medium">Current or temporary password
            <input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium">New password
            <input required type="password" minLength={12} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {saved && <p role="status" className="text-sm text-[#95298E]">Password changed.</p>}
          <button className="rounded-md bg-[#95298E] px-4 py-2.5 text-sm font-semibold text-white">Update password</button>
        </form>
      </main>
    </WorkspaceShell>
  );
}