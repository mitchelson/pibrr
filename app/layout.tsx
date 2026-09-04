import type React from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, Sora } from "next/font/google";
import "./globals.css";
import "@/styles/app-v2-ds.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import AuthSessionProvider from "@/components/session-provider";
import { NavPendingProvider } from "@/components/app-v2/nav-pending";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Primeira Igreja Batista de Roraima",
  description: "Primeira Igreja Batista de Roraima — Boa Vista, RR",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PIB Roraima",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${sora.variable} ${fraunces.variable} ${sora.className} font-sans`}>
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NavPendingProvider>
              <main>{children}</main>
            </NavPendingProvider>
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
