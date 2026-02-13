import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, BaseToastProps } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../core/theme';

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: theme.colors.success,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingVertical: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        fontFamily: theme.typography.fontFamily.semibold,
        color: theme.colors.text,
      }}
      text2Style={{
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.textSecondary,
      }}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
        </View>
      )}
    />
  ),
  
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: theme.colors.error,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingVertical: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        fontFamily: theme.typography.fontFamily.semibold,
        color: theme.colors.text,
      }}
      text2Style={{
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.textSecondary,
      }}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
        </View>
      )}
    />
  ),
  
  info: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingVertical: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        fontFamily: theme.typography.fontFamily.semibold,
        color: theme.colors.text,
      }}
      text2Style={{
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.textSecondary,
      }}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
        </View>
      )}
    />
  ),
  
  // You can add more custom types as needed
};

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  }
}); 