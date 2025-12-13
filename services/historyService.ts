import { supabase } from '@/lib/supabase';
import { GarageSale } from '@/types/garageSale';
import { UserSaleView } from '@/types/user';

export const historyService = {
  /**
   * Record a view of a garage sale
   * This is non-blocking and won't throw errors to avoid interrupting user flow
   */
  recordView: async (userId: string, garageSaleId: string): Promise<void> => {
    try {
      const { error } = await supabase.from('user_sale_views').upsert(
        [
          {
            user_id: userId,
            garage_sale_id: garageSaleId,
            viewed_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: 'user_id,garage_sale_id',
        }
      );

      if (error) {
        console.error('Error recording view:', error);
      }
    } catch (error) {
      console.error('Error recording view:', error);
      // Silently fail - this is non-critical functionality
    }
  },

  /**
   * Get user's view history with garage sale details
   */
  getViewHistory: async (userId: string, limit = 50): Promise<GarageSale[]> => {
    const { data, error } = await supabase
      .from('user_sale_views')
      .select(
        `
        garage_sale_id,
        viewed_at,
        garage_sales (*)
      `
      )
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching history:', error);
      throw error;
    }

    // Map database rows to GarageSale format
    return (data || [])
      .map((view: any) => {
        if (!view.garage_sales) return null;
        const sale = view.garage_sales;
        return {
          id: sale.id,
          title: sale.title,
          description: sale.description,
          location: {
            latitude: sale.latitude,
            longitude: sale.longitude,
            address: sale.address,
          },
          date: sale.date,
          startDate: sale.start_date || sale.date,
          endDate: sale.end_date || sale.date,
          startTime: sale.start_time,
          endTime: sale.end_time,
          categories: sale.categories || [],
          contactName: sale.contact_name,
          contactPhone: sale.contact_phone,
          contactEmail: sale.contact_email,
          images: sale.images || [],
          videoUrl: sale.video_url,
          createdAt: sale.created_at,
          isActive: sale.is_active,
          userId: sale.user_id,
        } as GarageSale;
      })
      .filter((sale): sale is GarageSale => sale !== null);
  },

  /**
   * Get view history with timestamps
   */
  getViewHistoryWithTimestamps: async (
    userId: string,
    limit = 50
  ): Promise<
    Array<{
      garageSale: GarageSale;
      viewedAt: string;
    }>
  > => {
    const { data, error } = await supabase
      .from('user_sale_views')
      .select(
        `
        garage_sale_id,
        viewed_at,
        garage_sales (*)
      `
      )
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching history with timestamps:', error);
      throw error;
    }

    return (data || [])
      .map((view: any) => {
        if (!view.garage_sales) return null;
        const sale = view.garage_sales;
        return {
          garageSale: {
            id: sale.id,
            title: sale.title,
            description: sale.description,
            location: {
              latitude: sale.latitude,
              longitude: sale.longitude,
              address: sale.address,
            },
            date: sale.date,
            startDate: sale.start_date || sale.date,
            endDate: sale.end_date || sale.date,
            startTime: sale.start_time,
            endTime: sale.end_time,
            categories: sale.categories || [],
            contactName: sale.contact_name,
            contactPhone: sale.contact_phone,
            contactEmail: sale.contact_email,
            images: sale.images || [],
            videoUrl: sale.video_url,
            createdAt: sale.created_at,
            isActive: sale.is_active,
            userId: sale.user_id,
          } as GarageSale,
          viewedAt: view.viewed_at,
        };
      })
      .filter((item): item is { garageSale: GarageSale; viewedAt: string } => item !== null);
  },

  /**
   * Clear all view history for a user
   */
  clearHistory: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_sale_views')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get count of viewed garage sales
   */
  getHistoryCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('user_sale_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching history count:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Check if user has viewed a specific garage sale
   */
  hasViewed: async (userId: string, garageSaleId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_sale_views')
      .select('id')
      .eq('user_id', userId)
      .eq('garage_sale_id', garageSaleId)
      .maybeSingle();

    if (error) {
      console.error('Error checking view status:', error);
      return false;
    }

    return data !== null;
  },
};
