"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(email, password, name);
      router.replace("/chat");
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold">Create account</h1>
        <p className="mb-6 text-sm text-zinc-500">
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
          className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
          className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          placeholder="you@team.com"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          placeholder="min. 8 characters"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
