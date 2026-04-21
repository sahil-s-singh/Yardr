import { supabase } from '@/lib/supabase';
import { UserWishlistItem, WishlistMatch, WishlistMatchWithDetails } from '@/types/user';
import { GarageSale } from '@/types/garageSale';
import { matchWishlistAgainstSale } from '@/lib/wishlistMatcher';
import { sendWishlistMatchNotification } from '@/lib/wishlistNotifications';
import { mapGarageSaleRow } from '@/lib/mappers';

// Rate limit: max concurrent AI matching calls
const MAX_CONCURRENT_MATCHES = 5;
const MATCH_DELAY_MS = 200;

async function rateLimitedMatchLoop<T>(
  items: T[],
  processFn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += MAX_CONCURRENT_MATCHES) {
    const batch = items.slice(i, i + MAX_CONCURRENT_MATCHES);
    await Promise.all(batch.map(processFn));
    if (i + MAX_CONCURRENT_MATCHES < items.length) {
      await new Promise(resolve => setTimeout(resolve, MATCH_DELAY_MS));
    }
  }
}

export const wishlistService = {
  /**
   * Add a new wishlist item
   */
  addWishlistItem: async (
    userId: string,
    itemName: string,
    description?: string,
    category?: string
  ): Promise<UserWishlistItem> => {
    const { data, error } = await supabase
      .from('user_wishlists')
      .insert([{
        user_id: userId,
        item_name: itemName,
        description: description || null,
        category: category || null,
      }])
      .select()
      .single();

    if (error) throw error;

    // Background: Check against recent active sales
    checkWishlistItemAgainstExistingSales(userId, data.id).catch(err => {
      console.error('Error checking wishlist against existing sales:', err);
    });

    return data;
  },

  /**
   * Get all wishlist items for a user
   */
  getUserWishlistItems: async (userId: string, limit = 50, offset = 0): Promise<UserWishlistItem[]> => {
    const { data, error } = await supabase
      .from('user_wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  /**
   * Update a wishlist item
   */
  updateWishlistItem: async (
    id: string,
    updates: Partial<Pick<UserWishlistItem, 'item_name' | 'description' | 'category' | 'is_active'>>
  ): Promise<UserWishlistItem> => {
    const { data, error } = await supabase
      .from('user_wishlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete (deactivate) a wishlist item
   */
  deleteWishlistItem: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('user_wishlists')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get matches for a specific wishlist item
   */
  getMatchesForWishlistItem: async (wishlistItemId: string, limit = 50, offset = 0): Promise<WishlistMatchWithDetails[]> => {
    const { data, error } = await supabase
      .from('wishlist_matches')
      .select(`
        *,
        garage_sales (*),
        user_wishlists (*)
      `)
      .eq('wishlist_item_id', wishlistItemId)
      .order('matched_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map((match: any) => ({
      id: match.id,
      user_id: match.user_id,
      wishlist_item_id: match.wishlist_item_id,
      garage_sale_id: match.garage_sale_id,
      matched_at: match.matched_at,
      notification_sent: match.notification_sent,
      notification_sent_at: match.notification_sent_at,
      match_confidence: match.match_confidence,
      match_reason: match.match_reason,
      garage_sale: mapGarageSaleRow(match.garage_sales),
      wishlist_item: match.user_wishlists,
    }));
  },

  /**
   * Get match count for a wishlist item
   */
  getMatchCountForWishlistItem: async (wishlistItemId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('wishlist_matches')
      .select('*', { count: 'exact', head: true })
      .eq('wishlist_item_id', wishlistItemId);

    if (error) {
      console.error('Error getting match count:', error);
      return 0;
    }
    return count || 0;
  },

  /**
   * Get all matches for a user (across all wishlist items)
   */
  getAllMatchesForUser: async (userId: string, limit = 50, offset = 0): Promise<WishlistMatchWithDetails[]> => {
    const { data, error } = await supabase
      .from('wishlist_matches')
      .select(`
        *,
        garage_sales (*),
        user_wishlists (*)
      `)
      .eq('user_id', userId)
      .order('matched_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map((match: any) => ({
      id: match.id,
      user_id: match.user_id,
      wishlist_item_id: match.wishlist_item_id,
      garage_sale_id: match.garage_sale_id,
      matched_at: match.matched_at,
      notification_sent: match.notification_sent,
      notification_sent_at: match.notification_sent_at,
      match_confidence: match.match_confidence,
      match_reason: match.match_reason,
      garage_sale: mapGarageSaleRow(match.garage_sales),
      wishlist_item: match.user_wishlists,
    }));
  },

  /**
   * Mark match notification as sent
   */
  markNotificationSent: async (matchId: string): Promise<void> => {
    const { error } = await supabase
      .from('wishlist_matches')
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (error) throw error;
  },
};

