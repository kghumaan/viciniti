import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../services/BLEService';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleSelected: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelected }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>I am a:</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRole === UserRole.PARTICIPANT && styles.selectedOption
          ]}
          onPress={() => onRoleSelected(UserRole.PARTICIPANT)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="person" 
            size={24} 
            color={selectedRole === UserRole.PARTICIPANT ? '#1DB9FF' : '#FFFFFF'} 
          />
          <Text 
            style={[
              styles.roleText,
              selectedRole === UserRole.PARTICIPANT && styles.selectedText
            ]}
          >
            Participant
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRole === UserRole.ORGANIZER && styles.selectedOption
          ]}
          onPress={() => onRoleSelected(UserRole.ORGANIZER)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="star" 
            size={24} 
            color={selectedRole === UserRole.ORGANIZER ? '#1DB9FF' : '#FFFFFF'} 
          />
          <Text 
            style={[
              styles.roleText,
              selectedRole === UserRole.ORGANIZER && styles.selectedText
            ]}
          >
            Organizer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  roleOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    width: '45%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#1DB9FF',
    backgroundColor: 'rgba(29, 185, 255, 0.1)',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
  },
  selectedText: {
    color: '#1DB9FF',
    fontWeight: '600',
  },
});

export default RoleSelector; 