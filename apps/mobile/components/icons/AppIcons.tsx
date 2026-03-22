/**
 * AppIcons — Custom flat illustrated SVG icons
 * Style: Flat minimalist with soft fills, inspired by the sage-green design reference.
 * Each icon accepts size and color props.
 */
import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  Ellipse,
  Line,
} from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = 24;

/* ──────────────────── Navigation Icons ──────────────────── */

/** Flat filled house with door arch and chimney */
export function IconHome({ size = DEFAULT_SIZE, color = '#4A8B6E' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Chimney */}
      <Rect x="33" y="8" width="5" height="12" rx="1.5" fill={color} opacity={0.5} />
      {/* House body */}
      <Path
        d="M6 22L24 8L42 22V40C42 41.1 41.1 42 40 42H8C6.9 42 6 41.1 6 40V22Z"
        fill={color}
        opacity={0.85}
      />
      {/* Roof highlight */}
      <Path
        d="M6 22L24 8L42 22"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Door arch */}
      <Path
        d="M20 42V32C20 29.79 21.79 28 24 28C26.21 28 28 29.79 28 32V42"
        fill="white"
        opacity={0.9}
      />
      {/* Window left */}
      <Rect x="12" y="26" width="5" height="5" rx="1" fill="white" opacity={0.6} />
      {/* Window right */}
      <Rect x="31" y="26" width="5" height="5" rx="1" fill="white" opacity={0.6} />
    </Svg>
  );
}

/** Illustrated person bust — patient icon */
export function IconPatient({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Body / shoulders */}
      <Path
        d="M8 42C8 34 14 30 24 30C34 30 40 34 40 42"
        fill={color}
        opacity={0.8}
      />
      {/* Head */}
      <Circle cx="24" cy="17" r="10" fill={color} opacity={0.85} />
      {/* Hair */}
      <Path
        d="M14 15C14 10 18 7 24 7C30 7 34 10 34 15C34 12 30 9 24 9C18 9 14 12 14 15Z"
        fill={color}
      />
      {/* Smile */}
      <Path
        d="M20 20C21 22 23 23 24 23C25 23 27 22 28 20"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
    </Svg>
  );
}

/** Filled calendar with grid */
export function IconCalendar({ size = DEFAULT_SIZE, color = '#0D9488' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Calendar body */}
      <Rect x="6" y="12" width="36" height="30" rx="4" fill={color} opacity={0.85} />
      {/* Top bar */}
      <Rect x="6" y="12" width="36" height="10" rx="4" fill={color} />
      {/* Binding rings */}
      <Rect x="15" y="8" width="3" height="8" rx="1.5" fill={color} />
      <Rect x="30" y="8" width="3" height="8" rx="1.5" fill={color} />
      {/* Grid dots — 3x3 */}
      <Rect x="13" y="27" width="5" height="4" rx="1" fill="white" opacity={0.6} />
      <Rect x="21.5" y="27" width="5" height="4" rx="1" fill="white" opacity={0.6} />
      <Rect x="30" y="27" width="5" height="4" rx="1" fill="white" opacity={0.6} />
      <Rect x="13" y="34" width="5" height="4" rx="1" fill="white" opacity={0.6} />
      <Rect x="21.5" y="34" width="5" height="4" rx="1" fill="white" opacity={0.6} />
      <Rect x="30" y="34" width="5" height="4" rx="1" fill="white" opacity={0.6} />
    </Svg>
  );
}

/* ──────────────────── Dashboard Icons ──────────────────── */

