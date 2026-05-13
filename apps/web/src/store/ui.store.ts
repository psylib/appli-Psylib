import { create } from 'zustand';

interface UIState {
  smartSlotPickerOpen: boolean;
  smartSlotPickerDefaultPatientId: string | null;
  openSmartSlotPicker: (patientId?: string) => void;
  closeSmartSlotPicker: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  smartSlotPickerOpen: false,
  smartSlotPickerDefaultPatientId: null,
  openSmartSlotPicker: (patientId) =>
    set({ smartSlotPickerOpen: true, smartSlotPickerDefaultPatientId: patientId ?? null }),
  closeSmartSlotPicker: () =>
    set({ smartSlotPickerOpen: false, smartSlotPickerDefaultPatientId: null }),
}));
