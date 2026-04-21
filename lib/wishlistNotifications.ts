import { supabase } from '@/lib/supabase';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

async function sendExpoPush(
  pushToken: string,
  message: Record<string, any>
): Promise<{ success: boolean; invalidToken: boolean }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      // Check for invalid token errors from Expo
      if (result?.data?.status === 'error') {
        const detail = result.data.details?.error;
        if (detail === 'DeviceNotRegistered' || detail === 'InvalidCredentials') {
          return { success: false, invalidToken: true };
        }
      }

      if (response.ok) {
        return { success: true, invalidToken: false };
      }

      // Don't retry on 4xx client errors (except 429 rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        console.error('Expo push client error:', response.status, result);
        return { success: false, invalidToken: false };
      }
    } catch (error) {
      console.error(`Push send attempt ${attempt + 1} failed:`, error);
    }

    // Wait before retry (unless last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }

  return { success: false, invalidToken: false };
}

export async function sendWishlistMatchNotification(
  userId: string,
  matchId: string
): Promise<void> {
  try {
    // Get match details
    const { data: match, error } = await supabase
      .from('wishlist_matches')
      .select(`
        *,
        garage_sales (*),
        user_wishlists (*)
      `)
      .eq('id', matchId)
      .single();

    if (error || !match || match.notification_sent) return;

    // Get user's push token from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('expo_push_token')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.expo_push_token) {
      console.warn('No push token available for user:', userId);
      // Don't mark as sent — user may add a token later
      return;
    }

    const pushToken = profile.expo_push_token;

    const message = {
      to: pushToken,
      sound: 'default',
      title: `Found: ${match.user_wishlists.item_name}!`,
      body: `"${match.garage_sales.title}" may have what you're looking for!`,
      data: {
        type: 'wishlist_match',
        matchId: match.id,
        garageSaleId: match.garage_sale_id,
        wishlistItemId: match.wishlist_item_id,
      },
    };

    const { success, invalidToken } = await sendExpoPush(pushToken, message);

    // If token is invalid/expired, clear it from the database
    if (invalidToken) {
      console.warn('Invalid push token for user, clearing:', userId);
      await supabase
        .from('user_profiles')
        .update({ expo_push_token: null })
        .eq('id', userId);
      return;
    }

    if (success) {
      // Mark as sent
      await supabase
        .from('wishlist_matches')
        .update({
          notification_sent: true,
          notification_sent_at: new Date().toISOString(),
        })
        .eq('id', matchId);
    }
    // If not successful and not invalidToken, leave notification_sent as false
    // so it can be retried later
  } catch (error) {
    console.error('Error sending wishlist match notification:', error);
    throw error;
  }
}
