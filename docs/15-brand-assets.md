# 15 – BRAND ASSETS (VENTURE & PARTNERS / INNER CIRCLE)

**Stand:** 2026-09-23 · Sprint V&P-1 (öffentliche Homepage + Header).
Verbindliche visuelle Grundlage sind die beiden vom Gründer freigegebenen
Referenzbilder (Markenboard + Website-/Plattform-Mockup, 2026-09-23). Die
Referenzbilder selbst liegen **nicht** im Repository (Raster, ChatGPT-Export).

## 1. Markenarchitektur

| Ebene | Name | Subline |
|-------|------|---------|
| Dachmarke | **VENTURE & PARTNERS** | Entrepreneurship · Network · Investments |
| Plattform | **INNER CIRCLE by VENTURE & PARTNERS** | People · Opportunities · Progress |

i18n: `t.brand.name`, `t.brand.tagline`, `t.brand.platformName`,
`t.brand.platformByline`; Homepage-Texte in `src/lib/i18n/dict/vp-home.ts`.

## 2. Farben (aus dem Markenboard)

| Token | Hex | Bedeutung (Board) |
|-------|-----|-------------------|
| `vp-navy-900` | `#111F3D` | Navy – Trust, Stability (Primärfarbe, Text, CTA) |
| `vp-navy-950` | `#0A1222` | dunkler Hintergrund (Footer, Dark Mode) |
| `vp-blue-500/600/300` | `#5C7E9E` / `#4A6A8A` / `#9DB4CB` | Blue – Clarity, Progress (Kicker) |
| `vp-green-600/700/300` | `#2D4A3E` / `#1F3A2F` / `#7FA68F` | Green – Growth, Opportunity (Logo-Keil, Akzente) |
| `vp-charcoal-900/700` | `#2B2F33` / `#4A4F55` | Charcoal – Discipline, Balance (Fließtext) |
| `vp-paper-50/100/200` | `#FAF9F6` / `#F3F1EB` / `#E6E2D8` | Off-White – Space, Possibility (Hintergrund) |
| `vp-ink-900` | `#171D27` | Textfarbe |

Die Tokens sind in `src/app/globals.css` **zusätzlich** zu den bestehenden
Scales (`midnight`, `electric`, …) definiert. Nur `.vp-home` (Homepage,
Header, Mobile-Menü) überschreibt `--background/--surface/--border` auf die
warmen Paper-Töne; alle anderen Routen bleiben unverändert.

## 3. Typografie

- **Editorial Serif:** Cormorant Garamond 500/600 (`src/app/fonts/
  CormorantGaramond-*.woff2`, SIL OFL 1.1 → `OFL-CormorantGaramond.txt`),
  CSS-Variable `--font-cormorant`, Utility `font-serif`. Verwendung: Wortmarke,
  Hero-Headline, Sektionsüberschriften der Homepage.
- **Fließtext/UI:** Inter (unverändert).
- **Monogramm:** Bodoni Moda 600 (Didone, hoher Strichkontrast – entspricht dem
  V/P des Boards), nur als Pfade in den SVGs eingebettet, keine Webfont.

## 4. Logo-Dateien (`public/brand/`)

Alle SVGs sind reine Pfade (keine Font-Abhängigkeit), skalierbar, je als
`-light` (Navy/Grün auf hellem Grund) und `-dark` (Paper/Hellgrün auf dunklem
Grund):

| Datei | Inhalt |
|-------|--------|
| `vp-monogram-{light,dark}.svg` | VP-Monogramm (V + P, grüner Keil) |
| `vp-lockup-horizontal-{light,dark}.svg` | Monogramm + Wortmarke + Subline nebeneinander (Header-Proportion) |
| `vp-lockup-stacked-{light,dark}.svg` | Monogramm über Wortmarke + Subline (Board-Proportion) |
| `ic-mark-{light,dark}.svg` | INNER-CIRCLE-Zeichen (geteilter Kreis Navy/Grün + Balken) |
| `ic-lockup-stacked-{light,dark}.svg` | IC-Zeichen + „INNER CIRCLE“ + „by VENTURE & PARTNERS“ |
| `favicon.svg` | Monogramm auf Paper, gerundet |

Generator: `scripts/brand/build-logo.py` (fonttools + brotli; erwartet die
@fontsource-Pakete `bodoni-moda` und `cormorant-garamond` entpackt unter
`/tmp/fonts`). Die Geometrie (P-Stem über dem V-Scheitel, Keil unter der
P-Schale, Arc-Winkel des IC-Zeichens) wurde gegen das Board von Hand
abgeglichen.

**Abweichungshinweis (ehrlich):** Das Board ist eine Rasterdatei ohne
Vektorquelle. Das Monogramm ist eine **Rekonstruktion** in einer OFL-Didone,
nicht die Originalzeichnung. Wortmarke und Subline sind live gesetzter Text
(Cormorant Garamond), damit sie in jeder Größe scharf bleiben. Sollte eine
Original-Vektordatei existieren, ersetzt sie die generierten SVGs 1:1
(gleiche Dateinamen).

## 5. Fotografie (`public/images/brand/`)

Bildkonzept laut Mockup: Berge/Horizont/Nebel/Wasser + dunkle Pflanzen. Keine
Holz-, Loft- oder generischen Business-Motive. Alle Dateien stammen von
Unsplash unter der **Unsplash License** (kostenlose kommerzielle Nutzung,
keine Namensnennung erforderlich – wird trotzdem im Footer genannt). Keine
Unsplash+-Bilder.

| Datei | Motiv | Urheber | Quelle |
|-------|-------|---------|--------|
| `hero-mountains.jpg` (2000×1125), `hero-mountains-portrait.jpg` (900×1200), `og-mountains.jpg` (1200×630) | Nebel über Bergsee mit Nadelwald | Sergey Pesterev | https://unsplash.com/photos/jWD3o-Ht8ZA |
| `alpine-lake.jpg` (1400×1000) | Türkiser Bergsee, Nadelwald, Schneegipfel | Adam Vradenburg | https://unsplash.com/photos/GA09PKfRIQY |
| `dark-leaves.jpg` (1000×1400) | Dunkelgrüne Blätter, Nahaufnahme | Nathana Rebouças | https://unsplash.com/photos/_LPEv2mZNbI |

Verarbeitung: sharp, `fit: cover`, JPEG mozjpeg q76–78, ≤ 200 KB pro Datei.

**Noch offen / nicht ersetzt:** Das Mockup zeigt zusätzlich ein
Konferenz-/Speaker-Foto bei „V&P Events“. Ein lizenzgeprüftes Motiv in der
gewünschten Qualität (hell, editorial, kein Stock-Look) lag nicht vor; die
Events-Kachel nutzt daher vorerst das Blätter-Motiv aus dem Mockup-Panel.
Die bisherigen Bilder in `public/images/*.jpg` bleiben für die Unterseiten
unverändert (Scope-Grenze Sprint V&P-1).

## 6. Screenshots der gerenderten Seite

`docs/screenshots/vp-home/` – Desktop 1440 (oben/vollständig/dunkel/DE),
Mobile 390 (oben/vollständig/dunkel/Menü). Erzeugt mit headless Chromium
gegen `next dev`. Kontrast-Audit (alle Textknoten, WCAG AA, hell+dunkel,
Desktop+Mobile): keine Verstöße.
