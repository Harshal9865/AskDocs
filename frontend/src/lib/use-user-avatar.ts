"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
    let cancelled = false;
    let objectUrl: string | null = null;
    api
      .getUserAvatarUrl(userId)
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, avatarKind, avatarValue]);

  const stickerId = avatarKind === "sticker" ? avatarValue ?? null : null;
  return { src, stickerId };
}
