import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontSans, fontSerif } from "./fonts";
import { ThemeInitScript, ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n/context";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://inner-circle.example"),
  title: {
    default: dictionaries.de.meta.title,
    template: "%s | INNER CIRCLE by VENTURE & PARTNERS",
  },
  description: dictionaries.de.meta.description,
  openGraph: {
    title: dictionaries.de.meta.title,
    description: dictionaries.de.meta.description,
    siteName: "INNER CIRCLE by VENTURE & PARTNERS",
    type: "website",
    images: [{ url: "/images/brand/og-mountains.jpg", width: 1200, height: 630 }],
  },
  icons: { icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1222" },
  ],
};

/**
 * Root layout: providers only. The public website shell lives in (site) and
 * the member platform shell in (app)/app, so both can be composed freely.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={`${fontSans.variable} ${fontSerif.variable}`}>
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-svh antialiased">
        <ThemeProvider>
          <I18nProvider>
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
