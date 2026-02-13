import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '@core/theme';

const { width, height } = Dimensions.get('window');

export const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Main action button (Create) - Primary focal point
  mainActionContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 3,
  },
  mainActionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  
  // Secondary actions grouped together
  secondaryActionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    zIndex: 2,
    alignItems: 'flex-start',
  },
  secondaryActionGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  secondaryActionButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  
  // Map controls (locate/list toggle)
  mapControlsContainer: {
    position: 'absolute',
    bottom: 170, // Above main action
    right: 20,
    zIndex: 2,
  },
  mapControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // Legacy styles for backward compatibility - will be cleaned up
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },
  vicinityContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    zIndex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },
  listButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 8,
  },
  vicinityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  filtersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    backgroundColor: theme.colors.background,
  },
}); 