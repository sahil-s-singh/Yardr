import { supabase } from '@/lib/supabase';
import { matchWishlistAgainstSale } from '@/lib/wishlistMatcher';
import { sendWishlistMatchNotification } from '@/lib/wishlistNotifications';

/**
 * Re-check a garage sale against all wishlists when the sale is updated
 * This will:
 * 1. Delete all existing matches for this sale
 * 2. Re-run matching against all active wishlists
 * 3. Create new matches based on updated content
 */
export async function recheckSaleAgainstWishlists(garageSaleId: string): Promise<void> {
  try {
    console.log(`Re-checking sale ${garageSaleId} against wishlists...`);

    // Step 1: Delete all existing matches for this sale
    const { error: deleteError } = await supabase
      .from('wishlist_matches')
      .delete()
      .eq('garage_sale_id', garageSaleId);

    if (deleteError) {
      console.error('Error deleting old matches:', deleteError);
      // Continue anyway - we'll create new matches
    }

    // Step 2: Get the updated garage sale
    const { data: garageSale, error: saleError } = await supabase
      .from('garage_sales')
      .select('*')
      .eq('id', garageSaleId)
      .single();

    if (saleError || !garageSale) {
      console.error('Error fetching sale:', saleError);
      return;
    }

    // Step 3: Get all active wishlist items
    const { data: wishlists, error: wishlistError } = await supabase
      .from('user_wishlists')
      .select('*')
      .eq('is_active', true);

    if (wishlistError || !wishlists) {
      console.error('Error fetching wishlists:', wishlistError);
      return;
    }

    // Step 4: Check each wishlist item and create new matches
    for (const wishlistItem of wishlists) {
      const matchResult = await matchWishlistAgainstSale(wishlistItem, garageSale);
      if (matchResult.isMatch) {
        // Create match record
        const { data: matchData, error: insertError } = await supabase
          .from('wishlist_matches')
          .insert([{
            user_id: wishlistItem.user_id,
            wishlist_item_id: wishlistItem.id,
            garage_sale_id: garageSaleId,
            match_confidence: matchResult.confidence,
            match_reason: matchResult.reason,
          }])
          .select()
          .single();

        if (insertError) {
          // Ignore duplicate errors (code 23505)
          if (insertError.code !== '23505') {
            console.error('Error creating match:', insertError);
          }
        } else if (matchData) {
          // Send notification (don't await to avoid blocking)
          sendWishlistMatchNotification(wishlistItem.user_id, matchData.id).catch(err => {
            console.error('Error sending match notification:', err);
          });
        }
      }
    }

    console.log(`Finished re-checking sale ${garageSaleId}`);
  } catch (error) {
    console.error('Error in recheckSaleAgainstWishlists:', error);
  }
}
