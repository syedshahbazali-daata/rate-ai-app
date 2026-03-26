import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Switch,
} from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { Category, TaskGroup, TaskLevel, Task, Screen, AppUser } from '../types';

interface TaskScreenProps {
  category: Category;
  taskGroup: TaskGroup;
  selectedLevel: TaskLevel;
  onLevelSelect: (level: TaskLevel) => void;
  onTaskSelect: (task: Task) => void;
  onBack: () => void;
  onCategories: () => void;
  onHome: () => void;
  isTechHandbookMode: boolean;
  onToggleTechHandbook: () => void;
  onContinueToPresentation: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function TaskScreen({
  category,
  taskGroup,
  selectedLevel,
  onLevelSelect,
  onTaskSelect,
  onBack,
  onCategories,
  onHome,
  isTechHandbookMode,
  onToggleTechHandbook,
  onContinueToPresentation,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: TaskScreenProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const reversedTasks = [...selectedLevel.tasks].reverse();

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={onHome}>
          <Text style={styles.breadcrumbLink}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}>&gt;</Text>
        <TouchableOpacity onPress={onCategories}>
          <Text style={styles.breadcrumbLink}>Electrical</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}>&gt;</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.breadcrumbLink}>{category.prefix}</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}>&gt;</Text>
        <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
          {taskGroup.name[0]}
        </Text>
      </View>

      {/* Task info header */}
      <View style={styles.taskInfoHeader}>
        <Text style={styles.taskRange}>
          TASKS {taskGroup.levels[0].prefix}-{taskGroup.levels[taskGroup.levels.length - 1].prefix}
        </Text>
        <Text style={styles.taskLevelName}>{selectedLevel.custom_level_name}</Text>
      </View>

      {/* Level tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {taskGroup.levels.map((level) => {
          const isActive = selectedLevel.id === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onLevelSelect(level)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {level.prefix} - Level {level.level_number}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <Text style={[styles.modeLabel, isTechHandbookMode && styles.modeLabelInactive]}>
          Customer{'\n'}Description
        </Text>
        <Switch
          value={isTechHandbookMode}
          onValueChange={onToggleTechHandbook}
          trackColor={{ false: colors.brandBlack, true: colors.brandBlack }}
          thumbColor={colors.white}
        />
        <Text style={[styles.modeLabel, !isTechHandbookMode && styles.modeLabelInactive]}>
          Tech{'\n'}Handbook
        </Text>
      </View>

      {/* Tasks */}
      <FlatList
        data={reversedTasks}
        keyExtractor={(_, index) => String(index)}
        style={[styles.taskList, isTechHandbookMode && styles.taskListHandbook]}
        contentContainerStyle={styles.taskListContent}
        ListHeaderComponent={
          !isTechHandbookMode ? (
            <View style={styles.cloneHeader}>
              <View style={styles.cloneIconBox}>
                <CheckCircle2 size={16} color={colors.brandRed} />
              </View>
              <Text style={styles.cloneText}>Clone and Edit this Menu</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footerBtn}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={onContinueToPresentation}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continue to Presentation</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: task }) =>
          isTechHandbookMode ? (
            <View style={styles.handbookItem}>
              <Text style={styles.handbookTitle}>{task.service_level}</Text>
              <View style={styles.handbookLines}>
                {task.custom_handbook.split('\n').map((line, i) => (
                  <View key={i} style={styles.handbookLine}>
                    <View style={styles.handbookBullet} />
                    <Text style={styles.handbookLineText}>{line}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.taskItem}
              onPress={() => onTaskSelect(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskItemRow}>
                <Text style={styles.taskServiceLevel}>
                  {task.service_level} - <Text style={styles.taskPrice}>${task.price}</Text>
                </Text>
                <Text style={styles.taskMeta}>
                  {task.task_code} - {task.estimated_time}h / SA ${task.service_agreement_price}
                </Text>
              </View>
              <Text style={styles.taskCodeName}>
                {task.task_code} {task.task_name}
              </Text>
              <View style={styles.taskHandbookLines}>
                {task.custom_handbook.split('\n').slice(0, 3).map((line, i) => (
                  <Text key={i} style={styles.taskHandbookLine}>{line}</Text>
                ))}
              </View>
            </TouchableOpacity>
          )
        }
      />

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
  taskInfoHeader: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    backgroundColor: colors.white,
    gap: 4,
  },
  taskRange: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '66',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  taskLevelName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.md,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  tabsScroll: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.brandRed,
  },
  tabText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  tabTextActive: {
    color: colors.brandRed,
  },
  modeToggle: {
    backgroundColor: colors.brandRed,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  modeLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: 11,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    opacity: 1,
  },
  modeLabelInactive: {
    opacity: 0.4,
  },
  taskList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  taskListHandbook: {
    backgroundColor: 'rgba(224,227,232,0.5)',
  },
  taskListContent: {
    paddingBottom: spacing.base,
  },
  cloneHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  cloneIconBox: {
    borderWidth: 2,
    borderColor: colors.brandRed,
    padding: 4,
    borderRadius: 4,
  },
  cloneText: {
    fontFamily: fonts.sansBlack,
    fontSize: 11,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  taskItem: {
    padding: spacing.base,
    borderBottomWidth: 2,
    borderBottomColor: colors.brandPlatinum,
    gap: spacing.sm,
  },
  taskItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  taskServiceLevel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.md,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    flex: 1,
  },
  taskPrice: {
    color: colors.brandRed,
  },
  taskMeta: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '44',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  taskCodeName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  taskHandbookLines: {
    gap: 4,
  },
  taskHandbookLine: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '99',
  },
  handbookItem: {
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  handbookTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandRed,
    paddingLeft: spacing.md,
  },
  handbookLines: {
    gap: 6,
  },
  handbookLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  handbookBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandRed,
    marginTop: 6,
    flexShrink: 0,
  },
  handbookLineText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.brandBlack + '99',
    flex: 1,
  },
  footerBtn: {
    // no padding — button stretches full width
  },
  continueBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: 0,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.lg,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
