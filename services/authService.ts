import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';
import { sso } from '@/lib/ssoAvailability';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const NEEDS_DEV_BUILD =
  'Apple sign-in requires a development build. Rebuild with EAS Build after adding the SSO packages.';

export const authService = {
  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        throw new Error('Too many attempts. Please wait a few minutes and try again.');
      }
      throw error;
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase.from('user_profiles').upsert([
        {
          id: data.user.id,
          display_name: displayName || null,
        },
      ], { onConflict: 'id' });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return data;
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  getSession: async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data.session;
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return data.user;
  },

  /**
   * Get user profile by ID
   */
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (
    userId: string,
    updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url'>>
  ): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChange: (callback: (session: Session | null) => void) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });

    return subscription;
  },

  /**
   * Reset password - send email
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  /**
   * Update password
   */
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  /**
   * Update email — triggers Supabase confirmation email
   */
  updateEmail: async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  },

  /**
   * Delete the current user's account and all linked SSO identities.
   * Calls the `delete-account` edge function (service-role privileged op).
   */
  deleteAccount: async () => {
    const { data, error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    // Clear local session — the user no longer exists server-side.
    await supabase.auth.signOut().catch(() => undefined);
  },

  /**
   * Sign in with Apple (iOS only). Exchanges identity token with Supabase.
   */
  signInWithApple: async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Sign in with Apple is only available on iOS');
    }
    if (!sso.appleNativeAvailable) throw new Error(NEEDS_DEV_BUILD);
    const AppleAuthentication = require('expo-apple-authentication');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token');
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;

    // First-time sign-in: Apple gives us the name on the credential.
    const fullName = [
      credential.fullName?.givenName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (data.user && fullName) {
      await supabase
        .from('user_profiles')
        .upsert(
          { id: data.user.id, display_name: fullName },
          { onConflict: 'id' },
        );
    }
    return data;
  },

  /**
   * Sign in with Google. Native sign-in flow → exchange idToken with Supabase.
   */
  /**
   * Google sign-in via OAuth code flow with PKCE and explicit nonce control.
   * Google deprecated the implicit (id_token) flow for native clients, so we
   * use code-flow → exchange code for id_token at Google's token endpoint →
   * send id_token + raw nonce to Supabase.
   */
  signInWithGoogle: async () => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    if (!webClientId) {
      throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set in .env.local');
    }

    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const clientId = Platform.OS === 'ios' && iosClientId ? iosClientId : webClientId;
    const redirectUri =
      Platform.OS === 'ios' && iosClientId
        ? `com.googleusercontent.apps.${iosClientId.split('.apps.googleusercontent.com')[0]}:/oauth2redirect`
        : AuthSession.makeRedirectUri({ scheme: 'yardr', path: 'oauth2redirect' });

    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
      extraParams: { nonce: hashedNonce },
    });
    const result = await request.promptAsync(discovery);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Sign-in cancelled');
    }
    if (result.type !== 'success') {
      throw new Error(`Google sign-in failed: ${result.type}`);
    }
    const code = (result.params as any).code;
    if (!code) throw new Error('Google did not return an authorization code');

    // Exchange code for tokens. iOS native OAuth clients have no client_secret;
    // PKCE verifier proves the request is legit.
    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? '' },
      },
      discovery,
    );

    const idToken = (tokenResponse as any).idToken ?? (tokenResponse.rawResponse as any)?.id_token;
    if (!idToken) {
      throw new Error('Token exchange did not return an id_token');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce: rawNonce,
    });
    if (error) throw error;
    return data;
  },
};
