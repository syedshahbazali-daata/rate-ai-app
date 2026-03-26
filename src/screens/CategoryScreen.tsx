import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize } from '../theme';
import { Category, Screen, AppUser } from '../types';

interface CategoryScreenProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function CategoryScreen({
  categories,
  onSelect,
  onBack,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: CategoryScreenProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.breadcrumbLink}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}>&gt;</Text>
        <Text style={styles.breadcrumbCurrent}>Electrical</Text>
      </View>

      {/* Two-pane list */}
      <View style={styles.listContainer}>
        {/* Red sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarInner}>
            <Text style={styles.sidebarLabel}>Electrical</Text>
            <ChevronRight size={16} color={colors.white} />
          </View>
        </View>

        {/* Categories */}
        <FlatList
          data={categories}
          keyExtractor={(_, index) => String(index)}
          style={styles.listContent}
          renderItem={({ item: category, index }) => (
            <TouchableOpacity
              style={[
                styles.categoryRow,
                index % 2 === 0 ? styles.rowEven : styles.rowOdd,
              ]}
              onPress={() => onSelect(category)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryName} numberOfLines={2}>
                {category.name}
              </Text>
              <ChevronRight size={16} color={colors.brandBlack + '33'} />
            </TouchableOpacity>
          )}
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
  },
  listContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.white,
  },
  sidebar: {
    width: '33%',
    backgroundColor: colors.brandRed,
  },
  sidebarInner: {
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sidebarLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    flex: 1,
    marginTop: spacing.sm,
  },
  listContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
  categoryRow: {
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
  categoryName: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: spacing.sm,
  },
});
