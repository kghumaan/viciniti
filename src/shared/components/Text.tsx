import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

interface TextProps extends RNTextProps {
  variant?: 'regular' | 'medium' | 'semibold' | 'bold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export const Text: React.FC<TextProps> = ({ 
  variant = 'regular', 
  size = 'md',
  color = theme.colors.text,
  style, 
  children, 
  ...props 
}) => {
  const textStyle = [
    styles.base,
    {
      fontFamily: theme.typography.fontFamily[variant],
      fontSize: theme.typography.sizes[size],
      color,
    },
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default Text; 