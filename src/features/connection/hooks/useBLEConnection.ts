import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { Device } from 'react-native-ble-plx';
import BLEService, { ConnectionStatus, UserRole } from '../services/BLEService';

// Check if we're running in a simulator
// In iOS we check Platform.constants to determine if it's a simulator
const isSimulator = Platform.OS === 'ios' && 
  // @ts-ignore: isDevice is not in type definitions but exists at runtime
  !(Platform.constants && Platform.constants.isDevice);

interface BLEConnectionHook {
  status: ConnectionStatus;
  nearbyDevices: Device[];
  startConnection: (eventId: string, role: UserRole) => Promise<void>;
  stopConnection: () => void;
  error: string | null;
}

export default function useBLEConnection(): BLEConnectionHook {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [nearbyDevices, setNearbyDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle device found events
  const handleDeviceFound = useCallback((device: Device) => {
    setNearbyDevices(prevDevices => {
      // Check if device already exists in list
      const exists = prevDevices.some(d => d.id === device.id);
      if (!exists) {
        return [...prevDevices, device];
      }
      return prevDevices;
    });
  }, []);

  // Handle status changes
  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    
    if (newStatus === ConnectionStatus.ERROR) {
      setError('Something went wrong with the Bluetooth connection. Please try again.');
    } else {
      setError(null);
    }
  }, []);

  // Register callbacks when component mounts
  useEffect(() => {
    // Set up callbacks
    BLEService.setOnDeviceFoundCallback(handleDeviceFound);
    BLEService.setOnStatusChangeCallback(handleStatusChange);

    return () => {
      // Clean up when component unmounts
      BLEService.cleanup();
    };
  }, [handleDeviceFound, handleStatusChange]);

  // Start the connection process
  const startConnection = useCallback(async (eventId: string, role: UserRole) => {
    try {
      // Set event details
      BLEService.setEventDetails(eventId, role);

      // In simulator mode, just update the UI states without actual BLE operations
      if (isSimulator) {
        console.log('Simulator detected: simulating BLE operations');
        // Simulate starting
        setStatus(ConnectionStatus.SCANNING);
        
        // Create a mock device after a short delay
        setTimeout(() => {
          const mockDevice = {
            id: 'simulated-device-' + Math.floor(Math.random() * 1000),
            name: 'Simulated Device',
            rssi: -50,
            manufacturerData: null,
            serviceData: {},
            serviceUUIDs: [],
            txPowerLevel: null,
            solicitedServiceUUIDs: null,
            isConnectable: null,
            overflowServiceUUIDs: null,
            localName: 'Simulated',
            // Add stub methods
            connect: () => Promise.resolve({} as any),
            cancelConnection: () => Promise.resolve({} as any),
            isConnected: () => Promise.resolve(true),
            discoverAllServicesAndCharacteristics: () => Promise.resolve({} as any),
            services: () => Promise.resolve([]),
            characteristicsForService: () => Promise.resolve([]),
            readCharacteristicForService: () => Promise.resolve({} as any),
            writeCharacteristicWithResponseForService: () => Promise.resolve({} as any),
            writeCharacteristicWithoutResponseForService: () => Promise.resolve({} as any),
            monitorCharacteristicForService: () => ({ remove: () => {} }),
            readRSSI: () => Promise.resolve(-50),
            requestMTU: () => Promise.resolve(23),
          } as unknown as Device;
          
          handleDeviceFound(mockDevice);
        }, 2000);
        
        return;
      }

      // Real device: Request permissions first
      const hasPermissions = await BLEService.requestPermissions();
      if (!hasPermissions) {
        setError('Bluetooth permissions were not granted');
        setStatus(ConnectionStatus.ERROR);
        
        // Show alert to user about missing permissions
        Alert.alert(
          'Permission Required',
          'Bluetooth permissions are required for proximity detection.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start both advertising and scanning
      await BLEService.startAdvertising();
      await BLEService.startScanning();
    } catch (err) {
      console.error('Error starting BLE connection:', err);
      setError('Failed to start BLE connection');
      setStatus(ConnectionStatus.ERROR);
    }
  }, [handleDeviceFound]);

  // Stop the connection process
  const stopConnection = useCallback(() => {
    // For simulator, just update UI state
    if (isSimulator) {
      setStatus(ConnectionStatus.IDLE);
      return;
    }
    
    // For real devices, stop BLE operations
    BLEService.stopScanning();
    BLEService.stopAdvertising();
    setNearbyDevices([]);
    setStatus(ConnectionStatus.IDLE);
  }, []);

  return {
    status,
    nearbyDevices,
    startConnection,
    stopConnection,
    error,
  };
} 