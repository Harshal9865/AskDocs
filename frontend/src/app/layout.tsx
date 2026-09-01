import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import GoogleProvider from "@/components/GoogleProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const inter = Inter({
  variable: "--font-sans-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display-primary",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${inter.className} ${plusJakartaSans.variable}`}>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} ${inter.className} font-sans antialiased`}
      >
        <GoogleProvider>
          <AuthProvider>{children}</AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
