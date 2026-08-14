import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://consolehired.dev"),
  title: {
    default: "console.hired() — AI Resume Matcher & Interview Coach",
    template: "%s | console.hired()",
  },
  description:
    "See what recruiters see before they do. Deterministic semantic evidence scoring, ATS diagnostics, and real-time AI mock interviews.",
  keywords: [
    "resume matcher",
    "ATS checker",
    "AI mock interview",
    "technical interview prep",
    "STAR method interview",
    "developer hiring",
    "resume optimizer",
    "semantic evidence mapping",
  ],
  authors: [{ name: "console.hired team" }],
  creator: "console.hired",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "console.hired()",
    title: "console.hired() — AI Resume Matcher & Technical Interview Coach",
    description:
      "See what recruiters see before they do. Deterministic semantic evidence scoring, ATS diagnostics, and real-time AI mock interviews.",
  },
  twitter: {
    card: "summary_large_image",
    title: "console.hired() — AI Resume Matcher & Technical Interview Coach",
    description:
      "See what recruiters see before they do. Deterministic semantic evidence scoring, ATS diagnostics, and real-time AI mock interviews.",
    creator: "@consolehired",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
