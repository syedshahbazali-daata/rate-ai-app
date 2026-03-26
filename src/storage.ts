/**
 * AsyncStorage caching layer for offline support.
 * Data is loaded from cache first, then synced with Firestore when online.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, AppUser } from './types';

const KEYS = {
  categories: 'ateam_categories_v1',
  user: 'ateam_user_v1',
  isAdmin: 'ateam_is_admin_v1',
};

// ── Categories ────────────────────────────────────────────────────────────────

export async function cacheCategories(categories: Category[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.categories, JSON.stringify(categories));
  } catch (e) {
    console.warn('Failed to cache categories:', e);
  }
}

export async function getCachedCategories(): Promise<Category[] | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.categories);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ── User ──────────────────────────────────────────────────────────────────────

export async function cacheUser(user: AppUser): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  } catch (e) {
    console.warn('Failed to cache user:', e);
  }
}

export async function getCachedUser(): Promise<AppUser | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.user);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function clearCachedUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.user);
  } catch {}
}

// ── Admin session ─────────────────────────────────────────────────────────────

export async function setAdminSession(isAdmin: boolean): Promise<void> {
  try {
    if (isAdmin) {
      await AsyncStorage.setItem(KEYS.isAdmin, '1');
    } else {
      await AsyncStorage.removeItem(KEYS.isAdmin);
    }
  } catch {}
}

export async function getAdminSession(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.isAdmin);
    return val === '1';
  } catch {
    return false;
  }
}

// ── Clear all ─────────────────────────────────────────────────────────────────

export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {}
}
