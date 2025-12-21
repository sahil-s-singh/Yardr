import { supabase } from '@/lib/supabase';
import { GarageSale } from '@/types/garageSale';
import { UserFavorite } from '@/types/user';
import { mapGarageSaleRow } from '@/lib/mappers';

export const favoritesService = {
  /**
   * Add a garage sale to favorites
   */
  addFavorite: async (userId: string, garageSaleId: string): Promise<UserFavorite> => {
    const { data, error } = await supabase
      .from('user_favorites')
      .insert([
        {
          user_id: userId,
          garage_sale_id: garageSaleId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a garage sale from favorites
   */
  removeFavorite: async (userId: string, garageSaleId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('garage_sale_id', garageSaleId);

    if (error) throw error;
  },

  /**
   * Check if a garage sale is favorited by the user
   */
  isFavorited: async (userId: string, garageSaleId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('garage_sale_id', garageSaleId)
      .maybeSingle();

    if (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }

    return data !== null;
  },

  /**
   * Get all favorited garage sales for a user with full details
   */
  getUserFavorites: async (userId: string): Promise<GarageSale[]> => {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(
        `
        garage_sale_id,
        created_at,
        garage_sales (*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }

    // Map database rows to GarageSale format
    return (data || [])
      .map((fav: any) => {
        if (!fav.garage_sales) return null;
        return mapGarageSaleRow(fav.garage_sales);
      })
      .filter((sale): sale is GarageSale => sale !== null);
  },

  /**
   * Get list of favorite garage sale IDs for quick lookups
   */
  getFavoriteIds: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('garage_sale_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorite IDs:', error);
      return [];
    }

    return (data || []).map((fav) => fav.garage_sale_id);
  },

  /**
   * Get count of favorites for a user
   */
  getFavoritesCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorites count:', error);
      return 0;
    }

    return count || 0;
  },
};
