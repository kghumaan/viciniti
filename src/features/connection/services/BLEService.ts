import React, { useEffect, useRef } from 'react';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Buffer } from 'buffer';

// The service UUID for our app - this should be unique to your app
// Using a custom service UUID that will be the same across all app instances
const SERVICE_UUID = '9B15C979-5AE3-4E4C-8DC5-91034580B5A9';

// User roles
export enum UserRole {
  PARTICIPANT = 0,
  ORGANIZER = 1,
}

// Connection status
export enum ConnectionStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  ADVERTISING = 'advertising',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// Check if we're running in a simulator
// In iOS we check Platform.constants to determine if it's a simulator
const isSimulator = Platform.OS === 'ios' && 
  // @ts-ignore: isDevice is not in type definitions but exists at runtime
  !(Platform.constants && Platform.constants.isDevice);

class BLEService {
  private bleManager: BleManager | null = null;
  private isScanning: boolean = false;
  private isAdvertising: boolean = false;
  private connectedDevices: Map<string, Device> = new Map();
  private eventId: string | null = null;
  private userRole: UserRole = UserRole.PARTICIPANT;
  private onDeviceFoundCallback: ((device: Device) => void) | null = null;
  private onStatusChangeCallback: ((status: ConnectionStatus) => void) | null = null;

  constructor() {
    // Skip initialization on simulator to prevent the NativeEventEmitter error
    if (isSimulator) {
      console.log('Running in simulator - BLE functionality will be limited');
      return;
    }

    try {
      this.bleManager = new BleManager();
      
      // Listen for state changes (e.g., Bluetooth turning on/off)
      this.bleManager.onStateChange((state) => {
        if (state === State.PoweredOn) {
          // Bluetooth is on, we can start scanning
          console.log('Bluetooth is powered on');
        } else {
          // Stop scanning if Bluetooth is turned off
          this.stopScanning();
          this.stopAdvertising();
          console.log('Bluetooth state changed to:', state);
        }
      }, true);
    } catch (error) {
      console.error('Failed to initialize BLE Manager:', error);
    }
  }

  // Set event callback when a device is found
  public setOnDeviceFoundCallback(callback: (device: Device) => void): void {
    this.onDeviceFoundCallback = callback;
  }

