/**
 * Haptic feedback utilities — wraps expo-haptics for key interactions
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light haptic for selections, toggles
 */
export function hapticLight(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium haptic for button presses, confirms
 */
export function hapticMedium(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy haptic for destructive actions
 */
export function hapticHeavy(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Success haptic (notification)
 */
export function hapticSuccess(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Error haptic (notification)
 */
export function hapticError(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Selection changed haptic
 */
export function hapticSelection(): void {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync();
}
