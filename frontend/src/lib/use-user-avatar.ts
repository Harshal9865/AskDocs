"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Module-level cache to prevent repeated 404 fetches that flood console
const failedAvatarIds = new Set<string>();
const avatarCache = new Map<string, string>(); // userId -> objectUrl

/**
 * Resolves another user's avatar display info.
 * Returns { src, stickerId } — src is an object URL for uploads,
 * stickerId for stickers, both null for initials fallback.
 */
export function useUserAvatar(
  userId: string | undefined,
  avatarKind: string | undefined | null,
  avatarValue: string | null | undefined,
) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (avatarKind !== "upload" || !avatarValue || !userId) {
      setSrc(null);
      return;
    }
    // Serve from cache if we already fetched this user
    if (avatarCache.has(userId)) {
      setSrc(avatarCache.get(userId) ?? null);
      return;
    }
    if (failedAvatarIds.has(userId)) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    api
      .getUserAvatarUrl(userId)
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          avatarCache.set(userId, objectUrl);
          setSrc(objectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          failedAvatarIds.add(userId);
          setSrc(null);
        }
      });
    return () => {
      cancelled = true;
      // Don't revoke cached URLs on unmount — keep them for reuse
      // Only revoke the temporary one if it wasn't cached
      if (objectUrl && !avatarCache.has(userId)) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, avatarKind, avatarValue]);

  const stickerId = avatarKind === "sticker" ? avatarValue ?? null : null;
  return { src, stickerId };
}
