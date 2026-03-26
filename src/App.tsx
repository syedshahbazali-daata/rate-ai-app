import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, Platform, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BlackOpsOne_400Regular,
} from '@expo-google-fonts/black-ops-one';
import {
  Lato_300Light,
  Lato_400Regular,
  Lato_700Bold,
  Lato_900Black,
} from '@expo-google-fonts/lato';

import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  signInWithEmailAndPassword,
} from './firebase';
import {
  cacheCategories,
  getCachedCategories,
  cacheUser,
  getCachedUser,
  clearCachedUser,
  setAdminSession,
  getAdminSession,
  clearAllCache,
} from './storage';

import { Screen, Category, TaskGroup, TaskLevel, Task, PricingData, AppUser } from './types';
import { colors } from './theme';

import SplashScreenComponent from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import TaskGroupScreen from './screens/TaskGroupScreen';
import TaskScreen from './screens/TaskScreen';
import PresentationScreen from './screens/PresentationScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import AdminScreen from './screens/AdminScreen';

SplashScreen.preventAutoHideAsync();

const SPECIAL_ADMIN_EMAIL = 'shehbazali1639@gmail.com';

export default function App() {
  const [fontsLoaded] = useFonts({
    BlackOpsOne_400Regular,
    Lato_300Light,
    Lato_400Regular,
    Lato_700Bold,
    Lato_900Black,
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [splashDone, setSplashDone] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pricingData, setPricingData] = useState<PricingData>({
    categories: [],
    service_type: {
      id: 1,
      name: 'Electrical',
      created_at: '',
      updated_at: '',
      payment_factor: '',
      service_letters: '',
      name_with_format: '',
    },
  });
  const [users, setUsers] = useState<AppUser[]>([]);

  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTaskGroup, setSelectedTaskGroup] = useState<TaskGroup | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<TaskLevel | null>(null);
  const [isTechHandbookMode, setIsTechHandbookMode] = useState(false);

  // ── Font / Splash hide ────────────────────────────────────────────────────
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // ── Load cached data first (offline support) ──────────────────────────────
  useEffect(() => {
    (async () => {
      const adminSession = await getAdminSession();
      if (adminSession) setIsAdmin(true);

      const cachedCategories = await getCachedCategories();
      if (cachedCategories && cachedCategories.length > 0) {
        setPricingData((prev) => ({ ...prev, categories: cachedCategories }));
      }
    })();
  }, []);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Clear any stale admin session when real firebase user logs in
        await setAdminSession(false);
        setIsAdmin(false);

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { ...userDoc.data(), uid: firebaseUser.uid } as AppUser;
            setUser(userData);
            await cacheUser(userData);
          } else if (firebaseUser.email?.toLowerCase() === SPECIAL_ADMIN_EMAIL) {
            const adminData: AppUser = {
              name: firebaseUser.displayName || 'Admin',
              email: firebaseUser.email!,
              role: 'Admin',
              uid: firebaseUser.uid,
            };
            await setDoc(
              doc(db, 'users', firebaseUser.uid),
              { ...adminData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
              { merge: true }
            );
            setUser(adminData);
            await cacheUser(adminData);
          } else {
            await signOut(auth);
            setUser(null);
            await clearCachedUser();
          }
        } catch {
          // Offline: try cached user
          const cachedUser = await getCachedUser();
          if (cachedUser && cachedUser.uid === firebaseUser.uid) {
            setUser(cachedUser);
          }
        }
      } else {
        setUser(null);
        await clearCachedUser();
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // ── Firestore data listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady || (!auth.currentUser && !isAdmin)) return;

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const cats = snapshot.docs
          .map((d) => ({ ...d.data(), id: d.id } as Category))
          .sort((a, b) => (a.prefix ?? '').localeCompare(b.prefix ?? ''));
        setPricingData((prev) => ({ ...prev, categories: cats }));
        cacheCategories(cats);
      },
      () => {
        // On error (offline), keep cached data - already loaded above
      }
    );

    let unsubUsers = () => {};
    if (isAdmin) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersList = snapshot.docs.map((d) => ({
          ...d.data(),
          uid: d.id,
        } as AppUser));
        setUsers(usersList);
      });
    }

    return () => {
      unsubCategories();
      unsubUsers();
    };
  }, [isAuthReady, isAdmin]);

  // ── Splash timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => setSplashDone(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // ── Navigate after splash + auth both ready (no login flash for returning users) ──
  useEffect(() => {
    if (!splashDone || !isAuthReady) return;
    if (currentScreen !== 'splash') return;
    setCurrentScreen(isAdmin ? 'admin' : user ? 'home' : 'login');
  }, [splashDone, isAuthReady]);

  // ── Redirect after login (user state set by onAuthStateChanged) ───────────
  useEffect(() => {
    if (isAuthReady && (user || isAdmin) && currentScreen === 'login') {
      setCurrentScreen(isAdmin ? 'admin' : 'home');
    }
  }, [user, isAdmin, currentScreen, isAuthReady]);

  // ── Clear loading state once screen changes away from login (Fix 4) ───────
  useEffect(() => {
    if (currentScreen !== 'login') {
      setIsLoggingIn(false);
    }
  }, [currentScreen]);

  // ── Android hardware back button ──────────────────────────────────────────
  useEffect(() => {
    const backAction = () => {
      switch (currentScreen) {
        case 'splash':
          return true;
        case 'login':
          BackHandler.exitApp();
          return true;
        case 'home':
          BackHandler.exitApp();
          return true;
        case 'categories':
          setCurrentScreen('home');
          return true;
        case 'task_groups':
          setCurrentScreen('categories');
          return true;
        case 'tasks':
          setCurrentScreen('task_groups');
          return true;
        case 'presentation':
          setCurrentScreen('tasks');
          return true;
        case 'profile':
        case 'settings':
          setCurrentScreen('home');
          return true;
        case 'admin':
          return true;
        default:
          return false;
      }
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, [currentScreen]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Keep isLoggingIn=true — cleared by the currentScreen useEffect above
      return true;
    } catch (e: any) {
      if (
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/invalid-credential'
      ) {
        setLoginError('Invalid email or password.');
      } else if (e.code === 'auth/invalid-email') {
        setLoginError('Invalid email format.');
      } else {
        setLoginError('Login failed. Please try again.');
      }
      setIsLoggingIn(false);
      return false;
    }
  };

  const handleAdminLogin = async () => {
    setIsLoggingIn(true);
    await setAdminSession(true);
    setIsAdmin(true);
    setCurrentScreen('admin');
    // isLoggingIn cleared by currentScreen useEffect
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((r) => setTimeout(r, 800));
    try {
      await signOut(auth);
    } catch {}
    await clearAllCache();
    setUser(null);
    setIsAdmin(false);
    setIsLoggingOut(false);
    setCurrentScreen('login');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const cats = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Category))
        .sort((a, b) => (a.prefix ?? '').localeCompare(b.prefix ?? ''));
      setPricingData((prev) => ({ ...prev, categories: cats }));
      await cacheCategories(cats);
    } catch {}
    setIsRefreshing(false);
  };

  const handleSyncData = async () => {
    // Delete all existing categories and re-upload from Firestore source
    // In mobile, we just force-refresh from Firestore
    await handleRefresh();
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCurrentScreen('task_groups');
  };

  const handleTaskGroupSelect = (group: TaskGroup) => {
    setSelectedTaskGroup(group);
    setSelectedLevel(group.levels[0]);
    setCurrentScreen('tasks');
  };

  const handleLevelSelect = (level: TaskLevel) => {
    setSelectedLevel(level);
  };

  const handleTaskSelect = (_task: Task) => {
    setCurrentScreen('presentation');
  };

  // ── Menu overlay props shared across screens ──────────────────────────────
  const menuProps = {
    onNavigate: (screen: Screen) => setCurrentScreen(screen),
    onLogout: handleLogout,
    user,
    isLoggingOut,
    onRefresh: handleRefresh,
    isRefreshing,
  };

  // ── Render screens ────────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreenComponent />;

      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onAdminLogin={handleAdminLogin}
            externalError={loginError}
            isLoggingIn={isLoggingIn}
          />
        );

      case 'admin':
        return (
          <AdminScreen
            pricingData={pricingData}
            users={users}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            onSyncData={handleSyncData}
          />
        );

      case 'home':
        return (
          <HomeScreen
            onAccessMenu={() => setCurrentScreen('categories')}
            {...menuProps}
          />
        );

      case 'categories':
        return (
          <CategoryScreen
            categories={pricingData.categories}
            onSelect={handleCategorySelect}
            onBack={() => setCurrentScreen('home')}
            {...menuProps}
          />
        );

      case 'task_groups':
        return selectedCategory ? (
          <TaskGroupScreen
            category={selectedCategory}
            categories={pricingData.categories}
            onCategorySelect={handleCategorySelect}
            onSelect={handleTaskGroupSelect}
            onBack={() => setCurrentScreen('categories')}
            onHome={() => setCurrentScreen('home')}
            {...menuProps}
          />
        ) : null;

      case 'tasks':
        return selectedCategory && selectedTaskGroup && selectedLevel ? (
          <TaskScreen
            category={selectedCategory}
            taskGroup={selectedTaskGroup}
            selectedLevel={selectedLevel}
            onLevelSelect={handleLevelSelect}
            onTaskSelect={handleTaskSelect}
            onBack={() => setCurrentScreen('task_groups')}
            onCategories={() => setCurrentScreen('categories')}
            onHome={() => setCurrentScreen('home')}
            isTechHandbookMode={isTechHandbookMode}
            onToggleTechHandbook={() => setIsTechHandbookMode((v) => !v)}
            onContinueToPresentation={() => setCurrentScreen('presentation')}
            {...menuProps}
          />
        ) : null;

      case 'presentation':
        return selectedLevel ? (
          <PresentationScreen
            level={selectedLevel}
            onBack={() => setCurrentScreen('tasks')}
            {...menuProps}
          />
        ) : null;

      case 'profile':
        return user ? (
          <ProfileScreen
            user={user}
            onBack={() => setCurrentScreen('home')}
            onNavigate={(screen: Screen) => setCurrentScreen(screen)}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        ) : null;

      case 'settings':
        return (
          <SettingsScreen
            onBack={() => setCurrentScreen('home')}
            {...menuProps}
          />
        );

      default:
        return <SplashScreenComponent />;
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.brandBlack}
        translucent={false}
      />
      <View style={styles.root} onLayout={onLayoutRootView}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brandBlack,
  },
});