// Helper function to check new wishlist item against existing sales
async function checkWishlistItemAgainstExistingSales(
  userId: string,
  wishlistItemId: string
): Promise<void> {
  try {
    // Get the wishlist item
    const { data: wishlistItem, error: wishlistError } = await supabase
      .from('user_wishlists')
      .select('*')
      .eq('id', wishlistItemId)
      .single();

    if (wishlistError || !wishlistItem) return;

    // Get recent active sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSales, error: salesError } = await supabase
      .from('garage_sales')
      .select('*')
      .eq('is_active', true)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (salesError || !recentSales) return;

    // Check each sale for matches (rate-limited to avoid Claude API overload)
    await rateLimitedMatchLoop(recentSales, async (sale) => {
      const matchResult = await matchWishlistAgainstSale(wishlistItem, sale);
      if (matchResult.isMatch) {
        await createMatchRecord(
          userId,
          wishlistItemId,
          sale.id,
          matchResult.confidence,
          matchResult.reason
        );
      }
    });
  } catch (error) {
    console.error('Error in checkWishlistItemAgainstExistingSales:', error);
  }
}

// Helper function to create match record
async function createMatchRecord(
  userId: string,
  wishlistItemId: string,
  garageSaleId: string,
  confidence: 'high' | 'medium' | 'verified',
  reason: string
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('wishlist_matches')
      .insert([{
        user_id: userId,
        wishlist_item_id: wishlistItemId,
        garage_sale_id: garageSaleId,
        match_confidence: confidence,
        match_reason: reason,
      }])
      .select()
      .single();

    if (error) {
      // Ignore duplicate match errors
      if (error.code !== '23505') {
        console.error('Error creating match record:', error);
      }
      return;
    }

    // Send notification (don't await to avoid blocking)
    sendWishlistMatchNotification(userId, data.id).catch(err => {
      console.error('Error sending match notification:', err);
    });
  } catch (err) {
    console.error('Error in createMatchRecord:', err);
  }
}


// Export helper function for use by garageSaleService
export async function checkNewSaleAgainstWishlists(garageSaleId: string): Promise<void> {
  try {
    const { data: garageSale, error: saleError } = await supabase
      .from('garage_sales')
      .select('*')
      .eq('id', garageSaleId)
      .single();

    if (saleError || !garageSale) return;

    // Get all active wishlist items
    const { data: wishlists, error: wishlistError } = await supabase
      .from('user_wishlists')
      .select('*')
      .eq('is_active', true);

    if (wishlistError || !wishlists) return;

    // Check each wishlist item (rate-limited to avoid Claude API overload)
    await rateLimitedMatchLoop(wishlists, async (wishlistItem) => {
      const matchResult = await matchWishlistAgainstSale(wishlistItem, garageSale);
      if (matchResult.isMatch) {
        await createMatchRecord(
          wishlistItem.user_id,
          wishlistItem.id,
          garageSaleId,
          matchResult.confidence,
          matchResult.reason
        );
      }
    });
  } catch (error) {
    console.error('Error in checkNewSaleAgainstWishlists:', error);
  }
}
