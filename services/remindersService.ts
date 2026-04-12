import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { UserReminder } from '@/types/user';
import { reminderCopy } from '@/lib/notificationCopy';

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

    // Schedule local notification as a fallback
    try {
      const { title, body } = reminderCopy({ saleTitle: garageSaleTitle });
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'reminder', garageSaleId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });

      // Store notification ID so we can cancel it later
      await supabase
        .from('user_reminders')
        .update({ local_notification_id: notificationId })
        .eq('id', data.id);
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
    // Fetch the reminder first to get the local notification ID
    const { data: reminder } = await supabase
      .from('user_reminders')
      .select('local_notification_id')
      .eq('user_id', userId)
      .eq('garage_sale_id', garageSaleId)
      .maybeSingle();

    // Cancel the local notification if we have its ID
    if (reminder?.local_notification_id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminder.local_notification_id);
      } catch (cancelError) {
        console.error('Error cancelling notification:', cancelError);
      }
    }

    const { error } = await supabase
      .from('user_reminders')
      .delete()
      .eq('user_id', userId)
      .eq('garage_sale_id', garageSaleId);

    if (error) throw error;
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
      garageSale: reminder.garage_sales
        ? {
            id: reminder.garage_sales.id,
            title: reminder.garage_sales.title,
            description: reminder.garage_sales.description,
            location: {
              latitude: reminder.garage_sales.latitude,
              longitude: reminder.garage_sales.longitude,
              address: reminder.garage_sales.address,
            },
            date: reminder.garage_sales.date,
            startDate: reminder.garage_sales.start_date || reminder.garage_sales.date,
            endDate: reminder.garage_sales.end_date || reminder.garage_sales.date,
            startTime: reminder.garage_sales.start_time,
            endTime: reminder.garage_sales.end_time,
            categories: reminder.garage_sales.categories || [],
            contactName: reminder.garage_sales.contact_name,
            contactPhone: reminder.garage_sales.contact_phone,
            contactEmail: reminder.garage_sales.contact_email,
            images: reminder.garage_sales.images || [],
            videoUrl: reminder.garage_sales.video_url,
            createdAt: reminder.garage_sales.created_at,
            isActive: reminder.garage_sales.is_active,
            userId: reminder.garage_sales.user_id,
          }
        : null,
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
