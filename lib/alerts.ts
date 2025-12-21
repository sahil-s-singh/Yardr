import { Alert } from 'react-native';

/**
 * Show an error alert
 */
export const showError = (message: string, title: string = 'Error'): void => {
  Alert.alert(title, message);
};

/**
 * Show a success alert
 */
export const showSuccess = (message: string, title: string = 'Success'): void => {
  Alert.alert(title, message);
};

/**
 * Show a confirmation alert with OK/Cancel buttons
 */
export const showConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  title: string = 'Confirm'
): void => {
  Alert.alert(title, message, [
    {
      text: 'Cancel',
      onPress: onCancel,
      style: 'cancel',
    },
    {
      text: 'OK',
      onPress: onConfirm,
    },
  ]);
};

/**
 * Show sign-in prompt for unauthenticated users
 */
export const showSignInPrompt = (
  router: any,
  message: string = 'Please sign in to continue',
  title: string = 'Sign In Required'
): void => {
  Alert.alert(title, message, [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: 'Sign In',
      onPress: () => router.push('/auth/sign-in'),
    },
  ]);
};

/**
 * Show an info alert
 */
export const showInfo = (message: string, title: string = 'Info'): void => {
  Alert.alert(title, message);
};
