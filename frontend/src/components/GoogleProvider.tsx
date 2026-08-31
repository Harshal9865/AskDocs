"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const DEFAULT_CLIENT_ID = "544083718174-gbhrgj904413l9dt83n236p1301udl08.apps.googleusercontent.com";

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
