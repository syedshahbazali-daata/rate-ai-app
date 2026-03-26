import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize, radius, getTierConfig } from '../theme';
import { TaskLevel, Screen, AppUser } from '../types';

interface PresentationScreenProps {
  level: TaskLevel;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function PresentationScreen({
  level,
  onBack,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: PresentationScreenProps) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sortedTasks = [...level.tasks].sort((a, b) => b.tier.localeCompare(a.tier));

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />

      {/* Sub-header */}
      <View style={styles.subHeader}>
        <View style={styles.subHeaderIcon}>
          <View style={styles.subHeaderIconInner} />
        </View>
        <Text style={styles.subHeaderTitle}>Choose an option for {level.prefix}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sortedTasks.map((task) => {
          const tierCfg = getTierConfig(task.tier);
          const isE = task.tier.toUpperCase() === 'E';
          return (
            <View
              key={task.task_code}
              style={[styles.card, { backgroundColor: tierCfg.bg }]}
            >
              {/* Left color bar */}
              <View style={[styles.colorBar, { backgroundColor: tierCfg.bar }]} />

              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={styles.serviceLevelRow}>
                    {isE && (
                      <CheckCircle2 size={24} color={tierCfg.bar} fill={tierCfg.bar} />
                    )}
                    <Text style={styles.serviceLevel}>{task.service_level}</Text>
                  </View>

                  <Text style={styles.taskCodeName}>
                    {task.task_code} {task.task_name}
                  </Text>

                  <View style={styles.descriptionLines}>
                    {task.task_description.split('\n').map((line, i) => (
                      <Text key={i} style={styles.descriptionLine}>{line}</Text>
                    ))}
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <View style={styles.priceBox}>
                    <Text style={styles.price}>${task.price}</Text>
                  </View>
                  <Text style={styles.warranty}>{task.warranty}</Text>
                </View>
              </View>
            </View>
          );
        })}
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
  subHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subHeaderIcon: {
    backgroundColor: colors.brandBlack,
    padding: 6,
    borderRadius: 2,
  },
  subHeaderIconInner: {
    borderWidth: 1,
    borderColor: colors.white,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    flex: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    gap: 0,
  },
  card: {
    borderRadius: 0,
    overflow: 'hidden',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
  },
  colorBar: {
    width: 8,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardLeft: {
    flex: 1,
    gap: spacing.sm,
  },
  serviceLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceLevel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  taskCodeName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  descriptionLines: {
    gap: 4,
  },
  descriptionLine: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack + 'cc',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    minWidth: 100,
  },
  priceBox: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
  },
  price: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xl,
    color: colors.brandBlack,
    letterSpacing: -0.5,
  },
  warranty: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '99',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'right',
  },
});
