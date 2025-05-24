import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

// Create a custom Text component
const Text = (props) => {
  const { style, children, ...otherProps } = props;
  
  return (
    <RNText style={[styles.defaultText, style]} {...otherProps}>
      {children}
    </RNText>
  );
};

// Define default styles
const styles = StyleSheet.create({
  defaultText: {
    fontSize: 16,
    color: '#333333',
  },
  shadowedText: {
    // Use boxShadow instead of textShadow for web compatibility
    boxShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
    // For native platforms, you might still need these:
    // textShadowColor: 'rgba(0, 0, 0, 0.5)',
    // textShadowOffset: { width: 1, height: 1 },
    // textShadowRadius: 2,
  },
});

// Export the component
export default Text;
