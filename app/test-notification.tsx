import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function TestNotificationScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const sendTestNotification = async () => {
    try {
      setLoading(true);

      // Send a local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification 🔔',
          body: 'This is a test notification from Yardr!',
          data: {
            type: 'test',
          },
        },
        trigger: null, // Send immediately
      });

      Alert.alert('Success', 'Test notification sent!');
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable notifications in Settings');
        return;
      }

      Alert.alert('Success', 'Notification permissions granted!');
    } catch (error: any) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', error.message);
    }
  };

  const savePushToken = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in');
      return;
    }

    try {
      setLoading(true);

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      console.log('Push token:', token);

      // Save to database
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          expo_push_token: token,
        });

      if (error) throw error;

      Alert.alert('Success', `Push token saved!\n\n${token}`);
    } catch (error: any) {
      console.error('Error saving push token:', error);
      Alert.alert('Error', error.message || 'Failed to save push token');
    } finally {
      setLoading(false);
    }
  };

  const sendWishlistNotification = async () => {
    try {
      setLoading(true);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Found: Banana! 🎉',
          body: '"Banana Sale" may have what you\'re looking for!',
          data: {
            type: 'wishlist_match',
            matchId: 'test-123',
          },
        },
        trigger: null,
      });

      Alert.alert('Success', 'Wishlist match notification sent!');
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Notification Testing
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Test push notifications and wishlist alerts
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Step 1: Request Permissions
          </ThemedText>
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermissions}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              Request Notification Permissions
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Step 2: Save Push Token
          </ThemedText>
          <TouchableOpacity
            style={styles.button}
            onPress={savePushToken}
            disabled={loading || !user}
          >
            <ThemedText style={styles.buttonText}>
              {user ? 'Save Push Token to Database' : 'Sign In Required'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Step 3: Test Notifications
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={sendTestNotification}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              Send Test Notification
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={sendWishlistNotification}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              Send Wishlist Match Notification
            </ThemedText>
          </TouchableOpacity>
        </View>

        {user && (
          <View style={styles.info}>
            <ThemedText style={styles.infoText}>
              Signed in as: {user.email}
            </ThemedText>
            <ThemedText style={styles.infoText}>
              User ID: {user.id.substring(0, 8)}...
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 32,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    color: '#666',
  },
});
