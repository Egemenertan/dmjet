/**
 * Color Constants
 * Apple Design inspired color palette
 */

export const colors = {
  // Primary Colors
  primary: '#54B047',
  primaryLight: '#6BC85E',
  primaryDark: '#3D9A31',
  
  // Background Colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceSecondary: '#F1F3F5',
  
  // Text Colors
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  
  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;

