"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCopy, FiPlus, FiRefreshCw, FiUserCheck, FiUserX } from "react-icons/fi";

import WorkspaceShell from "../../components/WorkspaceShell";
import TablePagination from "../../components/TablePagination";
import { apiRequest } from "../../lib/api";

const roles = ["admin", "manager", "analyst", "operator", "viewer"];
const blankUser = { full_name: "", email: "", role: "viewer" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [form, setForm] = useState(blankUser);
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState(blankUser);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const result = await apiRequest(`/api/users?offset=${page * pageSize}&limit=${pageSize}`);
      setUsers(result.users);
      setTotal(result.total);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [page]);

  useEffect(() => {
    let active = true;
    apiRequest(`/api/users?offset=${page * pageSize}&limit=${pageSize}`)
      .then((result) => {
        if (!active) return;
        setUsers(result.users);
        setTotal(result.total);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, [page, pageSize]);

  const createUser = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setTemporaryPassword(result.temporary_password);
      setNotice(`Created ${result.user.email}. Share the temporary password securely.`);
      setForm(blankUser);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const saveUser = async (userId) => {
    setError("");
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      setEditingId(null);
      setNotice("User details updated.");
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateStatus = async (user) => {
    const action = user.status === "active" ? "suspend" : "activate";
    setError("");
    try {
      await apiRequest(`/api/users/${user.id}/${action}`, { method: "POST" });
      setNotice(`${user.email} ${action === "activate" ? "activated" : "suspended"}.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const resetPassword = async (user) => {
    setError("");
    try {
      const result = await apiRequest(`/api/users/${user.id}/reset-password`, { method: "POST" });
      setTemporaryPassword(result.temporary_password);
      setNotice(`Temporary password created for ${user.email}. It is shown once below.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <WorkspaceShell>
      <main className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-8">
        <div className="border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold uppercase text-[#95298E]">Access administration</p>
          <h1 className="mt-1 text-2xl font-bold">Users and roles</h1>
          <p className="mt-2 text-sm text-slate-600">Public registrations remain pending until activated. New admin-created users receive a temporary password and must change it at sign-in.</p>
        </div>

        {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-4 border border-purple-200 bg-purple-50 p-3 text-sm text-[#95298E]">{notice}</p>}
        {temporaryPassword && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border border-amber-300 bg-amber-50 p-4">
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-amber-950">Temporary password · copy and share securely</p><code className="mt-1 block break-all text-sm">{temporaryPassword}</code></div>
            <button onClick={() => navigator.clipboard.writeText(temporaryPassword)} className="flex items-center gap-2 rounded-md border border-amber-400 px-3 py-2 text-sm"><FiCopy /> Copy</button>
            <button onClick={() => setTemporaryPassword("")} className="rounded-md px-3 py-2 text-sm text-slate-600">Dismiss</button>
          </div>
        )}

        <form onSubmit={createUser} className="my-6 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_auto]">
          <label className="text-xs font-medium text-slate-600">Full name<input required minLength={2} maxLength={160} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-600">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-600">Initial role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
          <button disabled={busy} className="flex items-center justify-center gap-2 self-end rounded-md bg-[#95298E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FiPlus /> Add user</button>
        </form>

        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    {editingId === user.id ? <div className="flex gap-2"><input value={editing.full_name} onChange={(event) => setEditing({ ...editing, full_name: event.target.value })} className="w-40 rounded border px-2 py-1" aria-label="Full name" /><input value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} className="w-48 rounded border px-2 py-1" aria-label="Email" /></div> : <><span className="block font-medium">{user.full_name}</span><span className="text-xs text-slate-500">{user.email}</span></>}
                  </td>
                  <td className="px-4 py-3">{editingId === user.id ? <select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value })} className="rounded border px-2 py-1">{roles.map((role) => <option key={role}>{role}</option>)}</select> : <span className="capitalize">{user.role}</span>}</td>
                  <td className="px-4 py-3"><span className="rounded-sm bg-slate-100 px-2 py-1 text-xs capitalize">{user.status}</span>{user.must_change_password && <span className="ml-2 text-xs text-amber-800">password change required</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-semibold">
                    {editingId === user.id ? <><button onClick={() => saveUser(user.id)} className="text-[#95298E]">Save</button><button onClick={() => setEditingId(null)} className="text-slate-500">Cancel</button></> : <button onClick={() => { setEditingId(user.id); setEditing({ full_name: user.full_name, email: user.email, role: user.role }); }} className="text-[#95298E]">Edit</button>}
                    <button onClick={() => updateStatus(user)} className="flex items-center gap-1 text-slate-700">{user.status === "active" ? <FiUserX /> : <FiUserCheck />}{user.status === "active" ? "Suspend" : "Activate"}</button>
                    <button onClick={() => resetPassword(user)} className="flex items-center gap-1 text-slate-700"><FiRefreshCw /> Reset password</button>
                  </div></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No users found.</td></tr>}
            </tbody>
          </table>
          <TablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </main>
    </WorkspaceShell>
  );
}