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

/* ---------- Sprint 2.0 additions (platform UI) ---------- */

type P = { size?: number; className?: string; strokeWidth?: number };

const px = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function PlusIcon({ size, className, strokeWidth = 1.8 }: P & { strokeWidth?: number }) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SendIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

export function HeartIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export function ArrowLeftIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function FilterIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  );
}

export function MoreIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  );
}

export function UserPlusIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

export function CheckCheckIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M18 6 7 17l-4-4M22 8l-7.5 7.5" />
    </svg>
  );
}

export function ExternalLinkIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </svg>
  );
}

export function ImageIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-4.5-4.5L7 21" />
    </svg>
  );
}

export function PencilIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TrashIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
    </svg>
  );
}

export function FlagIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M4 22V4M4 4h13l-1.5 4L17 12H4" />
    </svg>
  );
}

export function BanIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  );
}

export function BellIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function PhoneIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

export function MapPinIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function TrendingUpIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M21 7h-5v5" />
    </svg>
  );
}

export function LogOutIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function SettingsIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 3h.1a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 17 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 9v.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

export function ShareIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M12 16V3M8 7l4-4 4 4" />
    </svg>
  );
}

export function WalletIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13v4" />
      <path d="M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
      <path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

export function TicketIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6Z" />
      <path d="M13 5v14" />
    </svg>
  );
}

export function GridIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

export function ClockIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CopyIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

export function ThumbsUpIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Z" />
      <path d="M7 10l4-6a2 2 0 0 1 3.6 1.7L14 10h5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 21H7" />
    </svg>
  );
}

export function HouseIcon({ size, className, strokeWidth = 1.8 }: P) {
  return (
    <svg {...px(size)} strokeWidth={strokeWidth} className={className} aria-hidden="true">
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}
