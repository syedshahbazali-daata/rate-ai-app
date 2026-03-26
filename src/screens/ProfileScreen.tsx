import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { User, Mail, Shield, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { Screen, AppUser } from '../types';

interface ProfileScreenProps {
  user: AppUser;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function ProfileScreen({
  user,
  onBack,
  onNavigate,
  onLogout,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const infoRows = [
    { icon: User, label: 'Full Name', value: user.name.toUpperCase() },
    { icon: Mail, label: 'Email Address', value: user.email },
    { icon: Shield, label: 'User Role', value: (user.role || 'Technician').toUpperCase() },
    { icon: Shield, label: 'Account Status', value: 'Active • Verified', isStatus: true },
  ];

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.name.toUpperCase()}</Text>
          <Text style={styles.userRole}>{(user.role || 'Field Technician').toUpperCase()}</Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          {infoRows.map(({ icon: Icon, label, value, isStatus }, index) => (
            <View
              key={label}
              style={[styles.infoRow, index < infoRows.length - 1 && styles.infoRowBorder]}
            >
              <View style={styles.infoIconBox}>
                <Icon size={20} color={colors.brandBlack + '66'} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
                <Text style={[styles.infoValue, isStatus && styles.infoValueStatus]}>
                  {value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && styles.logoutBtnDisabled]}
          onPress={onLogout}
          disabled={isLoggingOut}
          activeOpacity={0.85}
        >
          {isLoggingOut
            ? <ActivityIndicator size="small" color={colors.brandRed} />
            : <LogOut size={20} color={colors.brandRed} />
          }
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT SESSION'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
  container: { flex: 1, backgroundColor: colors.brandPlatinum },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing['2xl'],
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.base,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize['3xl'],
    color: colors.white,
  },
  userName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize['2xl'],
    color: colors.brandBlack,
    letterSpacing: -0.5,
  },
  userRole: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    letterSpacing: 2,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  infoRow: {
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
  },
  infoIconBox: {
    padding: spacing.sm,
    backgroundColor: 'rgba(224,227,232,0.3)',
    borderRadius: radius.lg,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '44',
    letterSpacing: 2,
  },
  infoValue: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    textTransform: 'uppercase',
  },
  infoValueStatus: {
    color: '#16a34a',
  },
  logoutBtn: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.brandRed,
    borderRadius: radius.xl,
    paddingVertical: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtnDisabled: {
    opacity: 0.5,
  },
  logoutText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
