import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize } from '../theme';
import { Category, TaskGroup, Screen, AppUser } from '../types';

interface TaskGroupScreenProps {
  category: Category;
  categories: Category[];
  onCategorySelect: (category: Category) => void;
  onSelect: (group: TaskGroup) => void;
  onBack: () => void;
  onHome: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

interface FlatItem {
  group: TaskGroup;
  levelIndex: number;
  overallIndex: number;
}

export default function TaskGroupScreen({
  category,
  categories,
  onCategorySelect,
  onSelect,
  onBack,
  onHome,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: TaskGroupScreenProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Flatten groups × levels for the right pane
  const flatItems: FlatItem[] = [];
  category.task_groups.forEach((group) => {
    group.levels.forEach((_, lIndex) => {
      flatItems.push({ group, levelIndex: lIndex, overallIndex: flatItems.length });
    });
  });

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={onHome}>
          <Text style={styles.breadcrumbLink}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}>&gt;</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.breadcrumbLink}>Electrical</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}>&gt;</Text>
        <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
          {category.name}
        </Text>
      </View>

      {/* Two-pane */}
      <View style={styles.listContainer}>
        {/* Sidebar: all categories */}
        <ScrollView style={styles.sidebar} showsVerticalScrollIndicator={false}>
          {categories.map((cat, idx) => {
            const isActive = cat.name === category.name;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.sidebarItem, isActive ? styles.sidebarItemActive : styles.sidebarItemInactive]}
                onPress={() => onCategorySelect(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sidebarItemText, !isActive && styles.sidebarItemTextInactive]}
                  numberOfLines={3}
                >
                  {cat.name}
                </Text>
                {isActive && <ChevronRight size={14} color={colors.white} style={{ flexShrink: 0, marginTop: 2 }} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Task groups list */}
        <FlatList
          data={flatItems}
          keyExtractor={(_, index) => String(index)}
          style={styles.rightPane}
          renderItem={({ item: { group, levelIndex, overallIndex } }) => {
            const level = group.levels[levelIndex];
            return (
              <TouchableOpacity
                style={[
                  styles.groupRow,
                  overallIndex % 2 === 0 ? styles.rowEven : styles.rowOdd,
                ]}
                onPress={() => onSelect(group)}
                activeOpacity={0.7}
              >
                <View style={styles.groupRowContent}>
                  <Text style={styles.groupName} numberOfLines={2}>
                    {group.name[levelIndex] ?? group.name[0]} - Level {level.level_number}
                  </Text>
                  <Text style={styles.groupPrefix}>{level.prefix}</Text>
                </View>
                <ChevronRight size={16} color={colors.brandBlack + '33'} />
              </TouchableOpacity>
            );
          }}
        />
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
  container: { flex: 1, backgroundColor: colors.brandPlatinum },
  breadcrumb: {
    backgroundColor: 'rgba(22,26,29,0.05)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22,26,29,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
  },
  breadcrumbLink: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize['2xs'],
    color: colors.brandBlack + '99',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  breadcrumbSep: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize['2xs'],
    color: colors.brandBlack + '66',
  },
  breadcrumbCurrent: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize['2xs'],
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  listContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.white,
  },
  sidebar: {
    width: '50%',
    backgroundColor: colors.brandRed,
  },
  sidebarItem: {
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sidebarItemActive: {
    backgroundColor: colors.brandRed,
  },
  sidebarItemInactive: {
    backgroundColor: 'rgba(167,7,7,0.4)',
  },
  sidebarItemText: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    lineHeight: 14,
    flex: 1,
    marginRight: 4,
  },
  sidebarItemTextInactive: {
    color: 'rgba(255,255,255,0.6)',
  },
  rightPane: {
    width: '50%',
    backgroundColor: colors.white,
  },
  groupRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowEven: { backgroundColor: colors.white },
  rowOdd: { backgroundColor: 'rgba(224,227,232,0.1)' },
  groupRowContent: {
    flex: 1,
    marginRight: spacing.sm,
    gap: 4,
  },
  groupName: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  groupPrefix: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '66',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
