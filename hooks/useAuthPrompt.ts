import { useRouter } from 'expo-router';
import { showSignInPrompt } from '@/lib/alerts';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to handle authentication prompts
 * Returns a function that checks if user is authenticated and shows sign-in prompt if not
 */
export const useAuthPrompt = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  /**
   * Check if user is authenticated, show prompt if not
   * @param message Custom message for the sign-in prompt
   * @returns true if authenticated, false if not
   */
  const requireAuth = (
    message: string = 'Please sign in to continue',
    title: string = 'Sign In Required'
  ): boolean => {
    if (!isAuthenticated) {
      showSignInPrompt(router, message, title);
      return false;
    }
    return true;
  };

  return {
    requireAuth,
    isAuthenticated,
    user,
  };
};
