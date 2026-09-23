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

/**
 * VENTURE & PARTNERS editorial serif – Cormorant Garamond (SIL OFL 1.1, see
 * ./fonts/OFL-CormorantGaramond.txt). Self-hosted like Inter; two weights only
 * to keep the public homepage light.
 */
export const fontSerif = localFont({
  src: [
    { path: "./fonts/CormorantGaramond-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/CormorantGaramond-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});
