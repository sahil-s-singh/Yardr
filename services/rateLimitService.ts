import { supabase } from '@/lib/supabase';
import * as Device from 'expo-device';

// Rate limiting configuration
const MAX_POSTS_PER_DAY = 999; // Temporarily disabled for testing
const MAX_POSTS_PER_HOUR = 999; // Temporarily disabled for testing

export interface RateLimitCheck {
  allowed: boolean;
  message?: string;
  postsToday: number;
  postsThisHour: number;
}

export const rateLimitService = {
  // Check if device can post based on rate limits
  checkRateLimit: async (): Promise<RateLimitCheck> => {
    try {
      // Get unique device identifier
      const deviceId = await getDeviceId();

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check posts in last 24 hours
      const { data: dailyPosts, error: dailyError } = await supabase
        .from('garage_sales')
        .select('id, created_at')
        .eq('device_id', deviceId)
        .gte('created_at', oneDayAgo.toISOString());

      if (dailyError) {
        console.error('Error checking daily rate limit:', dailyError);
        // Allow on error to not block legitimate users
        return { allowed: true, postsToday: 0, postsThisHour: 0 };
      }

      const postsToday = dailyPosts?.length || 0;

      // Check posts in last hour
      const postsThisHour = dailyPosts?.filter(
        post => new Date(post.created_at) >= oneHourAgo
      ).length || 0;

      // Check limits
      if (postsToday >= MAX_POSTS_PER_DAY) {
        return {
          allowed: false,
          message: `You've reached the daily limit of ${MAX_POSTS_PER_DAY} posts. Try again tomorrow.`,
          postsToday,
          postsThisHour,
        };
      }

      if (postsThisHour >= MAX_POSTS_PER_HOUR) {
        return {
          allowed: false,
          message: `You've posted ${postsThisHour} times in the last hour. Please wait before posting again.`,
          postsToday,
          postsThisHour,
        };
      }

      return {
        allowed: true,
        postsToday,
        postsThisHour,
      };
    } catch (error) {
      console.error('Error in checkRateLimit:', error);
      // Allow on error to not block legitimate users
      return { allowed: true, postsToday: 0, postsThisHour: 0 };
    }
  },

  // Get device ID for tracking
  getDeviceId: async (): Promise<string> => {
    return getDeviceId();
  },
};

// Helper function to get unique device identifier
async function getDeviceId(): Promise<string> {
  try {
    // Try to get a unique device ID
    const deviceId = await Device.getDeviceIdAsync();

    if (deviceId) {
      return deviceId;
    }

    // Fallback: create a composite ID from available device info
    const deviceName = Device.deviceName || 'unknown';
    const modelName = Device.modelName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';

    return `${deviceName}-${modelName}-${osVersion}`;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Ultimate fallback
    return 'unknown-device';
  }
}
