/**
 * Font loading — DM Sans, Playfair Display, DM Mono
 * Matching web branding.
 */
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  DMMono_400Regular,
} from '@expo-google-fonts/dm-mono';

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    PlayfairDisplay_700Bold,
    DMMono_400Regular,
  });

  return { fontsLoaded, fontError };
}
