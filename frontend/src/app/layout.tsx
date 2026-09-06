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

const pwaManifestData = JSON.stringify({
  id: "/",
  name: "AskDocs — Team Knowledge & Document Intelligence",
  short_name: "AskDocs",
  description: "Upload team documents and ask questions with AI-powered cited answers.",
  start_url: "/",
  display: "standalone",
  background_color: "#0d0c17",
  theme_color: "#0d0c17",
  orientation: "portrait-primary",
  scope: "/",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-512-maskable.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  screenshots: [
    {
      src: "/screenshot1.png",
      sizes: "1280x720",
      type: "image/png",
      form_factor: "wide",
      label: "AskDocs Dashboard",
    },
    {
      src: "/screenshot2.png",
      sizes: "750x1334",
      type: "image/png",
      form_factor: "narrow",
      label: "AskDocs Mobile App",
    },
  ],
  prefer_related_applications: false,
  related_applications: [],
  categories: ["productivity", "utilities", "education"],
});

const pwaManifestDataUri = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(pwaManifestData)}`;

export const metadata: Metadata = {
  title: "AskDocs — Team Knowledge Base",
  description:
    "Upload team documents and ask questions with AI-powered cited answers.",
  manifest: pwaManifestDataUri,
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
      <head>
        <link rel="manifest" href={pwaManifestDataUri} />
        <meta name="theme-color" content="#0d0c17" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
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
