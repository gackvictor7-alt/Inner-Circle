import localFont from "next/font/local";

/**
 * STEP 02 typography: Inter (variable, with optical size axis) – self-hosted
 * via next/font/local. No external font CDN at build or runtime, no layout
 * shift thanks to size-adjusted fallbacks. Licensed under the SIL Open Font
 * License 1.1 (see ./OFL.txt).
 */
export const fontSans = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
});
