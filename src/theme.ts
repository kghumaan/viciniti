export const theme = {
  colors: {
    // Main colors
    primary: '#121212',      // Very dark grey, almost black
    secondary: '#1E1E1E',    // Slightly lighter dark grey
    background: '#0A0A0A',   // Almost black background
    surface: '#181818',      // Dark grey surface
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#BBBBBB',
    textMuted: '#777777',
    
    // UI elements
    border: '#2A2A2A',
    card: '#141414',
    input: '#202020',
    
    // Map specific colors
    mapBackground: '#0F0F0F',
    mapWater: '#131313',
    mapLand: '#1A1A1A',
    mapRoads: '#252525',
    mapLabels: '#9A9A9A',
  },
  typography: {
    fontFamily: {
      regular: 'IBMPlexMono_400Regular',
      medium: 'IBMPlexMono_500Medium',
      semibold: 'IBMPlexMono_600SemiBold',
      bold: 'IBMPlexMono_700Bold',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
} as const; 