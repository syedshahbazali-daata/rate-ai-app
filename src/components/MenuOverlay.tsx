import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Home, User, LogOut, X, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { Screen, AppUser } from '../types';

const MENU_WIDTH = Math.min(Dimensions.get('window').width * 0.8, 300);

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasBeenOpened(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen && !hasBeenOpened) return null;

  const menuItems = [
    { icon: Home, label: 'Home', screen: 'home' as Screen },
    { icon: User, label: 'Profile', screen: 'profile' as Screen },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          { width: MENU_WIDTH, paddingTop: insets.top, transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitleMain}>A-TEAM</Text>
            <Text style={styles.panelTitleSub}>Electricians</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.brandRed} />
          </TouchableOpacity>
        </View>

        {/* User info */}
        {user && (
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>{user.name.toUpperCase()}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Nav items */}
        <View style={styles.nav}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              onPress={() => { onNavigate(item.screen); onClose(); }}
              disabled={isLoggingOut}
            >
              <item.icon size={20} color={colors.brandBlack + '66'} />
              <Text style={styles.navLabel}>{item.label.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => { onRefresh(); onClose(); }}
            disabled={isRefreshing}
          >
            {isRefreshing
              ? <ActivityIndicator size="small" color={colors.brandBlack + '66'} />
              : <RefreshCw size={20} color={colors.brandBlack + '66'} />
            }
            <Text style={styles.navLabel}>REFRESH DATA</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[styles.logoutContainer, { paddingBottom: insets.bottom + spacing.base }]}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut
              ? <ActivityIndicator size="small" color={colors.brandRed} />
              : <LogOut size={20} color={colors.brandRed} />
            }
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,26,29,0.6)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    flexDirection: 'column',
  },
  panelHeader: {
    backgroundColor: colors.brandBlack,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitleMain: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    color: colors.brandRed,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  panelTitleSub: {
    fontFamily: fonts.sansLight,
    fontSize: 8,
    color: colors.brandPlatinum,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  userInfo: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xl,
    color: colors.white,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  userEmail: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize['2xs'],
    color: colors.brandBlack + '66',
  },
  nav: {
    flex: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.xl,
  },
  navLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    letterSpacing: 1,
  },
  logoutContainer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.brandPlatinum,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.xl,
  },
  logoutText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandRed,
    letterSpacing: 1,
  },
});
