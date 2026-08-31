"use client";

import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const DEFAULT_CLIENT_ID = "544083718174-gbhrgj904413l9dt83n236p1301udl08.apps.googleusercontent.com";

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

  useEffect(() => {
    // Suppress benign Google Identity Services internal COOP polling warnings in console
    const filterCoop = (originalFn: (...args: unknown[]) => void) => {
      return (...args: unknown[]) => {
        const text = args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a) || ""))
          .join(" ");
        if (text.includes("Cross-Origin-Opener-Policy") || text.includes("window.closed")) {
          return;
        }
        originalFn(...args);
      };
    };

    const origWarn = console.warn;
    const origError = console.error;
    const origLog = console.log;

    console.warn = filterCoop(origWarn);
    console.error = filterCoop(origError);
    console.log = filterCoop(origLog);

    return () => {
      console.warn = origWarn;
      console.error = origError;
      console.log = origLog;
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
