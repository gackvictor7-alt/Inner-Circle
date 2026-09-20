import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontSans } from "./fonts";
import { ThemeInitScript, ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n/context";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Toaster } from "@/components/ui/Toaster";
import { SkipLink } from "@/components/site/SkipLink";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://inner-circle.example"),
  title: {
    default: dictionaries.de.meta.title,
    template: "%s | INNER CIRCLE",
  },
  description: dictionaries.de.meta.description,
  openGraph: {
    title: dictionaries.de.meta.title,
    description: dictionaries.de.meta.description,
    siteName: "INNER CIRCLE",
    type: "website",
    images: [{ url: "/images/hero.jpg", width: 1344, height: 768 }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f16" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={fontSans.variable}>
      <head>
        <ThemeInitScript />
      </head>
      <body className="flex min-h-full min-h-svh flex-col antialiased">
        <ThemeProvider>
          <I18nProvider>
            <SkipLink />
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
