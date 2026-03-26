import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { Screen, AppUser } from '../types';

interface HomeScreenProps {
  onAccessMenu: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function HomeScreen({
  onAccessMenu,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />

      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.headingArea}>
          <Text style={styles.heading}>What are we doing today?</Text>
          <Text style={styles.subheading}>SELECT AN OPTION TO BEGIN PRICING</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardTopBar} />
          <Text style={styles.cardTitle}>Electrical</Text>
          <TouchableOpacity
            style={styles.accessBtn}
            onPress={onAccessMenu}
            activeOpacity={0.85}
          >
            <Text style={styles.accessBtnText}>Access Menu{'\n'}Pricing</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={user}
        isLoggingOut={isLoggingOut}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandPlatinum,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
  headingArea: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heading: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize['2xl'],
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '99',
    letterSpacing: 2,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 280,
    aspectRatio: 3 / 4,
    backgroundColor: colors.white,
    borderWidth: 4,
    borderColor: colors.brandBlack,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: colors.brandRed,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize['3xl'],
    color: colors.brandBlack,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  accessBtn: {
    backgroundColor: colors.brandRed,
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  accessBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xl,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: fontSize.xl + 4,
  },
});
