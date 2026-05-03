import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Create a .env.local file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

const loggedStorage = {
  getItem: async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    console.log('[supabase.storage.getItem]', key, value ? `(${value.length} chars)` : 'null');
    return value;
  },
  setItem: async (key: string, value: string) => {
    console.log('[supabase.storage.setItem]', key, `(${value.length} chars)`);
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    console.log('[supabase.storage.removeItem]', key);
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: loggedStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Pause/resume token auto-refresh based on app foreground state — recommended by Supabase RN docs.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
