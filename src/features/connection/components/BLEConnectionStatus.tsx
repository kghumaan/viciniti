import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ConnectionStatus } from '../services/BLEService';

interface BLEConnectionStatusProps {
  status: ConnectionStatus;
  deviceCount: number;
}

const BLEConnectionStatus: React.FC<BLEConnectionStatusProps> = ({ status, deviceCount }) => {
  // Determine the message based on the connection status
  const getMessage = () => {
    switch (status) {
      case ConnectionStatus.IDLE:
        return 'Ready to connect';
      case ConnectionStatus.SCANNING:
        return 'Searching for nearby users...';
      case ConnectionStatus.ADVERTISING:
        return 'Making your device discoverable...';
      case ConnectionStatus.CONNECTED:
        return 'Connected successfully!';
      case ConnectionStatus.ERROR:
        return 'Connection error. Please try again.';
      default:
        return '';
    }
  };

  // Determine if we should show the loading indicator
  const isLoading = status === ConnectionStatus.SCANNING || 
                    status === ConnectionStatus.ADVERTISING;

  // Get the appropriate status color
  const getStatusColor = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return '#4CAF50'; // Green
      case ConnectionStatus.ERROR:
        return '#F44336'; // Red
      case ConnectionStatus.SCANNING:
      case ConnectionStatus.ADVERTISING:
        return '#2196F3'; // Blue
      default:
        return '#FFFFFF'; // White
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
      
      <Text style={styles.statusText}>{getMessage()}</Text>
      
      {isLoading && <ActivityIndicator color="#FFFFFF" style={styles.loader} />}
      
      {deviceCount > 0 && (
        <Text style={styles.deviceCount}>
          Found {deviceCount} {deviceCount === 1 ? 'device' : 'devices'} nearby
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  loader: {
    marginTop: 8,
  },
  deviceCount: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
});

export default BLEConnectionStatus; 