  // Set callback for connection status changes
  public setOnStatusChangeCallback(callback: (status: ConnectionStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  // Update status and call the callback if set
  private updateStatus(status: ConnectionStatus): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  // Set the event ID and user role
  public setEventDetails(eventId: string, role: UserRole): void {
    this.eventId = eventId;
    this.userRole = role;
  }

  // Request required permissions (Android only)
  public async requestPermissions(): Promise<boolean> {
    // Skip permission requests on simulator
    if (isSimulator) {
      return true;
    }
    
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) { // Android 12+
          const bluetoothScanGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
              title: 'Bluetooth Scan Permission',
              message: 'App needs Bluetooth Scan permission to discover nearby devices',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          
          const bluetoothConnectGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
              title: 'Bluetooth Connect Permission',
              message: 'App needs Bluetooth Connect permission to connect to nearby devices',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          
          const bluetoothAdvertiseGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            {
              title: 'Bluetooth Advertise Permission',
              message: 'App needs Bluetooth Advertise permission to make itself discoverable',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          
          return (
            bluetoothScanGranted === PermissionsAndroid.RESULTS.GRANTED &&
            bluetoothConnectGranted === PermissionsAndroid.RESULTS.GRANTED &&
            bluetoothAdvertiseGranted === PermissionsAndroid.RESULTS.GRANTED
          );
        } else { // Android 11 and below
          const fineLocationGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'App needs location permission for Bluetooth scanning',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          
          return fineLocationGranted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.error('Error requesting permissions:', err);
        return false;
      }
    }
    // iOS doesn't need runtime permissions for BLE
    return true;
  }

  // Start scanning for nearby devices
  public async startScanning(): Promise<void> {
    if (this.isScanning || !this.bleManager) {
      // Return early if already scanning or bleManager not initialized (simulator)
      if (!this.bleManager) {
        console.log('BLE Manager not initialized, likely running in simulator');
        this.updateStatus(ConnectionStatus.ERROR);
      }
      return;
    }
    
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.error('BLE permissions not granted');
        this.updateStatus(ConnectionStatus.ERROR);
        return;
      }

      this.isScanning = true;
      this.updateStatus(ConnectionStatus.SCANNING);
      
      // Start scanning for devices with our service UUID
      this.bleManager.startDeviceScan(
        [SERVICE_UUID], 
        { allowDuplicates: true },
        (error, device) => {
          if (error) {
            console.error('Scanning error:', error);
            this.stopScanning();
            this.updateStatus(ConnectionStatus.ERROR);
            return;
          }

          if (device) {
            // Parse manufacturer data to check if it contains our event ID and role
            const manufacturerData = device.manufacturerData;
            if (manufacturerData) {
              try {
                // Decode and parse manufacturer data
                const decodedData = Buffer.from(manufacturerData, 'base64').toString('utf8');
                const [deviceEventId, deviceRoleStr] = decodedData.split(':');
                const deviceRole = parseInt(deviceRoleStr, 10);
                
                // Check if this device is participating in the same event
                if (deviceEventId === this.eventId) {
                  console.log('Found device for our event:', device.name || 'Unknown device');
                  
                  // Store the device
                  this.connectedDevices.set(device.id, device);
                  
                  // Call the callback if set
                  if (this.onDeviceFoundCallback) {
                    this.onDeviceFoundCallback(device);
                  }
                  
                  // If we find an organizer and we're a participant, or vice versa, we can connect
                  if ((deviceRole === UserRole.ORGANIZER && this.userRole === UserRole.PARTICIPANT) ||
                      (deviceRole === UserRole.PARTICIPANT && this.userRole === UserRole.ORGANIZER)) {
                    this.updateStatus(ConnectionStatus.CONNECTED);
                  }
                }
              } catch (e) {
                // Error parsing manufacturer data, ignore this device
                console.log('Error parsing manufacturer data:', e);
              }
            }
          }
        }
      );
    } catch (error) {
      console.error('Error starting scan:', error);
      this.isScanning = false;
      this.updateStatus(ConnectionStatus.ERROR);
    }
  }

  // Stop scanning for devices
  public stopScanning(): void {
    if (!this.isScanning || !this.bleManager) return;
    
    this.bleManager.stopDeviceScan();
    this.isScanning = false;
    
    if (!this.isAdvertising) {
      this.updateStatus(ConnectionStatus.IDLE);
    }
  }

  // Start advertising our device to be discovered by others
  public async startAdvertising(): Promise<void> {
    if (this.isAdvertising || !this.eventId || !this.bleManager) {
      // In simulator mode, we'll simulate advertising
      if (!this.bleManager) {
        console.log('BLE Manager not initialized, simulating advertising');
        this.isAdvertising = true;
        this.updateStatus(ConnectionStatus.ADVERTISING);
        return;
      }
      return;
    }
    
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.error('BLE permissions not granted');
        this.updateStatus(ConnectionStatus.ERROR);
        return;
      }

      this.isAdvertising = true;
      this.updateStatus(ConnectionStatus.ADVERTISING);
      
      // Note: Actual advertising implementation depends on native modules
      // For this example, we're assuming we can use the BleManager to advertise
      // In a real app, you might need a native module that supports advertising
      
      // This is a placeholder for actual advertising implementation
      console.log('Started advertising with event ID:', this.eventId, 'and role:', this.userRole);
      
      // In a real implementation, you would call native advertising methods here
    } catch (error) {
      console.error('Error starting advertising:', error);
      this.isAdvertising = false;
      this.updateStatus(ConnectionStatus.ERROR);
    }
  }

  // Stop advertising
  public stopAdvertising(): void {
    if (!this.isAdvertising) return;
    
    // Stop advertising (placeholder for actual implementation)
    console.log('Stopped advertising');
    this.isAdvertising = false;
    
    if (!this.isScanning) {
      this.updateStatus(ConnectionStatus.IDLE);
    }
  }

  // Clean up resources when component unmounts
  public cleanup(): void {
    this.stopScanning();
    this.stopAdvertising();
    this.connectedDevices.clear();
  }

  // Generate a random event ID for testing
  public generateTestEventId(): string {
    return randomUUID();
  }
}

// Export singleton instance
export default new BLEService(); 