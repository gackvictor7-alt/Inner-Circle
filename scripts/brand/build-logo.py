"""
Generates the VENTURE & PARTNERS / INNER CIRCLE logo SVGs in public/brand/.

Reconstruction of the approved brand board (raster reference, 2026-09-23):
  * "VP" monogram: high-contrast Didone serif (V thick-left/thin-right, P with
    bowl), navy; a sage-green wedge fills the area between the V's right arm and
    the P stem below the bowl.
  * Wordmark "VENTURE & PARTNERS": classic serif, wide letter-spacing.
  * Subline "ENTREPRENEURSHIP · NETWORK · INVESTMENTS": small, wide tracked.
  * IC mark: circle split into a navy left arc and a green right arc with a
    vertical bar in the middle.

Glyph outlines come from Bodoni Moda (monogram) and Cormorant Garamond
(wordmark) – both SIL OFL 1.1 – and are converted to plain paths, so the SVGs
are self-contained and scalable. Requires: fonttools + brotli and the two
@fontsource packages unpacked in /tmp/fonts (see docs/15-brand-assets.md).
"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import os, re

NAVY = "#111F3D"; GREEN = "#2D4A3E"; PAPER = "#FAF9F6"; GREEN_DARK = "#7FA68F"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "brand")
os.makedirs(OUT, exist_ok=True)

BODONI = "/tmp/fonts/bm/package/files/bodoni-moda-latin-600-normal.woff2"
CORM = "/tmp/fonts/package/files/cormorant-garamond-latin-600-normal.woff2"
CORM_LIGHT = "/tmp/fonts/package/files/cormorant-garamond-latin-500-normal.woff2"

def load(path):
    ft = TTFont(path); return ft, ft.getGlyphSet(), ft.getBestCmap(), ft["head"].unitsPerEm

def glyph_path(gs, cmap, ch, scale, dx, dy):
    """SVG path for one glyph, y-flipped, scaled and translated."""
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    tp = TransformPen(pen, (scale, 0, 0, -scale, dx, dy))
    gs[cmap[ord(ch)]].draw(tp)
    return pen.getCommands()

def glyph_bounds(gs, cmap, ch):
    bp = BoundsPen(gs); gs[cmap[ord(ch)]].draw(bp); return bp.bounds

def text_paths(gs, cmap, upm, text, size, x, y, tracking_em, color):
    """Letter-spaced text as paths. Returns (svg, advance_width)."""
    scale = size / upm; parts = []; cx = x
    for ch in text:
        if ch == " ":
            cx += size * 0.34 + tracking_em * size; continue
        g = gs[cmap[ord(ch)]]
        parts.append(f'<path fill="{color}" d="{glyph_path(gs, cmap, ch, scale, cx, y)}"/>')
        cx += g.width * scale + tracking_em * size
    return "\n".join(parts), cx - x - tracking_em * size

# ---------------------------------------------------------------- monogram
def monogram(color_main, color_accent, size=100.0):
    ft, gs, cmap, upm = load(BODONI)
    cap = ft["OS/2"].sCapHeight  # 1500
    scale = size / cap           # cap height == size
    vb = glyph_bounds(gs, cmap, "V"); pb = glyph_bounds(gs, cmap, "P")
    v_w = (vb[2] - vb[0]) * scale
    p_w = (pb[2] - pb[0]) * scale
    base_y = size
    apex_x = v_w * 0.50
    # Measured on Bodoni Moda 600: the P stem spans 15%..37% of the glyph box,
    # the bowl ends at ~57% of the cap height.
    stem_w = p_w * 0.22
    stem_l = apex_x + v_w * 0.015            # stem stands just right of the V vertex
    p_x = stem_l - p_w * 0.15
    bowl_bottom = size * 0.575
    v_path = glyph_path(gs, cmap, "V", scale, -vb[0] * scale, base_y)
    p_path = glyph_path(gs, cmap, "P", scale, p_x - pb[0] * scale, base_y)
    # Below the bowl the navy stem is replaced by the sage wedge: straight
    # right edge, left edge tapering towards the V's vertex.
    stem_r = stem_l + stem_w
    # Wedge tapers to a point on the baseline (as on the brand board).
    wedge = (f"M{stem_l:.1f},{bowl_bottom:.1f} L{stem_r:.1f},{bowl_bottom:.1f} "
             f"L{stem_r - stem_w * 0.15:.1f},{size:.1f} L{stem_r - stem_w * 0.55:.1f},{size:.1f} Z")
    total_w = p_x + p_w
    cid = f"c{int(size)}{color_main.strip('#')}"
    body = (f'<defs><clipPath id="{cid}"><rect x="-1" y="-1" width="{total_w + 2:.1f}" height="{bowl_bottom + 1:.1f}"/></clipPath></defs>'
            f'<path fill="{color_main}" d="{v_path}"/>'
            f'<path fill="{color_main}" clip-path="url(#{cid})" d="{p_path}"/>'
            f'<path fill="{color_accent}" d="{wedge}"/>')
    return body, total_w, size

def write(name, svg):
    with open(os.path.join(OUT, name), "w") as f: f.write(svg)
    print("wrote", name)

def svg(w, h, body, extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="VENTURE &amp; PARTNERS"{extra}>\n{body}\n</svg>\n')

for variant, main, accent in (("light", NAVY, GREEN), ("dark", PAPER, GREEN_DARK)):
    body, w, h = monogram(main, accent)
    pad = 6
    write(f"vp-monogram-{variant}.svg",
          svg(w + 2 * pad, h + 2 * pad, f'<g transform="translate({pad},{pad})">{body}</g>'))

# ------------------------------------------------ full lockup (stacked)
ft2, gs2, cmap2, upm2 = load(CORM)
ft3, gs3, cmap3, upm3 = load(CORM_LIGHT)
for variant, main, accent in (("light", NAVY, GREEN), ("dark", PAPER, GREEN_DARK)):
    mono, mw, mh = monogram(main, accent, size=150)
    word, ww = text_paths(gs2, cmap2, upm2, "VENTURE & PARTNERS", 56, 0, 0, 0.22, main)
    sub, sw = text_paths(gs3, cmap3, upm3, "ENTREPRENEURSHIP  ·  NETWORK  ·  INVESTMENTS", 17, 0, 0, 0.30, main)
    W = max(ww, sw) + 80; H = 150 + 40 + 56 + 26 + 17 + 40
    body = (f'<g transform="translate({(W - mw) / 2:.1f},40)">{mono}</g>'
            f'<g transform="translate({(W - ww) / 2:.1f},{150 + 40 + 56 - 8:.1f})">{word}</g>'
            f'<g transform="translate({(W - sw) / 2:.1f},{150 + 40 + 56 + 26 + 12:.1f})">{sub}</g>')
    write(f"vp-lockup-stacked-{variant}.svg", svg(W, H, body))

# ------------------------------------------------ horizontal lockup (header)
for variant, main, accent in (("light", NAVY, GREEN), ("dark", PAPER, GREEN_DARK)):
    mono, mw, mh = monogram(main, accent, size=44)
    word, ww = text_paths(gs2, cmap2, upm2, "VENTURE & PARTNERS", 22, 0, 0, 0.20, main)
    sub, sw = text_paths(gs3, cmap3, upm3, "ENTREPRENEURSHIP · NETWORK · INVESTMENTS", 7.2, 0, 0, 0.28, main)
    gap = 16; W = mw + gap + max(ww, sw) + 4; H = 52
    body = (f'<g transform="translate(0,4)">{mono}</g>'
            f'<g transform="translate({mw + gap:.1f},27)">{word}</g>'
            f'<g transform="translate({mw + gap:.1f},42)">{sub}</g>')
    write(f"vp-lockup-horizontal-{variant}.svg", svg(W, H, body))

# ------------------------------------------------ INNER CIRCLE mark
def ic_mark(main, accent, s=100):
    import math
    r = s * 0.40; c = s / 2; sw_ = s * 0.062
    def pt(a): return (c + r * math.cos(math.radians(a)), c + r * math.sin(math.radians(a)))
    lx1, ly1 = pt(112); lx2, ly2 = pt(248)
    rx1, ry1 = pt(-68); rx2, ry2 = pt(68)
    return (f'<path d="M{lx1:.1f},{ly1:.1f} A{r:.1f},{r:.1f} 0 0 1 {lx2:.1f},{ly2:.1f}" fill="none" stroke="{main}" stroke-width="{sw_ * 1.25:.1f}"/>'
            f'<path d="M{rx1:.1f},{ry1:.1f} A{r:.1f},{r:.1f} 0 0 1 {rx2:.1f},{ry2:.1f}" fill="none" stroke="{accent}" stroke-width="{sw_:.1f}"/>'
            f'<rect x="{c - sw_ * 0.5:.1f}" y="{s * 0.10:.1f}" width="{sw_:.1f}" height="{s * 0.80:.1f}" fill="{main}"/>')

for variant, main, accent in (("light", NAVY, GREEN), ("dark", PAPER, GREEN_DARK)):
    write(f"ic-mark-{variant}.svg", svg(100, 100, ic_mark(main, accent)).replace("VENTURE &amp; PARTNERS", "INNER CIRCLE"))
    mark = ic_mark(main, accent, 120)
    word, ww = text_paths(gs2, cmap2, upm2, "INNER CIRCLE", 52, 0, 0, 0.20, main)
    by, bw = text_paths(gs3, cmap3, upm3, "by  VENTURE & PARTNERS", 18, 0, 0, 0.22, main)
    W = ww + 80; H = 120 + 30 + 52 + 20 + 18 + 30
    body = (f'<g transform="translate({(W - 120) / 2:.1f},20)">{mark}</g>'
            f'<g transform="translate({(W - ww) / 2:.1f},{120 + 30 + 52 - 6:.1f})">{word}</g>'
            f'<g transform="translate({(W - bw) / 2:.1f},{120 + 30 + 52 + 20 + 14:.1f})">{by}</g>')
    write(f"ic-lockup-stacked-{variant}.svg", svg(W, H, body).replace("VENTURE &amp; PARTNERS\"", "INNER CIRCLE by VENTURE &amp; PARTNERS\""))

# favicon: monogram on paper / navy
body, w, h = monogram(NAVY, GREEN, size=60)
write("favicon.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="{PAPER}"/><g transform="translate({(96 - w) / 2:.1f},18)">{body}</g></svg>\n')
