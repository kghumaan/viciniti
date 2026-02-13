import { NavigatorScreenParams } from '@react-navigation/native';
import { UserRole } from '../features/connection/services/BLEService';

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  CreateBeacon: {
    initialLocation: {
      latitude: number;
      longitude: number;
    };
    fromMapPress?: boolean;
  };
  Connection: {
    eventId?: string;
    initialRole?: UserRole;
    beaconId?: string;
  };
  BeaconDetail: {
    beaconId: string;
    eventId?: string;
    userRole?: UserRole;
    isEditable?: boolean;
  };
};

export type TabParamList = {
  Map: undefined;
  Beacons: undefined;
  Account: undefined;
}; 