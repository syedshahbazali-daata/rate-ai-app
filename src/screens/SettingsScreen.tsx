import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { Bell, Shield, HelpCircle, Smartphone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { Screen, AppUser } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function SettingsScreen({
  onBack,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Bell size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive job and update alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.brandPlatinum, true: colors.brandRed }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingIconBox}>
              <Smartphone size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDesc}>Enable dark theme</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: colors.brandPlatinum, true: colors.brandRed }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Security</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingIconBox}>
              <Shield size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDesc}>Update your account password</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingIconBox}>
              <HelpCircle size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingDesc}>Get help with the app</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingIconBox}>
              <Smartphone size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingDesc}>1.0.0</Text>
            </View>
          </View>
        </View>
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
    gap: spacing.base,
  },
  sectionTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: spacing.base,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.brandPlatinum,
  },
  settingIconBox: {
    padding: spacing.sm,
    backgroundColor: 'rgba(224,227,232,0.3)',
    borderRadius: radius.lg,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  settingDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    marginTop: 2,
  },
});
