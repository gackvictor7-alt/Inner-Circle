import { PORTFOLIO_ALLOCATION } from "@/lib/demo";

/**
 * Public investment allocation figure (site).
 *
 * One compact SVG donut that visualises the STRATEGIC TARGET ALLOCATION in
 * relation to 100 % of platform revenue – the same numbers as
 * `PORTFOLIO_ALLOCATION` (20 % budget → 25 % network / 75 % external,
 * i.e. 5 % / 15 % of total revenue). Pure structure: no amounts, no
 * holdings, no returns. The caller labels it as "Geplante Struktur".
 *
 * Server-renderable (no client state, no chart library) so the statically
 * pre-rendered public pages stay static.
 */

const RADIUS = 64;
const STROKE = 22;
const SIZE = 176;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function segment(percent: number) {
  return (percent / 100) * CIRCUMFERENCE;
}

export function AllocationDonut({
  labelNetwork,
  labelExternal,
  labelRest,
  centerTop,
  centerBottom,
}: {
  labelNetwork: string;
  labelExternal: string;
  labelRest: string;
  /** Centre of the ring – the honest state, never a sum or a holding. */
  centerTop: string;
  centerBottom: string;
}) {
  const { networkSharePercentOfRevenue, externalSharePercentOfRevenue } = PORTFOLIO_ALLOCATION;
  const restPercent = 100 - networkSharePercentOfRevenue - externalSharePercentOfRevenue;

  const segments = [
    { percent: networkSharePercentOfRevenue, className: "stroke-electric-500", dot: "bg-electric-500", label: labelNetwork },
    { percent: externalSharePercentOfRevenue, className: "stroke-forest-500", dot: "bg-forest-500", label: labelExternal },
    { percent: restPercent, className: "stroke-surface-muted", dot: "bg-surface-muted ring-1 ring-border", label: labelRest },
  ];

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-10">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label={`${labelNetwork} ${networkSharePercentOfRevenue} % · ${labelExternal} ${externalSharePercentOfRevenue} % · ${labelRest} ${restPercent} %`}
        className="block max-w-full shrink-0"
      >
        {segments.map((seg) => {
          const dash = segment(seg.percent);
          const el = (
            <circle
              key={seg.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              className={seg.className}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text
          x={SIZE / 2}
          y={SIZE / 2 - 5}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          {centerTop}
        </text>
        <text
          x={SIZE / 2}
          y={SIZE / 2 + 13}
          textAnchor="middle"
          className="fill-foreground-subtle"
          style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em" }}
        >
          {centerBottom.toUpperCase()}
        </text>
      </svg>

      <ul className="w-full min-w-0 space-y-3">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-baseline gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
            <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 translate-y-[-1px] rounded-sm ${seg.dot}`} />
            <span className="min-w-0 flex-1 text-sm leading-6 text-foreground-muted">{seg.label}</span>
            <span className="shrink-0 text-sm font-bold tabular-nums tracking-tight">{seg.percent} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
