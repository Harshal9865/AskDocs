"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(password)) {
      setError("Password must have at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(email.trim().toLowerCase(), password, name.trim());
      const me = await import("@/lib/api").then(m => m.api.me());
      router.replace(`/profile/${me.id}?edit=true`);
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold">Create account</h1>
        <p className="mb-6 text-sm text-slate-600">
          Start your team knowledge base
        </p>

        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Ada Lovelace"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="you@team.com"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <div className="mb-1">
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <p className="mb-3 text-xs text-slate-500">Minimum 8 characters.</p>

        <label className="mb-1 block text-sm font-medium" htmlFor="confirm">
          Confirm password
        </label>
        <div className="mb-4">
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            ariaLabel="Password confirmation"
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {busy ? "Creating\u2026" : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-indigo-700 underline hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

