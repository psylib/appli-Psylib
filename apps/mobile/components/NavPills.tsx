/**
 * NavPills — Horizontal navigation pills below the header
 * Replaces the bottom tab bar with an inline navigation strip.
 * Uses custom flat illustrated SVG icons.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconHome, IconPatient, IconCalendar } from '@/components/icons/AppIcons';
import { Colors } from '@/constants/colors';

interface NavItem {
  key: string;
  label: string;
  route: string;
  color: string;
  Icon: React.FC<{ size?: number; color?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    label: 'Accueil',
    route: '/(tabs)',
    color: '#4A8B6E',
    Icon: IconHome,
  },
  {
    key: 'patients',
    label: 'Patients',
    route: '/(tabs)/patients',
    color: '#3D52A0',
    Icon: IconPatient,
  },
  {
    key: 'calendar',
    label: 'Agenda',
    route: '/(tabs)/calendar',
    color: '#0D9488',
    Icon: IconCalendar,
  },
];

export function NavPills() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.key === 'home') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    }
    return pathname.startsWith(item.route.replace('/(tabs)', ''));
  };

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        const { Icon } = item;
        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.pill,
              active && { backgroundColor: `${item.color}18` },
            ]}
            onPress={() => router.push(item.route as any)}
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: active ? `${item.color}25` : Colors.surface,
                },
              ]}
            >
              <Icon
                size={20}
                color={active ? item.color : Colors.muted}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: active ? item.color : Colors.muted },
                active && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
  },
  labelActive: {
    fontFamily: 'DMSans_700Bold',
    fontWeight: '700',
  },
});
