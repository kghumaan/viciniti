export const theme = {
  colors: {
    // Main colors
    primary: '#121212',      // Very dark grey, almost black
    secondary: '#1E1E1E',    // Slightly lighter dark grey
    background: '#0A0A0A',   // Almost black background
    surface: '#0A0A0A',      // Almost black background
    
    // Text colors
    text: '#F5F5F5',         // Off-white
    textSecondary: '#BBBBBB', // Light grey
    textMuted: '#777777',     // Medium grey
    
    // UI elements
    border: '#2A2A2A',       // Dark grey
    card: '#121212',         // Very dark grey
    input: '#181818',        // Dark grey
    inputBackground: '#0F0F0F', // Nearly black
    placeholder: '#666666',   // Medium grey for placeholder
    
    // Status colors
    error: '#D32F2F',        // Darker red
    success: '#388E3C',      // Darker green
    warning: '#F57C00',      // Darker orange
    info: '#1976D2',         // Darker blue
    
    // Map specific colors
    mapBackground: '#0F0F0F', // Nearly black
    mapWater: '#181818',     // Dark grey
    mapLand: '#252525',      // Medium dark grey
    mapRoads: '#333333',     // Medium grey
    mapLabels: '#999999',    // Light grey

    // Color variations
    mintGreen: {
      DEFAULT: '#252525',    // Dark grey instead of mint green
      100: '#0A0A0A',
      200: '#121212',
      300: '#181818',
      400: '#1E1E1E',
      500: '#252525',
      600: '#2A2A2A',
      700: '#333333',
      800: '#3A3A3A',
      900: '#444444'
    },
    moonstone: {
      DEFAULT: '#121212',    // Very dark grey
      100: '#0A0A0A',
      200: '#0F0F0F',
      300: '#151515',
      400: '#1A1A1A',
      500: '#121212',
      600: '#222222',
      700: '#2A2A2A',
      800: '#333333',
      900: '#3D3D3D'
    },
    indigoDye: {
      DEFAULT: '#0A0A0A',    // Almost black
      100: '#050505',
      200: '#080808',
      300: '#0A0A0A',
      400: '#0F0F0F',
      500: '#121212',
      600: '#181818',
      700: '#1E1E1E',
      800: '#252525',
      900: '#2D2D2D'
    },
    columbiaBlue: {
      DEFAULT: '#BBBBBB',    // Light grey
      100: '#333333',
      200: '#444444',
      300: '#555555',
      400: '#777777',
      500: '#BBBBBB',
      600: '#CCCCCC',
      700: '#DDDDDD',
      800: '#EEEEEE',
      900: '#F5F5F5'
    },
    pictonBlue: {
      DEFAULT: '#1E1E1E',    // Dark grey
      100: '#0A0A0A',
      200: '#121212',
      300: '#151515',
      400: '#1A1A1A',
      500: '#1E1E1E',
      600: '#252525',
      700: '#2D2D2D',
      800: '#333333',
      900: '#3A3A3A'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
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
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
  },
} as const; 