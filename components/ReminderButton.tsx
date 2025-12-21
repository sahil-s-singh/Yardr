import { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { remindersService } from '@/services/remindersService';
import { showSignInPrompt, showConfirm, showError, showSuccess, showInfo } from '@/lib/alerts';

interface ReminderButtonProps {
  garageSaleId: string;
  garageSaleTitle: string;
  garageSaleDate: string; // ISO date string
  size?: number;
  showLabel?: boolean;
}

export default function ReminderButton({
  garageSaleId,
  garageSaleTitle,
  garageSaleDate,
  size = 24,
  showLabel = false,
}: ReminderButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [hasReminder, setHasReminder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (isAuthenticated && user) {
      checkReminderStatus();
    }
  }, [isAuthenticated, user, garageSaleId]);

  const checkReminderStatus = async () => {
    if (!user) return;

    try {
      const reminder = await remindersService.hasReminder(user.id, garageSaleId);
      setHasReminder(reminder);
    } catch (error) {
      console.error('Error checking reminder status:', error);
    }
  };

  const handlePress = async () => {
    if (!isAuthenticated) {
      showSignInPrompt(
        router,
        'Please sign in to set reminders for garage sales',
        'Sign In Required'
      );
      return;
    }

    if (!user || loading) return;

    if (hasReminder) {
      // Remove reminder
      showConfirm('Remove this reminder?', async () => {
        setLoading(true);
        try {
          await remindersService.removeReminder(user.id, garageSaleId);
          setHasReminder(false);
          showSuccess('Reminder removed');
        } catch (error: any) {
          console.error('Error removing reminder:', error);
          showError('Failed to remove reminder');
        } finally {
          setLoading(false);
        }
      }, undefined, 'Remove Reminder');
    } else {
      // Request permission first
      const hasPermission = await remindersService.requestPermissions();
      if (!hasPermission) {
        showInfo(
          'Please enable notifications in your device settings to set reminders',
          'Permission Required'
        );
        return;
      }

      // Show date/time picker
      const saleDate = new Date(garageSaleDate);
      const oneDayBefore = new Date(saleDate.getTime() - 24 * 60 * 60 * 1000);
      setSelectedDate(oneDayBefore);
      setShowDatePicker(true);
    }
  };

  const handleDateChange = async (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (date) {
      setSelectedDate(date);

      if (Platform.OS === 'android') {
        // On Android, confirm immediately
        await confirmReminder(date);
      }
    }
  };

  const confirmReminder = async (date: Date) => {
    if (!user) return;

    setLoading(true);
    setShowDatePicker(false);

    try {
      await remindersService.setReminder(user.id, garageSaleId, date, garageSaleTitle);
      setHasReminder(true);
      showSuccess(`Reminder set for ${date.toLocaleString()}`);
    } catch (error: any) {
      console.error('Error setting reminder:', error);
      showError('Failed to set reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleIOSConfirm = () => {
    confirmReminder(selectedDate);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, showLabel && styles.buttonWithLabel]}
        onPress={handlePress}
        disabled={loading}
      >
        <ThemedText style={[styles.icon, { fontSize: size }]}>
          {hasReminder ? '🔔' : '🔕'}
        </ThemedText>
        {showLabel && (
          <ThemedText style={styles.label}>
            {hasReminder ? 'Reminder Set' : 'Remind Me'}
          </ThemedText>
        )}
      </TouchableOpacity>

      {showDatePicker && (
        <>
          <DateTimePicker
            value={selectedDate}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.iosConfirmButton} onPress={handleIOSConfirm}>
              <ThemedText style={styles.iosConfirmText}>Set Reminder</ThemedText>
            </TouchableOpacity>
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  buttonWithLabel: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  iosConfirmButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  iosConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