/** Add / Plus icon in circle */
export function IconAdd({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="18" fill={color} opacity={0.15} />
      <Circle cx="24" cy="24" r="14" fill={color} opacity={0.25} />
      <Line x1="24" y1="16" x2="24" y2="32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Line x1="16" y1="24" x2="32" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

/** Bell / notifications */
export function IconBell({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Bell body */}
      <Path
        d="M12 32V22C12 15.37 17.37 10 24 10C30.63 10 36 15.37 36 22V32L39 36H9L12 32Z"
        fill={color}
        opacity={0.85}
      />
      {/* Clapper */}
      <Ellipse cx="24" cy="40" rx="4" ry="2.5" fill={color} />
      {/* Highlight */}
      <Path
        d="M18 22C18 18.69 20.69 16 24 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  );
}

/** Person with + (add patient) */
export function IconPersonAdd({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Body */}
      <Path
        d="M6 42C6 34 12 30 20 30C28 30 34 34 34 42"
        fill={color}
        opacity={0.7}
      />
      {/* Head */}
      <Circle cx="20" cy="17" r="9" fill={color} opacity={0.85} />
      {/* Plus sign */}
      <Circle cx="38" cy="16" r="8" fill={color} opacity={0.2} />
      <Line x1="38" y1="12" x2="38" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="34" y1="16" x2="42" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Pen/create icon for new session */
export function IconCreate({ size = DEFAULT_SIZE, color = '#0D9488' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Page */}
      <Rect x="10" y="6" width="24" height="36" rx="3" fill={color} opacity={0.2} />
      {/* Pen body */}
      <Path
        d="M30 12L38 20L22 36L14 38L16 30L30 12Z"
        fill={color}
        opacity={0.85}
      />
      {/* Pen tip */}
      <Path
        d="M14 38L16 30L22 36L14 38Z"
        fill={color}
      />
      {/* Pen top */}
      <Path
        d="M30 12L34 8L40 14L38 20L30 12Z"
        fill={color}
        opacity={0.6}
      />
    </Svg>
  );
}

/** People group icon (active patients KPI) */
export function IconPeople({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Back person */}
      <Circle cx="34" cy="16" r="7" fill={color} opacity={0.4} />
      <Path
        d="M26 40C26 34 30 31 34 31C38 31 42 34 42 40"
        fill={color}
        opacity={0.35}
      />
      {/* Front person */}
      <Circle cx="20" cy="16" r="8" fill={color} opacity={0.85} />
      <Path
        d="M6 40C6 33 12 29 20 29C28 29 34 33 34 40"
        fill={color}
        opacity={0.75}
      />
    </Svg>
  );
}

/** Document/notes icon (sessions KPI) */
export function IconDocument({ size = DEFAULT_SIZE, color = '#0D9488' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Paper */}
      <Path
        d="M12 6H30L38 14V40C38 41.1 37.1 42 36 42H12C10.9 42 10 41.1 10 40V8C10 6.9 10.9 6 12 6Z"
        fill={color}
        opacity={0.85}
      />
      {/* Fold corner */}
      <Path
        d="M30 6V14H38"
        fill={color}
        opacity={0.4}
      />
      <Path
        d="M30 6L38 14H30V6Z"
        fill={color}
        opacity={0.5}
      />
      {/* Text lines */}
      <Line x1="16" y1="22" x2="32" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
      <Line x1="16" y1="28" x2="28" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
      <Line x1="16" y1="34" x2="24" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

/* ──────────────────── Profile Sheet Icons ──────────────────── */

/** Analytics / bar chart */
export function IconChart({ size = DEFAULT_SIZE, color = '#7C3AED' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Rect x="6" y="28" width="8" height="14" rx="2" fill={color} opacity={0.5} />
      <Rect x="17" y="18" width="8" height="24" rx="2" fill={color} opacity={0.7} />
      <Rect x="28" y="8" width="8" height="34" rx="2" fill={color} opacity={0.9} />
      {/* Trend line */}
      <Path
        d="M8 26L21 16L32 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
        fill="none"
        opacity={0.4}
      />
    </Svg>
  );
}

/** Receipt / invoices */
export function IconReceipt({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Path
        d="M10 6H38V42L34 38L30 42L26 38L22 42L18 38L14 42L10 38V6Z"
        fill={color}
        opacity={0.85}
      />
      <Line x1="16" y1="14" x2="32" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
      <Line x1="16" y1="20" x2="28" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
      <Line x1="16" y1="26" x2="32" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
      <Line x1="16" y1="32" x2="24" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

/** Chat bubbles / messages */
export function IconChat({ size = DEFAULT_SIZE, color = '#0D9488' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Back bubble */}
      <Path
        d="M16 10H38C39.1 10 40 10.9 40 12V28C40 29.1 39.1 30 38 30H32L28 36L24 30H16C14.9 30 14 29.1 14 28V12C14 10.9 14.9 10 16 10Z"
        fill={color}
        opacity={0.4}
      />
      {/* Front bubble */}
      <Path
        d="M10 16H30C31.1 16 32 16.9 32 18V32C32 33.1 31.1 34 30 34H18L14 40L10 34H10C8.9 34 8 33.1 8 32V18C8 16.9 8.9 16 10 16Z"
        fill={color}
        opacity={0.85}
      />
      {/* Dots */}
      <Circle cx="15" cy="25" r="1.5" fill="white" opacity={0.7} />
      <Circle cx="20" cy="25" r="1.5" fill="white" opacity={0.7} />
      <Circle cx="25" cy="25" r="1.5" fill="white" opacity={0.7} />
    </Svg>
  );
}

/** Sparkle / AI assistant */
export function IconSparkle({ size = DEFAULT_SIZE, color = '#0D9488' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Main star */}
      <Path
        d="M24 4L28 18L42 20L28 24L24 40L20 24L6 20L20 18L24 4Z"
        fill={color}
        opacity={0.85}
      />
      {/* Small sparkle */}
      <Path
        d="M38 6L39.5 10L43 11L39.5 12.5L38 16L36.5 12.5L33 11L36.5 10L38 6Z"
        fill={color}
        opacity={0.5}
      />
      {/* Tiny sparkle */}
      <Path
        d="M10 34L11 37L14 38L11 39L10 42L9 39L6 38L9 37L10 34Z"
        fill={color}
        opacity={0.4}
      />
    </Svg>
  );
}

/** Settings gear */
export function IconSettings({ size = DEFAULT_SIZE, color = '#6B7280' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Gear teeth */}
      <Path
        d="M24 6L28 10L34 8L34 14L40 16L38 22L42 26L38 30L40 36L34 36L32 42L28 38L24 42L20 38L16 42L14 36L8 36L10 30L6 26L10 22L8 16L14 14L14 8L20 10L24 6Z"
        fill={color}
        opacity={0.8}
      />
      {/* Center circle */}
      <Circle cx="24" cy="24" r="7" fill="white" opacity={0.9} />
      <Circle cx="24" cy="24" r="4" fill={color} opacity={0.3} />
    </Svg>
  );
}

/** Logout / exit */
export function IconLogout({ size = DEFAULT_SIZE, color = '#EF4444' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Door frame */}
      <Path
        d="M10 8H26C27.1 8 28 8.9 28 10V38C28 39.1 27.1 40 26 40H10C8.9 40 8 39.1 8 38V10C8 8.9 8.9 8 10 8Z"
        fill={color}
        opacity={0.2}
      />
      {/* Arrow */}
      <Line x1="20" y1="24" x2="40" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Path
        d="M34 18L40 24L34 30"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Search / magnifying glass */
export function IconSearch({ size = DEFAULT_SIZE, color = '#6B7280' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="22" cy="22" r="12" fill={color} opacity={0.15} />
      <Circle cx="22" cy="22" r="12" stroke={color} strokeWidth="3" fill="none" opacity={0.7} />
      <Line x1="31" y1="31" x2="40" y2="40" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.8} />
      {/* Highlight */}
      <Path
        d="M16 18C17 14 19 12 22 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  );
}

/** Chevron right */
export function IconChevronRight({ size = DEFAULT_SIZE, color = '#C4C4C4' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Path
        d="M18 10L32 24L18 38"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Sun / sunny day */
export function IconSun({ size = DEFAULT_SIZE, color = '#FCD34D' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="10" fill={color} opacity={0.85} />
      {/* Rays */}
      <Line x1="24" y1="4" x2="24" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.6} />
      <Line x1="24" y1="38" x2="24" y2="44" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.6} />
      <Line x1="4" y1="24" x2="10" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.6} />
      <Line x1="38" y1="24" x2="44" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.6} />
      <Line x1="10" y1="10" x2="14" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.5} />
      <Line x1="34" y1="34" x2="38" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.5} />
      <Line x1="38" y1="10" x2="34" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.5} />
      <Line x1="14" y1="34" x2="10" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}

