/**
 * Minimal inline icon set (stroke-based, lucide-style).
 * All icons: 24×24 viewBox, currentColor, no external dependency.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number | undefined, props: IconProps) {
  const { size: s, ...rest } = { size: 20, ...props };
  void size;
  return {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

export function UsersIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 16l4-6 4 3 5-8" />
    </svg>
  );
}

export function StoreIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M2 7l2-4h16l2 4" />
      <path d="M2 7h20v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V7z" />
      <path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
      <path d="M9 21v-5h6v5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </svg>
  );
}

export function MonitorIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function StarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  const p = base(undefined, props);
  return (
    <svg {...p} fill={filled ? "currentColor" : "none"}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function HourglassIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22" />
      <path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2" />
    </svg>
  );
}

export function AwardIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M3 21c3-1.5 5-4.5 5-8V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" />
      <path d="M15 21c3-1.5 5-4.5 5-8V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

export function MessageIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
    </svg>
  );
}

export function FileIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export function UnlockIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

export function HandshakeIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M11 17l-1.5-1.5" />
      <path d="M4.5 8.5L8 5l4 3 4-3 3.5 3.5" />
      <path d="M2 10l3-3 5 5-2 2 3 3 2-2 2 2-3 3-8-8z" />
      <path d="M22 10l-3-3-2.5 2.5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function GraduationIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      <path d="M22 10v6" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  const p = base(undefined, props);
  return (
    <svg {...p}>
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2z" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  );
}
