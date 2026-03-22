/**
 * PatientIcons — Custom flat illustrated SVG icons for the patient portal
 */
import React from 'react';
import Svg, { Path, Rect, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/** Home for patient portal */
export function IconPatientHome({ size = 24, color = '#0D9488' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect x="33" y="8" width="5" height="12" rx="1.5" fill={color} opacity={0.5} />
      <Path
        d="M6 22L24 8L42 22V40C42 41.1 41.1 42 40 42H8C6.9 42 6 41.1 6 40V22Z"
        fill={color}
        opacity={0.85}
      />
      <Path d="M6 22L24 8L42 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M20 42V32C20 29.79 21.79 28 24 28C26.21 28 28 29.79 28 32V42" fill="white" opacity={0.9} />
      <Rect x="12" y="26" width="5" height="5" rx="1" fill="white" opacity={0.6} />
      <Rect x="31" y="26" width="5" height="5" rx="1" fill="white" opacity={0.6} />
    </Svg>
  );
}

/** Heart for mood / well-being */
export function IconPatientHeart({ size = 24, color = '#0D9488' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 40L10 28C4 22 4 14 10 10C14 6 20 8 24 12C28 8 34 6 38 10C44 14 44 22 38 28L24 40Z"
        fill={color}
        opacity={0.85}
      />
      <Path d="M14 16C14 14 16 12 18 12" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.5} />
    </Svg>
  );
}

/** Book / journal */
export function IconPatientBook({ size = 24, color = '#0D9488' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Book cover */}
      <Path
        d="M8 8H36C37.1 8 38 8.9 38 10V38C38 39.1 37.1 40 36 40H8V8Z"
        fill={color}
        opacity={0.85}
      />
      {/* Spine */}
      <Rect x="8" y="8" width="4" height="32" fill={color} />
      {/* Pages */}
      <Rect x="14" y="10" width="22" height="28" rx="1" fill="white" opacity={0.3} />
      {/* Text lines */}
      <Line x1="18" y1="18" x2="32" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
      <Line x1="18" y1="23" x2="30" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
      <Line x1="18" y1="28" x2="26" y2="28" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}
