"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, RotateCcw, Building2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";

const AVATARS = [
  { id: "male-1", name: "Ginger Curls", tag: "Yellow BG", color: "from-amber-400 to-yellow-500" },
  { id: "male-2", name: "Classic Cool", tag: "Yellow BG", color: "from-yellow-500 to-amber-600" },
  { id: "female-1", name: "Lavender Bob", tag: "Day Theme", color: "from-indigo-400 to-purple-500" },
  { id: "female-2", name: "Modern Teal", tag: "Day Theme", color: "from-sky-400 to-teal-500" },
  { id: "ai-1", name: "Violet Night", tag: "Dark Theme", color: "from-violet-600 to-indigo-900" },
];

export default function WorkspaceSettingsPage() {
  const { workspace, refresh } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(workspace?.name ?? "");
  const [isPublic, setIsPublic] = useState(workspace?.is_public ?? false);
  const [visMsg, setVisMsg] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // brand logo state
  const brandRef = useRef<HTMLInputElement>(null);
  const [brandBusy, setBrandBusy] = useState(false);
  const [brandMsg, setBrandMsg] = useState<string | null>(null);
  const [brandSrcLocal, setBrandSrcLocal] = useState<string | null>(null);
  const [brandStickerLocal, setBrandStickerLocal] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!workspace || !user) return;
    api.listMembers(workspace.id).then((members) => {
      const me = members.find((m) => m.user_id === user.id);
      setIsAdmin(me?.role === "admin");
    }).catch(() => {});
  }, [workspace, user]);

  useEffect(() => {
    setName(workspace?.name ?? "");
    setIsPublic(workspace?.is_public ?? false);

    // load brand logo
    if (workspace?.brand_kind === "upload") {
      api.getBrandLogoUrl(workspace.id).then((url) => {
        setBrandSrcLocal(url);
        setBrandStickerLocal(null);
      }).catch(() => {
        setBrandSrcLocal(null);
      });
    } else if (workspace?.brand_kind === "sticker" && workspace.brand_value) {
      setBrandStickerLocal(workspace.brand_value);
      setBrandSrcLocal(null);
    } else {
      setBrandSrcLocal(null);
      setBrandStickerLocal(null);
    }
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center text-sm font-medium text-slate-500 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-400">
        Create or select a workspace first.
      </div>
    );
  }

  const wsId = workspace.id;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!wsId || !name.trim() || !isAdmin) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.renameWorkspace(wsId, name.trim());
      await refresh();
      setMsg("Workspace renamed successfully.");
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic() {
    if (!wsId || !isAdmin) return;
    const next = !isPublic;
    setVisMsg(null);
    try {
      await api.setWorkspaceVisibility(wsId, next);
      setIsPublic(next);
      await refresh();
      setVisMsg(next ? "Workspace is now discoverable." : "Workspace is now private.");
    } catch (err) {
      setVisMsg((err as Error).message);
    }
  }

  async function applyBrand(kind: "default" | "sticker", value?: string) {
    if (!wsId || !isAdmin) return;
    setBrandBusy(true);
    setBrandMsg(null);
    try {
      await api.setBrand(wsId, kind, value);
      await refresh();
      if (kind === "default") {
        setBrandSrcLocal(null);
        setBrandStickerLocal(null);
        setBrandMsg("Reset to workspace initials.");
      } else {
        setBrandSrcLocal(null);
        setBrandStickerLocal(value ?? null);
        setBrandMsg("Workspace avatar updated.");
      }
    } catch (err) {
      setBrandMsg((err as Error).message);
    } finally {
      setBrandBusy(false);
    }
  }

  async function onBrandPhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !wsId || !isAdmin) return;
    setBrandBusy(true);
    setBrandMsg(null);
    try {
      await api.uploadBrandPhoto(wsId, file);
      const url = await api.getBrandLogoUrl(wsId);
      setBrandSrcLocal(url);
      setBrandStickerLocal(null);
      await refresh();
      setBrandMsg("Brand logo uploaded successfully.");
    } catch (err) {
      setBrandMsg((err as Error).message);
    } finally {
      setBrandBusy(false);
      if (brandRef.current) brandRef.current.value = "";
    }
  }

  async function deleteWs() {
    if (!workspace || !wsId || !isAdmin) return;
    if (!confirm(`Delete "${workspace.name}" and ALL its documents/chats? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteWorkspace(wsId);
      localStorage.removeItem("askdocs_workspace");
      await refresh();
      router.replace("/dashboard");
    } catch (err) {
      alert((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
          Workspace Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
          Configuration, custom branding, and security preferences for &ldquo;{workspace.name}&rdquo;.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs sm:text-sm font-medium text-amber-800 backdrop-blur-sm dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200">
          You are a <span className="font-bold">{workspace.role}</span> in this workspace. Only workspace admins can modify branding and settings.
        </div>
      )}

      {/* Workspace Brand Logo & Icon Customization Card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Workspace Brand Logo & Avatar
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Customize the logo or 3D icon displayed across your workspace.
            </p>
          </div>
        </div>

        {/* Brand Preview & Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="relative">
            <Avatar
              name={workspace.name}
              size={64}
              src={brandSrcLocal}
              stickerId={brandStickerLocal}
            />
            {isAdmin && (
              <button
                type="button"
                onClick={() => brandRef.current?.click()}
                disabled={brandBusy}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                title="Upload custom logo photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {workspace.name}
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              {brandSrcLocal
                ? "Custom logo uploaded"
                : brandStickerLocal
                ? `Active avatar: ${brandStickerLocal}`
                : "Using workspace initial badge"}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <input
                ref={brandRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onBrandPhotoChosen(e)}
              />
              <button
                type="button"
                onClick={() => brandRef.current?.click()}
                disabled={brandBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <ImagePlus className="h-3.5 w-3.5" /> Upload Logo
              </button>
              {(brandSrcLocal || brandStickerLocal) && (
                <button
                  type="button"
                  onClick={() => void applyBrand("default")}
                  disabled={brandBusy}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:text-red-400 transition-all disabled:opacity-50"
                  title="Reset to workspace initials"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3D Avatars / Sticker Picker for Workspace */}
        {isAdmin && (
          <div>
            <span className="block mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Or Choose 3D Character Avatar
            </span>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((a) => {
                const selected = brandStickerLocal === a.id && !brandSrcLocal;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => void applyBrand("sticker", a.id)}
                    disabled={brandBusy}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all ${
                      selected
                        ? "border-purple-600 bg-purple-50/80 shadow-md shadow-purple-500/10 ring-2 ring-purple-600 dark:border-purple-400 dark:bg-purple-950/40"
                        : "border-slate-200/80 bg-slate-50/60 hover:-translate-y-0.5 hover:border-purple-300 dark:border-white/10 dark:bg-[#181628]/60 dark:hover:border-purple-500/30"
                    }`}
                  >
                    <Avatar name={a.name} size={40} stickerId={a.id} />
                    <span className="truncate text-[10px] font-bold text-slate-700 dark:text-zinc-300 max-w-full">
                      {a.name}
                    </span>
                    {selected && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white shadow-xs">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {brandMsg && (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {brandMsg}
          </p>
        )}
      </section>

      {/* General Settings Card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90 sm:p-6">
        <form onSubmit={save} className="space-y-3.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300" htmlFor="ws-name">
            Workspace Name
          </label>
          <input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={!isAdmin}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 dark:border-white/10 dark:bg-[#181628] dark:text-white"
          />
          {msg && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {msg}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !name.trim() || !isAdmin}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Discoverability Card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Public Discoverability
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Allow others on AskDocs to find and request to join this workspace in Discover.
            </p>
          </div>
          <button
            onClick={() => void togglePublic()}
            disabled={!isAdmin}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none disabled:opacity-50 ${
              isPublic ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs shadow-emerald-500/30" : "bg-slate-200 dark:bg-white/10"
            }`}
            aria-pressed={isPublic}
            aria-label="Toggle discoverability"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {visMsg && (
          <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {visMsg}
          </p>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-3xl border border-red-200/80 bg-red-50/50 p-5 backdrop-blur-md dark:border-red-900/30 dark:bg-red-950/20 sm:p-6">
        <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="mt-1 text-xs text-red-600/90 dark:text-red-300/80">
          Deleting this workspace permanently removes all documents, AI chat history, office messages, and memberships. This action cannot be undone.
        </p>
        <button
          onClick={() => void deleteWs()}
          disabled={busy || !isAdmin}
          className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-700 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          Delete Workspace
        </button>
      </section>
    </div>
  );
}
