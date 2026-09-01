import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import GoogleProvider from "@/components/GoogleProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-primary",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AskDocs — Team Knowledge Base",
  description:
    "Upload team documents and ask questions with AI-powered cited answers.",
  icons: {
    icon: [
      { url: "/logo-day.svg", media: "(prefers-color-scheme: light)" },
      { url: "/logo-night.svg", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/logo-night.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <GoogleProvider>
          <AuthProvider>{children}</AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}

