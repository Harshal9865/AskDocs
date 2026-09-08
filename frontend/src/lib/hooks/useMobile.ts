"use client";

import { useEffect, useState } from "react";

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export function useMobile() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const update = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isBelow = (bp: Breakpoint) => width > 0 && width < breakpoints[bp];
  const isAbove = (bp: Breakpoint) => width >= breakpoints[bp];

  return {
    width,
    height,
    isClient,
    isMobile: isBelow("md"),
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: isAbove("lg"),
    isBelow,
    isAbove,
    breakpoints,
  };
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return isClient ? matches : false;
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function usePrefersDark() {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

export function useTouch() {
  const [isTouch, setIsTouch] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsTouch(
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (window as unknown as { DocumentTouch?: { createTouch: () => void } }).DocumentTouch !== undefined
    );
  }, []);

  return isClient ? isTouch : false;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [iosModalOpen, setIosModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          ("standalone" in window.navigator &&
            (window.navigator as unknown as { standalone?: boolean }).standalone === true));
      setIsInstalled(!!isStandalone);
    };

    checkStandalone();

    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(iosDevice);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setIosModalOpen(true);
    }
  };

  return {
    canInstall: !isInstalled,
    isInstalled,
    isIOS,
    deferredPromptAvailable: !!deferredPrompt,
    iosModalOpen,
    setIosModalOpen,
    triggerInstall,
  };
}
