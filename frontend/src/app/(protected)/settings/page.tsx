"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameBusy(true);
    setNameMsg(null);
    try {
      await api.updateMe(name.trim());
      setNameMsg("Name updated. Reload to see it everywhere.");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setNameMsg((err as Error).message);
    } finally {
      setNameBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwMsg(null);
    if (next !== confirmPw) {
      setPwError("New passwords do not match");
      return;
    }
    setPwBusy(true);
    try {
      await api.changePassword(current, next);
      setPwMsg("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirmPw("");
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-slate-500">Manage your account.</p>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Profile</h2>
        <div className="mb-4 text-sm text-slate-500">
          Email: <span className="font-medium text-slate-800">{user?.email}</span>
        </div>
        <form onSubmit={saveName} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {nameMsg && <p className="text-xs font-medium text-indigo-700">{nameMsg}</p>}
          <button
            type="submit"
            disabled={nameBusy || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {nameBusy ? "Saving…" : "Save name"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Change password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="cur">Current password</label>
            <PasswordInput id="cur" value={current} onChange={setCurrent} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="new1">New password</label>
            <PasswordInput
              id="new1"
              value={next}
              onChange={setNext}
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="new2">Confirm new password</label>
            <PasswordInput
              id="new2"
              value={confirmPw}
              onChange={setConfirmPw}
              autoComplete="new-password"
              ariaLabel="Password confirmation"
            />
          </div>
          {pwError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{pwError}</p>
          )}
          {pwMsg && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{pwMsg}</p>
          )}
          <button
            type="submit"
            disabled={pwBusy || !current || next.length < 8}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pwBusy ? "Changing…" : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}
