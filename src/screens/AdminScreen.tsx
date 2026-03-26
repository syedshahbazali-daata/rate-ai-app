import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  LogOut,
  Trash2,
  Plus,
  Edit2,
  UploadCloud,
  Layers,
  FolderTree,
  ClipboardList,
  Users,
  Save,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { AppUser, PricingData, Category, TaskGroup, Task } from '../types';
import {
  db,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  deleteAuthUser,
  createOrLinkUser,
} from '../firebase';

type AdminTab = 'categories' | 'task_groups' | 'tasks' | 'users';

interface AdminScreenProps {
  pricingData: PricingData;
  users: AppUser[];
  onLogout: () => void;
  isLoggingOut: boolean;
  onSyncData: () => Promise<void>;
}

// ─── Save Button ──────────────────────────────────────────────────────────────
function SaveButton({ label, onPress, isSubmitting }: { label: string; onPress: () => void; isSubmitting?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
      onPress={onPress}
      disabled={isSubmitting}
      activeOpacity={0.85}
    >
      {isSubmitting ? (
        <>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.saveBtnText}>SAVING...</Text>
        </>
      ) : (
        <>
          <Save size={16} color={colors.white} />
          <Text style={styles.saveBtnText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.brandBlack + '44'}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical={multiline ? 'top' : 'auto'}
      />
    </View>
  );
}

// ─── Category Form ────────────────────────────────────────────────────────────
function CategoryForm({
  initialData,
  onSave,
  isSubmitting,
}: {
  initialData?: any;
  onSave: (data: Category) => void;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [prefix, setPrefix] = useState(initialData?.prefix || '');

  return (
    <View style={styles.formBody}>
      <Field label="CATEGORY NAME" value={name} onChangeText={setName} placeholder="e.g., EA - Light Switch Repair" />
      <Field label="PREFIX" value={prefix} onChangeText={setPrefix} placeholder="e.g., EA" />
      <SaveButton
        label="SAVE CATEGORY"
        isSubmitting={isSubmitting}
        onPress={() => onSave({ name, prefix, task_groups: initialData?.task_groups || [] })}
      />
    </View>
  );
}

// ─── Task Group Form ──────────────────────────────────────────────────────────
function TaskGroupForm({
  initialData,
  onSave,
  isSubmitting,
}: {
  initialData?: any;
  onSave: (data: TaskGroup) => void;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState(initialData?.name?.join(' ') || '');

  return (
    <View style={styles.formBody}>
      <Field label="GROUP NAME" value={name} onChangeText={setName} placeholder="e.g., Circuit Breakers" />
      <SaveButton
        label="SAVE GROUP"
        isSubmitting={isSubmitting}
        onPress={() =>
          onSave({
            name: name.split(' '),
            levels: initialData?.levels || [
              { id: 1, level_number: 1, custom_level_name: 'Standard', prefix: 'STD', tasks: [] },
              { id: 2, level_number: 2, custom_level_name: 'Premium', prefix: 'PRM', tasks: [] },
            ],
            task_list: initialData?.task_list || [],
          })
        }
      />
    </View>
  );
}

// ─── Task Form ────────────────────────────────────────────────────────────────
function TaskForm({
  initialData,
  onSave,
  isSubmitting,
}: {
  initialData?: any;
  onSave: (data: Task) => void;
  isSubmitting?: boolean;
}) {
  const [taskName, setTaskName] = useState(initialData?.task_name || '');
  const [taskCode, setTaskCode] = useState(initialData?.task_code || '');
  const [price, setPrice] = useState(String(initialData?.price || ''));
  const [description, setDescription] = useState(initialData?.task_description || '');

  return (
    <View style={styles.formBody}>
      <Field label="TASK NAME" value={taskName} onChangeText={setTaskName} placeholder="e.g., Replace Main Breaker" />
      <View style={styles.row2}>
        <View style={styles.flex1}>
          <Field label="TASK CODE" value={taskCode} onChangeText={setTaskCode} placeholder="e.g., EA1A" />
        </View>
        <View style={styles.flex1}>
          <Field label="PRICE ($)" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
        </View>
      </View>
      <Field label="DESCRIPTION" value={description} onChangeText={setDescription} placeholder="Task details..." multiline />
      <SaveButton
        label="SAVE TASK"
        isSubmitting={isSubmitting}
        onPress={() =>
          onSave({
            ...initialData,
            task_name: taskName,
            task_code: taskCode,
            price: Number(price) || 0,
            task_description: description,
            tier: initialData?.tier || 'Standard',
            warranty: initialData?.warranty || '1 Year',
            service_level: initialData?.service_level || 'Professional',
            estimated_time: initialData?.estimated_time || '1-2 Hours',
            custom_handbook: initialData?.custom_handbook || '',
            base_material_cost: initialData?.base_material_cost || '0',
            payment_plan_price: initialData?.payment_plan_price || (Number(price) / 12),
            service_agreement_price: initialData?.service_agreement_price || (Number(price) * 0.9),
          })
        }
      />
    </View>
  );
}

// ─── User Form ────────────────────────────────────────────────────────────────
function UserForm({
  onSave,
  isSubmitting,
}: {
  onSave: (data: AppUser) => void;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Technician' | 'General User'>('Technician');

  return (
    <View style={styles.formBody}>
      <Field label="FULL NAME" value={name} onChangeText={setName} placeholder="John Doe" />
      <Field label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="john@a-team.com" keyboardType="email-address" />
      <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>ROLE</Text>
        <View style={styles.roleRow}>
          {(['Technician', 'General User'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>{r.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <SaveButton
        label="ADD USER"
        isSubmitting={isSubmitting}
        onPress={() => onSave({ name, email, password, role })}
      />
    </View>
  );
}

// ─── Main AdminScreen ─────────────────────────────────────────────────────────
export default function AdminScreen({
  pricingData,
  users,
  onLogout,
  isLoggingOut,
  onSyncData,
}: AdminScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTab>('categories');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Filter indices for task_groups / tasks tabs
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [selectedLevelIdx, setSelectedLevelIdx] = useState(0);

  const closeModal = () => {
    setIsAdding(false);
    setEditingItem(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const modalTitle = isAdding
    ? `Add New ${activeTab.replace('_', ' ').replace(/s$/, '')}`
    : `Edit ${activeTab.replace('_', ' ').replace(/s$/, '')}`;

  // ── Sync ────────────────────────────────────────────────────────────────────
  const handleSyncData = () => {
    Alert.alert(
      'Sync Data',
      'This will reload all categories from Firebase. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            setIsSyncing(true);
            setSyncMessage(null);
            try {
              await onSyncData();
              setSyncMessage('Data synced successfully.');
              setTimeout(() => setSyncMessage(null), 3000);
            } catch {
              setSyncMessage('Sync failed. Check your connection.');
              setTimeout(() => setSyncMessage(null), 3000);
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  // ── Categories ──────────────────────────────────────────────────────────────
  const handleSaveCategory = async (category: Category) => {
    setIsSubmitting(true);
    try {
      if (editingItem?.id) {
        const { id, ...data } = category as any;
        await updateDoc(doc(db, 'categories', editingItem.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(collection(db, 'categories')), {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      closeModal();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'categories', id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // ── Task Groups ─────────────────────────────────────────────────────────────
  const handleSaveTaskGroup = async (group: TaskGroup) => {
    const category = pricingData.categories[selectedCategoryIdx];
    if (!category?.id) return;
    setIsSubmitting(true);
    try {
      const newGroups = [...category.task_groups];
      if (editingItem?.index !== undefined) {
        newGroups[editingItem.index] = group;
      } else {
        newGroups.push(group);
      }
      await updateDoc(doc(db, 'categories', category.id), { task_groups: newGroups });
      closeModal();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTaskGroup = (groupIdx: number) => {
    Alert.alert('Delete Task Group', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const category = pricingData.categories[selectedCategoryIdx];
          if (!category?.id) return;
          const newGroups = [...category.task_groups];
          newGroups.splice(groupIdx, 1);
          try {
            await updateDoc(doc(db, 'categories', category.id), { task_groups: newGroups });
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // ── Tasks ───────────────────────────────────────────────────────────────────
  const handleSaveTask = async (task: Task) => {
    const category = pricingData.categories[selectedCategoryIdx];
    if (!category?.id) return;
    setIsSubmitting(true);
    try {
      const newGroups = JSON.parse(JSON.stringify(category.task_groups));
      const level = newGroups[selectedGroupIdx]?.levels[selectedLevelIdx];
      if (!level) return;
      if (editingItem?.index !== undefined) {
        level.tasks[editingItem.index] = task;
      } else {
        level.tasks.push(task);
      }
      await updateDoc(doc(db, 'categories', category.id), { task_groups: newGroups });
      closeModal();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = (taskIdx: number) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const category = pricingData.categories[selectedCategoryIdx];
          if (!category?.id) return;
          const newGroups = JSON.parse(JSON.stringify(category.task_groups));
          newGroups[selectedGroupIdx]?.levels[selectedLevelIdx]?.tasks.splice(taskIdx, 1);
          try {
            await updateDoc(doc(db, 'categories', category.id), { task_groups: newGroups });
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // ── Users ───────────────────────────────────────────────────────────────────
  const handleSaveUser = async (user: AppUser) => {
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);
    try {
      if (!user.password) {
        setFormError('Password is required.');
        return;
      }
      const result = await createOrLinkUser(user.name, user.email!, user.password, user.role || 'Technician');
      if (result.status === 'exists') {
        setFormError('This email already exists in both auth and the database.');
        return;
      }
      setFormSuccess(result.status === 'linked' ? 'User linked successfully.' : 'User created successfully.');
      setTimeout(closeModal, 1500);
    } catch (e: any) {
      // Fallback without Cloud Function
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('../firebase');
        const { initializeApp } = await import('firebase/app');
        // Create user with secondary app instance to avoid signing out current admin
        const secondaryApp = initializeApp(
          { apiKey: 'AIzaSyAXI8jFegj8rGK_rQ5xVZaSGajjQli3n0I', authDomain: 'gen-lang-client-0799600946.firebaseapp.com', projectId: 'gen-lang-client-0799600946' },
          `secondary-${Date.now()}`
        );
        const { getAuth } = await import('firebase/auth');
        const { deleteApp } = await import('firebase/app');
        const secAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(secAuth, user.email!, user.password!);
        await deleteApp(secondaryApp);
        const { password, ...userData } = user;
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...userData,
          uid: cred.user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setFormSuccess('User created successfully.');
        setTimeout(closeModal, 1500);
      } catch (fallback: any) {
        const code = fallback?.code as string;
        if (code === 'auth/email-already-in-use') {
          setFormError('Email already in use. Deploy the Cloud Function to link it.');
        } else if (code === 'auth/weak-password') {
          setFormError('Password must be at least 6 characters.');
        } else {
          setFormError(fallback?.message || 'Failed to create user.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user: AppUser) => {
    Alert.alert('Delete User', `Delete ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user.uid) return;
          try {
            await deleteDoc(doc(db, 'users', user.uid));
            try { await deleteAuthUser(user.uid); } catch { /* needs Cloud Function */ }
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // ── Current data shortcuts ──────────────────────────────────────────────────
  const currentCategory = pricingData.categories[selectedCategoryIdx];
  const currentGroup = currentCategory?.task_groups[selectedGroupIdx];
  const currentLevel = currentGroup?.levels[selectedLevelIdx];

  // ── Tab content ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      // ── CATEGORIES ──────────────────────────────────────────────────────────
      case 'categories':
        return (
          <FlatList
            data={pricingData.categories}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Categories</Text>
                <TouchableOpacity style={styles.addRoundBtn} onPress={() => { setEditingItem(null); setIsAdding(true); }}>
                  <Plus size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item: cat }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{cat.name}</Text>
                  <Text style={styles.itemSub}>{cat.prefix}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingItem(cat); setIsAdding(false); }}>
                    <Edit2 size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteCategory(cat.id!)}>
                    <Trash2 size={16} color={colors.brandRed} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        );

      // ── TASK GROUPS ──────────────────────────────────────────────────────────
      case 'task_groups':
        return (
          <FlatList
            data={currentCategory?.task_groups ?? []}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Task Groups</Text>
                </View>
                <View style={styles.filterBlock}>
                  <Text style={styles.filterLabel}>FILTER BY CATEGORY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {pricingData.categories.map((cat, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.chip, selectedCategoryIdx === idx && styles.chipActive]}
                        onPress={() => { setSelectedCategoryIdx(idx); setSelectedGroupIdx(0); }}
                      >
                        <Text style={[styles.chipText, selectedCategoryIdx === idx && styles.chipTextActive]}>{cat.prefix}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <TouchableOpacity style={styles.addFullBtn} onPress={() => { setEditingItem(null); setIsAdding(true); }}>
                  <Plus size={18} color={colors.white} />
                  <Text style={styles.addFullBtnText}>ADD TASK GROUP</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item: group, index }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{group.name.join(' ')}</Text>
                  <Text style={styles.itemSub}>{group.levels.length} Level{group.levels.length !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingItem({ ...group, index }); setIsAdding(false); }}>
                    <Edit2 size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteTaskGroup(index)}>
                    <Trash2 size={16} color={colors.brandRed} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        );

      // ── TASKS ────────────────────────────────────────────────────────────────
      case 'tasks':
        return (
          <FlatList
            data={currentLevel?.tasks ?? []}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Tasks</Text>
                </View>
                {/* Category + Group filters */}
                <View style={styles.filterBlock}>
                  <Text style={styles.filterLabel}>CATEGORY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {pricingData.categories.map((cat, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.chip, selectedCategoryIdx === idx && styles.chipActive]}
                        onPress={() => { setSelectedCategoryIdx(idx); setSelectedGroupIdx(0); setSelectedLevelIdx(0); }}
                      >
                        <Text style={[styles.chipText, selectedCategoryIdx === idx && styles.chipTextActive]}>{cat.prefix}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={[styles.filterLabel, { marginTop: spacing.sm }]}>GROUP</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {currentCategory?.task_groups.map((g, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.chip, selectedGroupIdx === idx && styles.chipActive]}
                        onPress={() => { setSelectedGroupIdx(idx); setSelectedLevelIdx(0); }}
                      >
                        <Text style={[styles.chipText, selectedGroupIdx === idx && styles.chipTextActive]} numberOfLines={1}>
                          {g.name[0]?.slice(0, 12)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={[styles.filterLabel, { marginTop: spacing.sm }]}>LEVEL</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {currentGroup?.levels.map((level, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.chip, selectedLevelIdx === idx && styles.chipActive]}
                        onPress={() => setSelectedLevelIdx(idx)}
                      >
                        <Text style={[styles.chipText, selectedLevelIdx === idx && styles.chipTextActive]}>{level.custom_level_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <TouchableOpacity style={styles.addFullBtn} onPress={() => { setEditingItem(null); setIsAdding(true); }}>
                  <Plus size={18} color={colors.white} />
                  <Text style={styles.addFullBtnText}>ADD TASK</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item: task, index }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{task.task_name}</Text>
                  <Text style={styles.itemSub}>{task.task_code} • ${task.price}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingItem({ ...task, index }); setIsAdding(false); }}>
                    <Edit2 size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteTask(index)}>
                    <Trash2 size={16} color={colors.brandRed} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        );

      // ── USERS ────────────────────────────────────────────────────────────────
      case 'users':
        return (
          <FlatList
            data={users}
            keyExtractor={(u) => u.uid || u.email}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Users</Text>
                <TouchableOpacity style={styles.addRoundBtn} onPress={() => { setEditingItem(null); setIsAdding(true); }}>
                  <Plus size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item: u }) => (
              <View style={styles.itemCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{u.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{u.name}</Text>
                  <Text style={styles.itemSub}>{u.email}</Text>
                  <View style={[
                    styles.roleBadge,
                    u.role === 'Admin' ? styles.roleBadgeAdmin : u.role === 'Technician' ? styles.roleBadgeTech : styles.roleBadgeGeneral,
                  ]}>
                    <Text style={[
                      styles.roleBadgeText,
                      u.role === 'Admin' ? styles.roleBadgeTextAdmin : u.role === 'Technician' ? styles.roleBadgeTextTech : styles.roleBadgeTextGeneral,
                    ]}>
                      {u.role || 'General User'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(u)}>
                  <Trash2 size={16} color={colors.brandRed} />
                </TouchableOpacity>
              </View>
            )}
          />
        );
    }
  };

  const tabs: { id: AdminTab; label: string; Icon: any }[] = [
    { id: 'categories', label: 'Categories', Icon: Layers },
    { id: 'task_groups', label: 'Groups', Icon: FolderTree },
    { id: 'tasks', label: 'Tasks', Icon: ClipboardList },
    { id: 'users', label: 'Users', Icon: Users },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={onLogout} disabled={isLoggingOut}>
          {isLoggingOut
            ? <ActivityIndicator size="small" color={colors.white} />
            : <LogOut size={22} color={colors.white} />
          }
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADMIN PANEL</Text>
        <TouchableOpacity style={styles.syncBtn} onPress={handleSyncData} disabled={isSyncing}>
          {isSyncing
            ? <ActivityIndicator size="small" color={colors.white} />
            : <UploadCloud size={16} color={colors.white} />
          }
          <Text style={styles.syncBtnText}>{isSyncing ? 'SYNCING…' : 'SYNC'}</Text>
        </TouchableOpacity>
      </View>

      {/* Sync message */}
      {!!syncMessage && (
        <View style={[styles.syncBanner, syncMessage.includes('fail') && styles.syncBannerError]}>
          <Text style={[styles.syncBannerText, syncMessage.includes('fail') && styles.syncBannerTextError]}>
            {syncMessage}
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(id)}
            >
              <Icon size={18} color={active ? colors.brandRed : colors.brandBlack + '66'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Modal */}
      <Modal visible={isAdding || !!editingItem} transparent animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {!!formError && (
                <View style={styles.formAlert}>
                  <Text style={styles.formAlertText}>{formError}</Text>
                </View>
              )}
              {!!formSuccess && (
                <View style={styles.formAlertSuccess}>
                  <Text style={styles.formAlertSuccessText}>{formSuccess}</Text>
                </View>
              )}

              {activeTab === 'categories' && (
                <CategoryForm initialData={editingItem} onSave={handleSaveCategory} isSubmitting={isSubmitting} />
              )}
              {activeTab === 'task_groups' && (
                <TaskGroupForm initialData={editingItem} onSave={handleSaveTaskGroup} isSubmitting={isSubmitting} />
              )}
              {activeTab === 'tasks' && (
                <TaskForm initialData={editingItem} onSave={handleSaveTask} isSubmitting={isSubmitting} />
              )}
              {activeTab === 'users' && (
                <UserForm onSave={handleSaveUser} isSubmitting={isSubmitting} />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brandPlatinum },

  // Header
  header: {
    backgroundColor: colors.brandBlack,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  headerIconBtn: { padding: spacing.sm },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.white,
    letterSpacing: 1,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  syncBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.white,
    letterSpacing: 1,
  },

  // Sync banner
  syncBanner: {
    backgroundColor: '#dcfce7',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  syncBannerError: { backgroundColor: '#fee2e2' },
  syncBannerText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: '#15803d',
    textAlign: 'center',
  },
  syncBannerTextError: { color: '#b91c1c' },

  // Tabs
  tabBar: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.brandRed },
  tabText: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '66',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabTextActive: { color: colors.brandRed },

  content: { flex: 1 },

  // List
  listContent: { padding: spacing.base, gap: spacing.sm },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  listTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.lg,
    color: colors.brandBlack,
  },
  addRoundBtn: {
    backgroundColor: colors.brandRed,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  addFullBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addFullBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.white,
    letterSpacing: 1,
  },

  // Item card
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  itemSub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemActions: { flexDirection: 'row', gap: spacing.sm },
  editBtn: {
    padding: spacing.sm,
    backgroundColor: '#eff6ff',
    borderRadius: radius.md,
  },
  deleteBtn: {
    padding: spacing.sm,
    backgroundColor: '#fff0f0',
    borderRadius: radius.md,
  },

  // Filter chips
  filterBlock: { marginBottom: spacing.sm },
  filterLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '66',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  chipRow: { flexGrow: 0 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.brandRed,
    borderColor: colors.brandRed,
  },
  chipText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '99',
  },
  chipTextActive: { color: colors.white },

  // User-specific
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.white,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roleBadgeAdmin: { backgroundColor: 'rgba(167,7,7,0.1)' },
  roleBadgeTech: { backgroundColor: '#eff6ff' },
  roleBadgeGeneral: { backgroundColor: '#f3f4f6' },
  roleBadgeText: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roleBadgeTextAdmin: { color: colors.brandRed },
  roleBadgeTextTech: { color: '#2563eb' },
  roleBadgeTextGeneral: { color: '#6b7280' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.base,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    backgroundColor: colors.brandBlack,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.white,
    textTransform: 'capitalize',
  },
  modalBody: { padding: spacing.base },

  // Form alerts
  formAlert: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  formAlertText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: '#b91c1c',
  },
  formAlertSuccess: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  formAlertSuccessText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: '#15803d',
  },

  // Form fields
  formBody: { gap: spacing.base, paddingBottom: spacing.xl },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '66',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  fieldInput: {
    backgroundColor: colors.brandPlatinum + '88',
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  fieldInputMulti: { height: 96 },
  row2: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },

  // Role selector in form
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  roleBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.brandPlatinum,
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: colors.brandRed, backgroundColor: 'rgba(167,7,7,0.05)' },
  roleBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    letterSpacing: 1,
  },
  roleBtnTextActive: { color: colors.brandRed },

  // Save button
  saveBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.white,
    letterSpacing: 1,
  },
});
