import React from 'react';
import { Image, StyleSheet } from 'react-native';

const darkAdaptive = require('../../Logos/dark-mode-adaptive.png');
const lightAdaptive = require('../../Logos/light-mode-adaptive.png');

interface LogoProps {
  width?: number;
  height?: number;
  /** "default" = dark logo for light backgrounds | "white" = light logo for dark backgrounds */
  variant?: 'default' | 'white';
}

// Original SVG aspect ratio: 1613.46 × 783.92
const ASPECT_RATIO = 1613.46 / 783.92;

export const Logo: React.FC<LogoProps> = ({ width = 200, height, variant = 'default' }) => {
  const resolvedHeight = height ?? width / ASPECT_RATIO;
  const source = variant === 'white' ? darkAdaptive : lightAdaptive;

  return (
    <Image
      source={source}
      style={[styles.image, { width, height: resolvedHeight }]}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});
