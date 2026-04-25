import { supabase } from '@/lib/supabase';
import { authService } from '@/services/authService';
import { garageSaleService } from '@/services/garageSaleService';
import { rateLimitService } from '@/services/rateLimitService';
import { UserProfile } from '@/types/user';
import { Session, User } from '@supabase/supabase-js';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        loadUserProfile(session.user.id);
        registerPushToken(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((session) => {
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        loadUserProfile(session.user.id);
        registerPushToken(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await authService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const registerPushToken = async (userId: string) => {
    try {
      if (!Device.isDevice) return;
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') return;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'f9805b98-5747-42cd-bc89-11e9a70bbd08',
      });
      await supabase
        .from('user_profiles')
        .upsert({ id: userId, expo_push_token: tokenData.data }, { onConflict: 'id' });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { session } = await authService.signIn(email, password);
      setSession(session);
      setUser(session.user);

      if (session.user) {
        await loadUserProfile(session.user.id);
        registerPushToken(session.user.id);

        // Claim any sales created from this device before logging in
        try {
          const deviceId = await rateLimitService.getDeviceId();
          const claimedCount = await garageSaleService.claimDeviceSales(deviceId);
          if (claimedCount > 0) {
          }
        } catch (claimError) {
          console.error('Error claiming device sales:', claimError);
          // Don't throw - login should still succeed even if claiming fails
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      await authService.signUp(email, password, displayName);
      // User will need to verify email (if enabled), so don't auto-login
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear push token from database before signing out
      if (user) {
        try {
          await supabase
            .from('user_profiles')
            .update({ expo_push_token: null })
            .eq('id', user.id);
        } catch (err) {
          console.error('Error clearing push token:', err);
        }
      }
      await authService.signOut();
      setSession(null);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userProfile,
        loading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
