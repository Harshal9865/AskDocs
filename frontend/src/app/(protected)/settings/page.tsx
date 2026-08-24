"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import PasswordInput from "@/components/PasswordInput";
import Avatar from "@/components/Avatar";
import type { User } from "@/lib/types";

const STICKER_IDS = [
  "male-1", "male-2", "male-3", "male-4",
  "female-1", "female-2", "female-3", "female-4",
  "cute-1", "cute-2", "cute-3", "cute-4",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, avatarSrc, refreshUser } = useAuth();
  const { workspace, refresh: refreshWs } = useWorkspace();

  // profile name
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  // password
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // avatar
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);

  // brand
  const brandRef = useRef<HTMLInputElement>(null);
  const [brandBusy, setBrandBusy] = useState(false);
  const [brandMsg, setBrandMsg] = useState<string | null>(null);
  const [brandSrcLocal, setBrandSrcLocal] = useState<string | null>(null);
  const [brandStickerLocal, setBrandStickerLocal] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameBusy(true);
    setNameMsg(null);
    try {
      await api.updateMe(name.trim());
      await refreshUser();
      setNameMsg("Name updated.");
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

  async function pickSticker(id: string) {
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      await api.setAvatar("sticker", id);
      await refreshUser();
      setAvatarMsg("Sticker saved.");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function resetToInitials() {
    setAvatarBusy(true);
    try {
      await api.setAvatar("initials");
      await refreshUser();
      setAvatarMsg("Reset to initials.");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onPhotoChosen(file?: File | null) {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      await api.uploadAvatarPhoto(file);
      await refreshUser();
      setAvatarMsg("Photo uploaded.");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function applyBrand(kind: "default" | "sticker", value?: string) {
    if (!workspace) return;
    setBrandBusy(true);
    setBrandMsg(null);
    try {
      await api.setBrand(workspace.id, kind, value);
      setBrandStickerLocal(kind === "sticker" ? value ?? null : null);
      setBrandSrcLocal(null);
      await refreshWs();
      setBrandMsg("Brand updated.");
    } catch (err) {
      setBrandMsg((err as Error).message);
    } finally {
      setBrandBusy(false);
    }
  }

  async function onBrandPhotoChosen(file?: File | null) {
    if (!workspace || !file) return;
    setBrandBusy(true);
    setBrandMsg(null);
    try {
      await api.uploadBrandPhoto(workspace.id, file);
      setBrandStickerLocal(null);
      try {
        setBrandSrcLocal(await api.getBrandLogoUrl(workspace.id));
      } catch {
        setBrandSrcLocal(null);
      }
      await refreshWs();
      setBrandMsg("Logo uploaded.");
    } catch (err) {
      setBrandMsg((err as Error).message);
    } finally {
      setBrandBusy(false);
    }
  }

  const previewSticker =
    user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">Account settings</h1>
      <p className="mb-6 text-sm text-slate-500">
        Personalize your profile, photo and security.
      </p>

      {/* ---------- Profile photo ---------- */}
      <Section title="Profile photo">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              name={user?.name ?? "?"}
              size={72}
              src={avatarSrc}
              stickerId={previewSticker}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label="Upload photo"
              title="Upload custom photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              hidden
              onChange={(e) => void onPhotoChosen(e.target.files?.[0])}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            {avatarMsg && (
              <p className="mt-1 text-xs font-medium text-indigo-600">{avatarMsg}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ImagePlus className="h-3.5 w-3.5" /> Upload photo
              </button>
              <button
                onClick={() => void resetToInitials()}
                disabled={avatarBusy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to initials
              </button>
            </div>
          </div>
        </div>

        {/* sticker gallery */}
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Or choose a sticker
          </p>
          <div className="flex flex-wrap gap-2">
            {STICKER_IDS.map((id) => {
              const selected = previewSticker === id;
              return (
                <button
                  key={id}
                  onClick={() => void pickSticker(id)}
                  disabled={avatarBusy}
                  aria-label={`Choose ${id} sticker`}
                  title={`Choose ${id}`}
                  className={`relative overflow-hidden rounded-full ring-offset-2 transition-all hover:scale-105 ${
                    selected ? "ring-2 ring-indigo-600" : "ring-1 ring-slate-200"
                  } ${avatarBusy ? "opacity-60" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/stickers/${id}.svg`} alt={id} className="h-12 w-12" />
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center bg-indigo-600/30">
                      <Check className="h-5 w-5 rounded-full bg-white p-0.5 text-indigo-700" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ---------- Display name ---------- */}
      <Section title="Display name">
        <form onSubmit={saveName} className="space-y-3">
          <input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {nameMsg && <p className="text-xs font-medium text-indigo-600">{nameMsg}</p>}
          <button
            type="submit"
            disabled={nameBusy || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {nameBusy ? "Saving…" : "Save name"}
          </button>
        </form>
      </Section>

      {/* ---------- Change password ---------- */}
      <Section title="Change password">
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="cur">
              Current password
            </label>
            <PasswordInput id="cur" value={current} onChange={setCurrent} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="new1">
              New password
            </label>
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
            <label className="mb-1 block text-sm font-medium" htmlFor="new2">
              Confirm new password
            </label>
            <PasswordInput
              id="new2"
              value={confirmPw}
              onChange={setConfirmPw}
              autoComplete="new-password"
              ariaLabel="Password confirmation"
            />
          </div>
          {pwError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {pwError}
            </p>
          )}
          {pwMsg && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {pwMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={pwBusy || !current || next.length < 8}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {pwBusy ? "Changing…" : "Change password"}
          </button>
        </form>
      </Section>

      {/* ---------- Workspace brand logo (admin) ---------- */}
      {workspace && (
        <Section title={`Brand logo — ${workspace.name}`}>
          <p className="mb-4 text-xs text-slate-500">
            Shown in the top navbar for everyone in this workspace. Admins only.
          </p>
          <div className="flex items-center gap-5">
            <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {brandSrcLocal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandSrcLocal} alt="Brand" className="h-full w-full object-cover" />
              ) : brandStickerLocal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/stickers/${brandStickerLocal}.svg`} alt="Brand" className="h-full w-full" />
              ) : workspace.brand_kind === "sticker" && workspace.brand_value ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/stickers/${workspace.brand_value}.svg`} alt="Brand" className="h-full w-full" />
              ) : (
                <span className="text-2xl font-black text-slate-300">A</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={brandRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                hidden
                onChange={(e) => void onBrandPhotoChosen(e.target.files?.[0])}
              />
              <button
                onClick={() => brandRef.current?.click()}
                disabled={brandBusy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ImagePlus className="h-3.5 w-3.5" /> Upload logo
              </button>
              <div className="flex flex-wrap gap-1.5">
                {["male-1", "female-1", "cute-1"].map((id) => (
                  <button
                    key={id}
                    onClick={() => void applyBrand("sticker", id)}
                    disabled={brandBusy}
                    aria-label={`Use ${id} sticker as logo`}
                    className="overflow-hidden rounded-md ring-1 ring-slate-200 transition-all hover:scale-105 hover:ring-indigo-400 disabled:opacity-60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/stickers/${id}.svg`} alt={id} className="h-9 w-9" />
                  </button>
                ))}
                <button
                  onClick={() => void applyBrand("default")}
                  disabled={brandBusy}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white ring-1 ring-slate-200 transition-all hover:scale-105 disabled:opacity-60"
                  aria-label="Use default A logo"
                  title="Default A"
                >
                  A
                </button>
              </div>
            </div>
          </div>
          {brandMsg && <p className="mt-3 text-xs font-medium text-indigo-600">{brandMsg}</p>}
        </Section>
      )}
    </div>
  );
}
