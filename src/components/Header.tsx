import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, fontSize } from '../theme';

interface HeaderProps {
  onMenuPress: () => void;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ onMenuPress, rightElement }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Menu size={24} color={colors.brandRed} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.titleMain}>A-TEAM</Text>
        <Text style={styles.titleSub}>Electricians</Text>
      </View>

      <View style={styles.rightSlot}>
        {rightElement ?? null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brandBlack,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleMain: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    color: colors.brandRed,
    letterSpacing: -1,
    lineHeight: fontSize.xl + 2,
    textTransform: 'uppercase',
  },
  titleSub: {
    fontFamily: fonts.sansLight,
    fontSize: 8,
    color: colors.brandPlatinum,
    letterSpacing: 4,
    lineHeight: 10,
    textTransform: 'uppercase',
  },
  rightSlot: {
    width: 24,
    alignItems: 'flex-end',
  },
});