/** More / ellipsis */
export function IconMore({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="12" cy="24" r="4" fill={color} opacity={0.8} />
      <Circle cx="24" cy="24" r="4" fill={color} opacity={0.8} />
      <Circle cx="36" cy="24" r="4" fill={color} opacity={0.8} />
    </Svg>
  );
}

/** Checklist / todo circle */
export function IconCircleOutline({ size = DEFAULT_SIZE, color = '#6B7280' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="16" stroke={color} strokeWidth="2.5" fill="none" opacity={0.5} />
      <Circle cx="24" cy="24" r="6" fill={color} opacity={0.15} />
    </Svg>
  );
}

/** Notifications off */
export function IconBellOff({ size = DEFAULT_SIZE, color = '#C4C4C4' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Path
        d="M12 32V22C12 15.37 17.37 10 24 10C30.63 10 36 15.37 36 22V32L39 36H9L12 32Z"
        fill={color}
        opacity={0.4}
      />
      <Ellipse cx="24" cy="40" rx="4" ry="2.5" fill={color} opacity={0.4} />
      {/* Slash */}
      <Line x1="8" y1="8" x2="40" y2="40" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}

/** Heart (mood alert) */
export function IconHeart({ size = DEFAULT_SIZE, color = '#EF4444' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 40L10 28C4 22 4 14 10 10C14 6 20 8 24 12C28 8 34 6 38 10C44 14 44 22 38 28L24 40Z"
        fill={color}
        opacity={0.85}
      />
      {/* Highlight */}
      <Path
        d="M14 16C14 14 16 12 18 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  );
}

/** Credit card (payment) */
export function IconCard({ size = DEFAULT_SIZE, color = '#3D52A0' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Rect x="4" y="12" width="40" height="26" rx="4" fill={color} opacity={0.85} />
      {/* Stripe */}
      <Rect x="4" y="18" width="40" height="6" fill={color} />
      {/* Chip */}
      <Rect x="10" y="28" width="8" height="6" rx="1.5" fill="white" opacity={0.5} />
      {/* Number dots */}
      <Circle cx="28" cy="31" r="1.5" fill="white" opacity={0.4} />
      <Circle cx="32" cy="31" r="1.5" fill="white" opacity={0.4} />
      <Circle cx="36" cy="31" r="1.5" fill="white" opacity={0.4} />
      <Circle cx="40" cy="31" r="1.5" fill="white" opacity={0.4} />
    </Svg>
  );
}

/** Mail / email */
export function IconMail({ size = DEFAULT_SIZE, color = '#6B7280' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Rect x="4" y="10" width="40" height="28" rx="4" fill={color} opacity={0.8} />
      <Path
        d="M4 14L24 28L44 14"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.6}
      />
    </Svg>
  );
}

/** Phone / call */
export function IconPhone({ size = DEFAULT_SIZE, color = '#6B7280' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Path
        d="M14 6C12 6 10 8 10 10V12C10 28 20 38 36 38H38C40 38 42 36 42 34L40 28L32 30L28 26L22 20L18 16L20 8L14 6Z"
        fill={color}
        opacity={0.85}
      />
    </Svg>
  );
}

/** Clock / time */
export function IconClock({ size = DEFAULT_SIZE, color = '#6B7280' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="18" fill={color} opacity={0.15} />
      <Circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2.5" fill="none" opacity={0.7} />
      <Line x1="24" y1="14" x2="24" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="24" y1="24" x2="32" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="24" cy="24" r="2" fill={color} />
    </Svg>
  );
}

/** Navigate / source compass */
export function IconCompass({ size = DEFAULT_SIZE, color = '#6B7280' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2.5" fill="none" opacity={0.5} />
      <Path
        d="M20 28L16 16L28 20L32 32L20 28Z"
        fill={color}
        opacity={0.85}
      />
      <Circle cx="24" cy="24" r="2" fill="white" />
    </Svg>
  );
}

/** Add circle (new session button) */
export function IconAddCircle({ size = DEFAULT_SIZE, color = '#FFFFFF' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="16" stroke={color} strokeWidth="2.5" fill="none" opacity={0.7} />
      <Line x1="24" y1="16" x2="24" y2="32" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="24" x2="32" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Person outline (patient not found) */
export function IconPersonOutline({ size = DEFAULT_SIZE, color = '#C4C4C4' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="16" r="9" stroke={color} strokeWidth="2.5" fill="none" opacity={0.6} />
      <Path
        d="M8 42C8 34 14 30 24 30C34 30 40 34 40 42"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  );
}
