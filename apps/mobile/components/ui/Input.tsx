/**
 * Input — Champ de saisie accessible PsyScale
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  style?: ViewStyle;
}

export function Input({
  label,
  hint,
  error,
  style,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label != null && label.length > 0 && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error != null && error.length > 0 && styles.inputError,
        ]}
        placeholderTextColor={Colors.mutedLight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...textInputProps}
      />
      {error != null && error.length > 0 && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
      {hint != null && hint.length > 0 && (error == null || error.length === 0) && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 44,
  },
  inputFocused: {
    borderColor: Colors.borderFocus,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  hintText: {
    fontSize: 12,
    color: Colors.muted,
  },
});
