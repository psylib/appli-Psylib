'use client';

import { SmartSlotPickerDialog } from '@/components/sessions/smart-slot-picker-dialog';

/**
 * Client component that mounts all dashboard-level dialogs.
 * Rendered inside the server DashboardLayout so dialogs are always available.
 */
export function DashboardDialogs() {
  return <SmartSlotPickerDialog />;
}
