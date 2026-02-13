import React from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../core/theme';
import { useAppStore } from '../../../shared/store/app';

export function SettingsScreen() {
  const { isDarkMode, setDarkMode, isLocationEnabled, setLocationEnabled } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={isDarkMode ? theme.colors.secondary : '#f4f3f4'}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Location Services</Text>
          <Switch
            value={isLocationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={isLocationEnabled ? theme.colors.secondary : '#f4f3f4'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
}); 