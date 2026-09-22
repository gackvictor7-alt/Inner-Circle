import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontSans } from "./fonts";
import { ThemeInitScript, ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n/context";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://venture-partners.example"),
  title: {
    default: dictionaries.de.meta.title,
    template: "%s | VENTURE & PARTNERS",
  },
  description: dictionaries.de.meta.description,
  openGraph: {
    title: dictionaries.de.meta.title,
    description: dictionaries.de.meta.description,
    siteName: "VENTURE & PARTNERS",
    type: "website",
    images: [{ url: "/images/hero.jpg", width: 1344, height: 768 }],
  },
  icons: {
    icon: "/brand/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1222" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={fontSans.variable}>
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
