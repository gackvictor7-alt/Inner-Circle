import type { Metadata } from "next";
import "./globals.css";
import { ThemeInitScript, ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n/context";
import { dictionaries } from "@/lib/i18n/dictionaries";

// NOTE (STEP 01): system font stack on purpose – the final typography is
// selected in STEP 02 (design system). This also keeps the foundation
// buildable without access to external font CDNs.

export const metadata: Metadata = {
  title: dictionaries.de.meta.title,
  description: dictionaries.de.meta.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
