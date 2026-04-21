import React, { useState, useEffect } from 'react';
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
  Settings,
  RotateCcw,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import {
  useAppTheme,
  PRIMARY_SWATCHES,
  TIER_SWATCHES,
  hexToLightBg,
  hexToDarkText,
} from '../context/AppTheme';
import { ColorPicker } from '../components/ColorPicker';
import { AppUser, PricingData, Category, TaskGroup, Task } from '../types';
import {
  db,
  auth,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  deleteAuthUser,
  createOrLinkUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
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

// ─── Dropdown Picker ──────────────────────────────────────────────────────────
function DropdownPicker({
  label,
  selectedLabel,
  options,
  onSelect,
  placeholder,
}: {
  label: string;
  selectedLabel: string;
  options: { label: string; index: number }[];
  onSelect: (index: number) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const hasValue = !!selectedLabel;

  return (
    <View style={styles.dropdownWrap}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text
          style={[styles.dropdownTriggerText, !hasValue && styles.dropdownTriggerPlaceholder]}
          numberOfLines={1}
        >
          {hasValue ? selectedLabel : (placeholder || `Select ${label}…`)}
        </Text>
        <ChevronDown size={16} color={colors.brandBlack + '88'} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownSheetHeader}>
              <Text style={styles.dropdownSheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const active = opt.label === selectedLabel;
                return (
                  <TouchableOpacity
                    key={opt.index}
                    style={[styles.dropdownOption, active && styles.dropdownOptionActive]}
                    onPress={() => { onSelect(opt.index); setOpen(false); }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.dropdownOptionText, active && styles.dropdownOptionTextActive]}
                      numberOfLines={2}
                    >
                      {opt.label}
                    </Text>
                    {active && <Check size={16} color={colors.white} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  const [levelCount, setLevelCount] = useState<number>(initialData?.levels?.length || 3);

  return (
    <View style={styles.formBody}>
      <Field label="GROUP NAME" value={name} onChangeText={setName} placeholder="e.g., Light Switch Repair or Replace" />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>NUMBER OF LEVELS</Text>
        <View style={styles.levelCountRow}>
          <TouchableOpacity
            style={styles.levelCountBtn}
            onPress={() => setLevelCount((n) => Math.max(1, n - 1))}
            activeOpacity={0.75}
          >
            <Text style={styles.levelCountBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.levelCountDisplay}>
            <Text style={styles.levelCountNum}>{levelCount}</Text>
            <Text style={styles.levelCountLabel}>Level{levelCount !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.levelCountBtn}
            onPress={() => setLevelCount((n) => Math.min(20, n + 1))}
            activeOpacity={0.75}
          >
            <Text style={styles.levelCountBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {!!name.trim() && (
          <View style={styles.levelPreview}>
            {Array.from({ length: Math.min(levelCount, 3) }, (_, i) => (
              <Text key={i} style={styles.levelPreviewText} numberOfLines={1}>
                {`${name.trim()} - Level ${i + 1}`}
              </Text>
            ))}
            {levelCount > 3 && (
              <Text style={styles.levelPreviewMore}>…and {levelCount - 3} more</Text>
            )}
          </View>
        )}
      </View>

      <SaveButton
        label="SAVE GROUP"
        isSubmitting={isSubmitting}
        onPress={() => {
          const levels = Array.from({ length: levelCount }, (_, i) => {
            const levelName = `${name.trim()} - Level ${i + 1}`;
            const existing = initialData?.levels?.[i];
            // Preserve existing tasks if level count is being adjusted
            return {
              id: i + 1,
              level_number: i + 1,
              custom_level_name: levelName,
              prefix: `L${i + 1}`,
              tasks: existing?.tasks || [],
            };
          });
          onSave({ name: name.trim().split(' '), levels, task_list: initialData?.task_list || [] });
        }}
      />
    </View>
  );
}

// ─── Task Form ────────────────────────────────────────────────────────────────
function TaskForm({
  initialData,
  onSave,
  isSubmitting,
  levelName,
}: {
  initialData?: any;
  onSave: (data: Task) => void;
  isSubmitting?: boolean;
  levelName?: string;
}) {
  const [taskName,             setTaskName]             = useState(initialData?.task_name             || '');
  const [taskCode,             setTaskCode]             = useState(initialData?.task_code             || '');
  const [serviceLevel,         setServiceLevel]         = useState(initialData?.service_level         || '');
  const [price,                setPrice]                = useState(String(initialData?.price          ?? ''));
  const [baseMaterialCost,     setBaseMaterialCost]     = useState(initialData?.base_material_cost    || '');
  const [paymentPlanPrice,     setPaymentPlanPrice]     = useState(String(initialData?.payment_plan_price     ?? ''));
  const [serviceAgreementPrice,setServiceAgreementPrice]= useState(String(initialData?.service_agreement_price ?? ''));
  const [warranty,             setWarranty]             = useState(initialData?.warranty              || '');
  const [estimatedTime,        setEstimatedTime]        = useState(initialData?.estimated_time        || '');
  const [description,          setDescription]          = useState(initialData?.task_description      || '');
  const [customHandbook,       setCustomHandbook]       = useState(initialData?.custom_handbook       || '');

  return (
    <View style={styles.formBody}>
      {/* Level badge */}
      {!!levelName && (
        <View style={styles.levelBadgeRow}>
          <Text style={styles.levelBadgeLabel}>LEVEL</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{levelName}</Text>
          </View>
        </View>
      )}

      {/* ── Identity ──────────────────────────────────────────────────── */}
      <Text style={styles.formSectionLabel}>TASK IDENTITY</Text>
      <Field label="TASK NAME" value={taskName} onChangeText={setTaskName} placeholder="e.g., Replace Main Breaker" />
      <View style={styles.row2}>
        <View style={styles.flex1}>
          <Field label="TASK CODE" value={taskCode} onChangeText={setTaskCode} placeholder="e.g., EA1A" />
        </View>
        <View style={styles.flex1}>
          <Field label="SERVICE LEVEL" value={serviceLevel} onChangeText={setServiceLevel} placeholder="e.g., Professional" />
        </View>
      </View>
      <View style={styles.row2}>
        <View style={styles.flex1}>
          <Field label="ESTIMATED TIME" value={estimatedTime} onChangeText={setEstimatedTime} placeholder="e.g., 1-2 Hours" />
        </View>
        <View style={styles.flex1}>
          <Field label="WARRANTY" value={warranty} onChangeText={setWarranty} placeholder="e.g., 1 Year" />
        </View>
      </View>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <Text style={styles.formSectionLabel}>PRICING</Text>
      <View style={styles.row2}>
        <View style={styles.flex1}>
          <Field label="PRICE ($)" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="numeric" />
        </View>
        <View style={styles.flex1}>
          <Field label="BASE MATERIAL COST ($)" value={baseMaterialCost} onChangeText={setBaseMaterialCost} placeholder="0.00" keyboardType="numeric" />
        </View>
      </View>
      <View style={styles.row2}>
        <View style={styles.flex1}>
          <Field label="PAYMENT PLAN ($)" value={paymentPlanPrice} onChangeText={setPaymentPlanPrice} placeholder="0.00" keyboardType="numeric" />
        </View>
        <View style={styles.flex1}>
          <Field label="SERVICE AGREEMENT ($)" value={serviceAgreementPrice} onChangeText={setServiceAgreementPrice} placeholder="0.00" keyboardType="numeric" />
        </View>
      </View>

      {/* ── Description ───────────────────────────────────────────────── */}
      <Text style={styles.formSectionLabel}>DESCRIPTION</Text>
      <Field label="TASK DESCRIPTION" value={description} onChangeText={setDescription} placeholder="Detailed task description..." multiline />
      <Field label="CUSTOM HANDBOOK" value={customHandbook} onChangeText={setCustomHandbook} placeholder="Handbook / special notes..." multiline />

      <SaveButton
        label="SAVE TASK"
        isSubmitting={isSubmitting}
        onPress={() =>
          onSave({
            tier:                    levelName || initialData?.tier || '',
            task_name:               taskName,
            task_code:               taskCode,
            service_level:           serviceLevel,
            price:                   Number(price) || 0,
            base_material_cost:      baseMaterialCost,
            payment_plan_price:      Number(paymentPlanPrice) || 0,
            service_agreement_price: Number(serviceAgreementPrice) || 0,
            warranty,
            estimated_time:          estimatedTime,
            task_description:        description,
            custom_handbook:         customHandbook,
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
  const { theme, setPrimary, setTierColor, resetToDefault } = useAppTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('categories');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [sitePassword, setSitePassword] = useState('');
  const [sitePasswordSaving, setSitePasswordSaving] = useState(false);
  const [adminCurrentPw, setAdminCurrentPw] = useState('');
  const [adminNewPw, setAdminNewPw] = useState('');
  const [adminConfirmPw, setAdminConfirmPw] = useState('');
  const [adminPwSaving, setAdminPwSaving] = useState(false);
  const [adminPwError, setAdminPwError] = useState<string | null>(null);
  const [adminPwSuccess, setAdminPwSuccess] = useState(false);
  const [showSitePw, setShowSitePw] = useState(false);
  const [showAdminCurrentPw, setShowAdminCurrentPw] = useState(false);
  const [showAdminNewPw, setShowAdminNewPw] = useState(false);
  const [showAdminConfirmPw, setShowAdminConfirmPw] = useState(false);

  useEffect(() => {
    if (!isSettingsOpen) return;
    getDoc(doc(db, 'settings', 'site')).then((snap) => {
      if (snap.exists()) {
        setSitePassword(snap.data().password || '');
      } else {
        // First time — seed the default password
        setDoc(doc(db, 'settings', 'site'), { password: 'rate123' }).catch(() => {});
        setSitePassword('rate123');
      }
    }).catch(() => {});
  }, [isSettingsOpen]);

  async function saveSitePassword() {
    if (!sitePassword.trim()) return;
    setSitePasswordSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), { password: sitePassword.trim() });
    } catch {
      Alert.alert('Error', 'Failed to save site password.');
    } finally {
      setSitePasswordSaving(false);
    }
  }

  async function changeAdminPassword() {
    setAdminPwError(null);
    setAdminPwSuccess(false);
    if (!adminCurrentPw || !adminNewPw || !adminConfirmPw) {
      setAdminPwError('All fields are required.');
      return;
    }
    if (adminNewPw !== adminConfirmPw) {
      setAdminPwError('New passwords do not match.');
      return;
    }
    if (adminNewPw.length < 6) {
      setAdminPwError('New password must be at least 6 characters.');
      return;
    }
    const user = auth.currentUser;
    if (!user || !user.email) {
      setAdminPwError('No authenticated admin user found.');
      return;
    }
    setAdminPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, adminCurrentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, adminNewPw);
      setAdminCurrentPw('');
      setAdminNewPw('');
      setAdminConfirmPw('');
      setAdminPwSuccess(true);
      setTimeout(() => setAdminPwSuccess(false), 4000);
    } catch (e: any) {
      if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
        setAdminPwError('Current password is incorrect.');
      } else {
        setAdminPwError('Failed to update password. Try again.');
      }
    } finally {
      setAdminPwSaving(false);
    }
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

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
    showConfirm('Delete Category', 'Are you sure you want to delete this category? This cannot be undone.', async () => {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    });
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
    showConfirm('Delete Task Group', 'Are you sure you want to delete this task group? This cannot be undone.', async () => {
      const category = pricingData.categories[selectedCategoryIdx];
      if (!category?.id) return;
      const newGroups = [...category.task_groups];
      newGroups.splice(groupIdx, 1);
      try {
        await updateDoc(doc(db, 'categories', category.id), { task_groups: newGroups });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    });
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
    showConfirm('Delete Task', 'Are you sure you want to delete this task? This cannot be undone.', async () => {
      const category = pricingData.categories[selectedCategoryIdx];
      if (!category?.id) return;
      const newGroups = JSON.parse(JSON.stringify(category.task_groups));
      newGroups[selectedGroupIdx]?.levels[selectedLevelIdx]?.tasks.splice(taskIdx, 1);
      try {
        await updateDoc(doc(db, 'categories', category.id), { task_groups: newGroups });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    });
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
      // Fallback without Cloud Function — use a secondary app to avoid signing out admin
      try {
        const {
          initializeAuth,
          inMemoryPersistence,
          createUserWithEmailAndPassword,
          signInWithEmailAndPassword: signInSecondary,
        } = await import('firebase/auth');
        const { initializeApp, deleteApp } = await import('firebase/app');

        const secondaryApp = initializeApp(
          {
            apiKey: 'AIzaSyAXI8jFegj8rGK_rQ5xVZaSGajjQli3n0I',
            authDomain: 'gen-lang-client-0799600946.firebaseapp.com',
            projectId: 'gen-lang-client-0799600946',
          },
          `secondary-${Date.now()}`
        );
        // Use inMemoryPersistence to suppress AsyncStorage warning on temp app
        const secAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });

        let uid: string;
        try {
          // Try creating the account first
          const cred = await createUserWithEmailAndPassword(secAuth, user.email!, user.password!);
          uid = cred.user.uid;
        } catch (createErr: any) {
          if (createErr?.code === 'auth/email-already-in-use') {
            // Account exists — sign in to get the existing UID
            const cred = await signInSecondary(secAuth, user.email!, user.password!);
            uid = cred.user.uid;
          } else {
            throw createErr;
          }
        }

        await deleteApp(secondaryApp);

        const { password, ...userData } = user;
        await setDoc(doc(db, 'users', uid), {
          ...userData,
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setFormSuccess('User saved successfully.');
        setTimeout(closeModal, 1500);
      } catch (fallback: any) {
        const code = fallback?.code as string;
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          setFormError('This email already has an account. The password you entered is incorrect — enter the existing password to link it.');
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
    showConfirm('Delete User', `Are you sure you want to delete ${user.name}? This cannot be undone.`, async () => {
      if (!user.uid) return;
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        try { await deleteAuthUser(user.uid); } catch { /* needs Cloud Function */ }
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    });
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
                  <DropdownPicker
                    label="GROUP"
                    selectedLabel={currentGroup?.name.join(' ') || ''}
                    options={(currentCategory?.task_groups ?? []).map((g, idx) => ({ label: g.name.join(' '), index: idx }))}
                    onSelect={(idx) => { setSelectedGroupIdx(idx); setSelectedLevelIdx(0); }}
                    placeholder="Select a group…"
                  />
                  <DropdownPicker
                    label="LEVEL"
                    selectedLabel={currentLevel?.custom_level_name || ''}
                    options={(currentGroup?.levels ?? []).map((l, idx) => ({ label: l.custom_level_name, index: idx }))}
                    onSelect={setSelectedLevelIdx}
                    placeholder="Select a level…"
                  />
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
                {u.role !== 'Admin' && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(u)}>
                    <Trash2 size={16} color={colors.brandRed} />
                  </TouchableOpacity>
                )}
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
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleSyncData} disabled={isSyncing}>
            {isSyncing
              ? <ActivityIndicator size="small" color={colors.white} />
              : <UploadCloud size={20} color={colors.white} />
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsSettingsOpen(true)}>
            <Settings size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
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
              style={[styles.tab, active && { borderBottomColor: theme.primary }]}
              onPress={() => setActiveTab(id)}
            >
              <Icon size={18} color={active ? theme.primary : colors.brandBlack + '66'} />
              <Text style={[styles.tabText, active && { color: theme.primary }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* ── Settings Modal ────────────────────────────────────────────────── */}
      <Modal visible={isSettingsOpen} transparent animationType="slide" onRequestClose={() => setIsSettingsOpen(false)}>
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsSheet}>
            {/* Sheet header */}
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>APP SETTINGS</Text>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
                <X size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsBody} showsVerticalScrollIndicator={false}>
              {/* ── Primary accent colour ───────────────────────────────── */}
              <ColorPicker
                label="APP ACCENT COLOR"
                currentColor={theme.primary}
                presets={PRIMARY_SWATCHES}
                onSelect={setPrimary}
              />

              {/* ── Tier card colours ───────────────────────────────────── */}
              <Text style={styles.settingsSectionLabel}>CARD COLORS (PRESENTATION)</Text>
              {(
                [
                  { tier: 'E' as const, label: 'Platinum (E)' },
                  { tier: 'D' as const, label: 'Gold (D)' },
                  { tier: 'C' as const, label: 'Silver (C)' },
                  { tier: 'B' as const, label: 'Bronze (B)' },
                  { tier: 'A' as const, label: 'Iron (A)' },
                ]
              ).map(({ tier, label }) => (
                <View key={tier} style={styles.tierRow}>
                  <View style={[styles.tierLabel, { backgroundColor: theme.tiers[tier].bar }]}>
                    <Text style={styles.tierLabelText}>{label}</Text>
                  </View>
                  <ColorPicker
                    label=""
                    currentColor={theme.tiers[tier].bar}
                    presets={TIER_SWATCHES[tier].map((s) => s.bar)}
                    onSelect={(hex) => {
                      const preset = TIER_SWATCHES[tier].find(
                        (s) => s.bar.toLowerCase() === hex.toLowerCase()
                      );
                      setTierColor(tier, preset ?? {
                        bar: hex,
                        bg: hexToLightBg(hex),
                        text: hexToDarkText(hex),
                      });
                    }}
                  />
                </View>
              ))}

              {/* ── Reset ───────────────────────────────────────────────── */}
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={resetToDefault}
                activeOpacity={0.8}
              >
                <RotateCcw size={16} color={colors.brandBlack} />
                <Text style={styles.resetBtnText}>RESET TO DEFAULT</Text>
              </TouchableOpacity>

              {/* ── Site Password ───────────────────────────────────────── */}
              <Text style={styles.settingsSectionLabel}>SITE PASSWORD</Text>
              <View style={styles.sitePwRow}>
                <View style={styles.pwFieldWrap}>
                  <TextInput
                    style={styles.sitePwInput}
                    value={sitePassword}
                    onChangeText={setSitePassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showSitePw}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.pwEyeBtn} onPress={() => setShowSitePw(v => !v)}>
                    {showSitePw ? <EyeOff size={18} color={colors.brandBlack + '88'} /> : <Eye size={18} color={colors.brandBlack + '88'} />}
                  </TouchableOpacity>
                </View>
                <SaveButton label="SAVE" onPress={saveSitePassword} isSubmitting={sitePasswordSaving} />
              </View>

              {/* ── Admin Login Password ─────────────────────────────────── */}
              <Text style={styles.settingsSectionLabel}>ADMIN LOGIN PASSWORD</Text>
              {!!adminPwError && (
                <View style={styles.adminPwAlert}>
                  <Text style={styles.adminPwAlertText}>{adminPwError}</Text>
                </View>
              )}
              {adminPwSuccess && (
                <View style={styles.adminPwSuccess}>
                  <Text style={styles.adminPwSuccessText}>Password updated successfully.</Text>
                </View>
              )}
              <View style={[styles.pwFieldWrap, { marginBottom: spacing.sm }]}>
                <TextInput
                  style={styles.sitePwInput}
                  value={adminCurrentPw}
                  onChangeText={setAdminCurrentPw}
                  placeholder="Current password"
                  secureTextEntry={!showAdminCurrentPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.pwEyeBtn} onPress={() => setShowAdminCurrentPw(v => !v)}>
                  {showAdminCurrentPw ? <EyeOff size={18} color={colors.brandBlack + '88'} /> : <Eye size={18} color={colors.brandBlack + '88'} />}
                </TouchableOpacity>
              </View>
              <View style={[styles.pwFieldWrap, { marginBottom: spacing.sm }]}>
                <TextInput
                  style={styles.sitePwInput}
                  value={adminNewPw}
                  onChangeText={setAdminNewPw}
                  placeholder="New password"
                  secureTextEntry={!showAdminNewPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.pwEyeBtn} onPress={() => setShowAdminNewPw(v => !v)}>
                  {showAdminNewPw ? <EyeOff size={18} color={colors.brandBlack + '88'} /> : <Eye size={18} color={colors.brandBlack + '88'} />}
                </TouchableOpacity>
              </View>
              <View style={styles.sitePwRow}>
                <View style={styles.pwFieldWrap}>
                  <TextInput
                    style={styles.sitePwInput}
                    value={adminConfirmPw}
                    onChangeText={setAdminConfirmPw}
                    placeholder="Confirm new password"
                    secureTextEntry={!showAdminConfirmPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.pwEyeBtn} onPress={() => setShowAdminConfirmPw(v => !v)}>
                    {showAdminConfirmPw ? <EyeOff size={18} color={colors.brandBlack + '88'} /> : <Eye size={18} color={colors.brandBlack + '88'} />}
                  </TouchableOpacity>
                </View>
                <SaveButton label="SAVE" onPress={changeAdminPassword} isSubmitting={adminPwSaving} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Delete Modal ─────────────────────────────────────────── */}
      <Modal visible={!!confirmDialog} transparent animationType="fade" onRequestClose={() => setConfirmDialog(null)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirmDialog?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmDialog?.message}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmDialog(null)}>
                <Text style={styles.confirmCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => {
                  const fn = confirmDialog?.onConfirm;
                  setConfirmDialog(null);
                  fn?.();
                }}
              >
                <Trash2 size={14} color={colors.white} />
                <Text style={styles.confirmDeleteText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
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
                <TaskForm
                  initialData={editingItem}
                  onSave={handleSaveTask}
                  isSubmitting={isSubmitting}
                  levelName={currentLevel?.custom_level_name}
                />
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

  // Confirm delete modal
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confirmMessage: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.brandBlack + '99',
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '88',
    letterSpacing: 1,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  confirmDeleteText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.white,
    letterSpacing: 1,
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

  // Header right group
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  // Settings modal
  settingsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '85%',
  },
  settingsHeader: {
    backgroundColor: colors.brandBlack,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.white,
    letterSpacing: 1,
  },
  settingsBody: {
    padding: spacing.base,
  },
  settingsSectionLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '99',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.brandBlack,
  },
  tierRow: {
    marginBottom: spacing.base,
  },
  tierLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  tierLabelText: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.brandBlack + '33',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  resetBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    letterSpacing: 1,
  },
  sitePwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  pwFieldWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.brandBlack + '33',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  sitePwInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    backgroundColor: 'transparent',
  },
  pwEyeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminPwAlert: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  adminPwAlertText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: '#B91C1C',
  },
  adminPwSuccess: {
    backgroundColor: '#D1FAE5',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  adminPwSuccessText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: '#065F46',
  },

  // ── Level count stepper (Task Group form) ────────────────────────────────────
  levelCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.sm,
  },
  levelCountBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.brandBlack + '30',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  levelCountBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.lg,
    color: colors.brandBlack,
    lineHeight: 22,
  },
  levelCountDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  levelCountNum: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize['2xl'],
    color: colors.brandBlack,
    lineHeight: 28,
  },
  levelCountLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
  },
  levelPreview: {
    backgroundColor: colors.brandBlack + '06',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  levelPreviewText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '88',
  },
  levelPreviewMore: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '55',
    marginTop: 2,
  },

  // ── Dropdown Picker ───────────────────────────────────────────────────────────
  dropdownWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brandBlack + '25',
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  dropdownTriggerOpen: {
    borderColor: colors.brandBlack,
  },
  dropdownTriggerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  dropdownTriggerPlaceholder: {
    color: colors.brandBlack + '44',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dropdownSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '65%',
    overflow: 'hidden',
  },
  dropdownSheetHeader: {
    backgroundColor: colors.brandBlack,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
  },
  dropdownSheetTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.white,
    letterSpacing: 1,
  },
  dropdownList: {
    padding: spacing.sm,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  dropdownOptionActive: {
    backgroundColor: colors.brandBlack,
  },
  dropdownOptionText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  dropdownOptionTextActive: {
    fontFamily: fonts.sansBold,
    color: colors.white,
  },

  // ── Task form section labels + level badge ────────────────────────────────
  formSectionLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    letterSpacing: 1.5,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  levelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  levelBadgeLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    letterSpacing: 1.5,
  },
  levelBadge: {
    backgroundColor: colors.brandBlack,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  levelBadgeText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.white,
    letterSpacing: 0.8,
  },
});
