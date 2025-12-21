import { supabase } from '@/lib/supabase';

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
      // Still mark as sent to avoid retry loops
      await supabase
        .from('wishlist_matches')
        .update({ notification_sent: true })
        .eq('id', matchId);
      return;
    }

    const pushToken = profile.expo_push_token;

    // Send push notification using Expo Push API
    const message = {
      to: pushToken,
      sound: 'default',
      title: `Found: ${match.user_wishlists.item_name}! 🎉`,
      body: `"${match.garage_sales.title}" may have what you're looking for!`,
      data: {
        type: 'wishlist_match',
        matchId: match.id,
        garageSaleId: match.garage_sale_id,
        wishlistItemId: match.wishlist_item_id,
      },
    };

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

    if (!response.ok) {
      console.error('Failed to send wishlist match notification:', result);
      return;
    }

    console.log('✅ Wishlist match notification sent!', result);

    // Mark as sent
    await supabase
      .from('wishlist_matches')
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
      })
      .eq('id', matchId);
  } catch (error) {
    console.error('Error sending wishlist match notification:', error);
    throw error;
  }
}
