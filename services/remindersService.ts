import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { UserReminder } from '@/types/user';
import { mapGarageSaleRow } from '@/lib/mappers';

export const remindersService = {
  /**
   * Request notification permissions from the user
   */
  requestPermissions: async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  /**
   * Get Expo push token for this device
   */
  getPushToken: async (): Promise<string | null> => {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Set a reminder for a garage sale
   */
  setReminder: async (
    userId: string,
    garageSaleId: string,
    reminderTime: Date,
    garageSaleTitle: string
  ): Promise<UserReminder> => {
    const pushToken = await remindersService.getPushToken();

    const { data, error } = await supabase
      .from('user_reminders')
      .insert([
        {
          user_id: userId,
          garage_sale_id: garageSaleId,
          reminder_time: reminderTime.toISOString(),
          expo_push_token: pushToken,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Schedule local notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Garage Sale Reminder 🏷️',
          body: `${garageSaleTitle} is happening soon!`,
          data: { garageSaleId },
        },
        trigger: reminderTime,
      });
    } catch (notifError) {
      console.error('Error scheduling notification:', notifError);
      // Don't throw - the reminder is still saved in the database
    }

    return data;
  },

  /**
   * Remove a reminder
   */
  removeReminder: async (userId: string, garageSaleId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_reminders')
      .delete()
      .eq('user_id', userId)
      .eq('garage_sale_id', garageSaleId);

    if (error) throw error;

    // Note: We don't cancel the local notification here because we'd need to track
    // the notification ID. In a production app, you'd want to store the notification ID
    // and cancel it here.
  },

  /**
   * Get all reminders for a user
   */
  getUserReminders: async (userId: string): Promise<UserReminder[]> => {
    const { data, error } = await supabase
      .from('user_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get reminders with garage sale details
   */
  getUserRemindersWithDetails: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_reminders')
      .select(
        `
        *,
        garage_sales (*)
      `
      )
      .eq('user_id', userId)
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Error fetching reminders with details:', error);
      throw error;
    }

    return (data || []).map((reminder: any) => ({
      reminder: {
        id: reminder.id,
        user_id: reminder.user_id,
        garage_sale_id: reminder.garage_sale_id,
        reminder_time: reminder.reminder_time,
        notification_sent: reminder.notification_sent,
        expo_push_token: reminder.expo_push_token,
        created_at: reminder.created_at,
      } as UserReminder,
      garageSale: reminder.garage_sales ? mapGarageSaleRow(reminder.garage_sales) : null,
    }));
  },

  /**
   * Check if a reminder exists for a garage sale
   */
  hasReminder: async (userId: string, garageSaleId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_reminders')
      .select('id')
      .eq('user_id', userId)
      .eq('garage_sale_id', garageSaleId)
      .maybeSingle();

    if (error) {
      console.error('Error checking reminder status:', error);
      return false;
    }

    return data !== null;
  },

  /**
   * Get count of reminders for a user
   */
  getRemindersCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('user_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching reminders count:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Update reminder time
   */
  updateReminder: async (
    reminderId: string,
    newReminderTime: Date
  ): Promise<UserReminder> => {
    const { data, error } = await supabase
      .from('user_reminders')
      .update({
        reminder_time: newReminderTime.toISOString(),
        notification_sent: false,
      })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
