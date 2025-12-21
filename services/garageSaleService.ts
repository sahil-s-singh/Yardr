import { GarageSale } from '@/types/garageSale';
import { supabase } from '@/lib/supabase';
import { checkNewSaleAgainstWishlists } from './wishlistService';
import { recheckSaleAgainstWishlists } from './matchUpdateService';
import { mapGarageSaleRow } from '@/lib/mappers';
import { calculateDistance } from '@/lib/locationUtils';

// Service functions
export const garageSaleService = {
  // Get all active garage sales
  getAllGarageSales: async (): Promise<GarageSale[]> => {
    try {
      const { data, error } = await supabase
        .from('garage_sales')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return (data || []).map(mapGarageSaleRow);
    } catch (error) {
      console.error('Error fetching garage sales:', error);
      throw error;
    }
  },

  // Get garage sales within a certain radius (in km)
  getGarageSalesNearby: async (
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<GarageSale[]> => {
    try {
      // Get all active sales first
      const { data, error } = await supabase
        .from('garage_sales')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Filter by distance client-side
      const nearby = (data || [])
        .map(mapGarageSaleRow)
        .filter((sale) => {
          const distance = calculateDistance(
            { latitude, longitude },
            { latitude: sale.location.latitude, longitude: sale.location.longitude }
          );
          return distance <= radiusKm;
        });

      return nearby;
    } catch (error) {
      console.error('Error fetching nearby garage sales:', error);
      throw error;
    }
  },

  // Get a single garage sale by ID
  getGarageSaleById: async (id: string): Promise<GarageSale | null> => {
    try {
      const { data, error } = await supabase
        .from('garage_sales')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data ? mapGarageSaleRow(data) : null;
    } catch (error) {
      console.error('Error fetching garage sale:', error);
      return null;
    }
  },

  // Add a new garage sale
  addGarageSale: async (
    sale: Omit<GarageSale, 'id' | 'createdAt'>,
    deviceId?: string,
    userId?: string
  ): Promise<GarageSale> => {
    try {
      const insertData: any = {
        title: sale.title,
        description: sale.description,
        latitude: sale.location.latitude,
        longitude: sale.location.longitude,
        address: sale.location.address,
        date: sale.startDate || sale.date, // Use startDate, fallback to date
        start_date: sale.startDate || sale.date,
        end_date: sale.endDate || sale.startDate || sale.date,
        start_time: sale.startTime,
        end_time: sale.endTime,
        categories: sale.categories,
        contact_name: sale.contactName,
        contact_phone: sale.contactPhone || null,
        contact_email: sale.contactEmail || null,
        images: sale.images || null,
        video_url: sale.videoUrl || null,
        is_active: sale.isActive,
      };

      // Only include device_id if provided (column may not exist yet)
      if (deviceId) {
        insertData.device_id = deviceId;
      }

      // Include user_id if authenticated user is creating the sale
      if (userId) {
        insertData.user_id = userId;
      }

      const { data, error } = await supabase
        .from('garage_sales')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Background: Check new sale against all active wishlists
      checkNewSaleAgainstWishlists(data.id).catch(err => {
        console.error('Error checking sale against wishlists:', err);
      });

      return mapGarageSaleRow(data);
    } catch (error) {
      console.error('Error adding garage sale:', error);
      throw error;
    }
  },

  // Update a garage sale
  updateGarageSale: async (
    id: string,
    updates: Partial<Omit<GarageSale, 'id' | 'createdAt'>>
  ): Promise<GarageSale> => {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.location) {
        updateData.latitude = updates.location.latitude;
        updateData.longitude = updates.location.longitude;
        updateData.address = updates.location.address;
      }
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.categories !== undefined) updateData.categories = updates.categories;
      if (updates.contactName !== undefined) updateData.contact_name = updates.contactName;
      if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
      if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('garage_sales')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // If title or description changed, re-run matching
      if (updates.title !== undefined || updates.description !== undefined) {
        // Background: Delete old matches and re-check sale against all wishlists
        recheckSaleAgainstWishlists(id).catch(err => {
          console.error('Error re-checking sale against wishlists:', err);
        });
      }

      return mapGarageSaleRow(data);
    } catch (error) {
      console.error('Error updating garage sale:', error);
      throw error;
    }
  },

  // Delete (deactivate) a garage sale
  deleteGarageSale: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('garage_sales')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting garage sale:', error);
      throw error;
    }
  },

  // Get garage sales created by a specific user
  getGarageSalesByUser: async (userId: string): Promise<GarageSale[]> => {
    try {
      const { data, error } = await supabase
        .from('garage_sales')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return (data || []).map(mapGarageSaleRow);
    } catch (error) {
      console.error('Error fetching user garage sales:', error);
      throw error;
    }
  },

  // Get garage sales created by a specific device
  getGarageSalesByDevice: async (deviceId: string): Promise<GarageSale[]> => {
    try {
      const { data, error } = await supabase
        .from('garage_sales')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return (data || []).map(mapGarageSaleRow);
    } catch (error) {
      console.error('Error fetching device garage sales:', error);
      throw error;
    }
  },

  // Get garage sales created by either user or device
  getGarageSalesByUserOrDevice: async (
    userId: string | null,
    deviceId: string
  ): Promise<GarageSale[]> => {
    try {
      let query = supabase
        .from('garage_sales')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is logged in, get sales by user_id OR device_id
      // If not logged in, get sales by device_id only
      if (userId) {
        query = query.or(`user_id.eq.${userId},device_id.eq.${deviceId}`);
      } else {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return (data || []).map(mapGarageSaleRow);
    } catch (error) {
      console.error('Error fetching user/device garage sales:', error);
      throw error;
    }
  },

  // Claim all device sales when user signs up/logs in
  claimDeviceSales: async (deviceId: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('claim_device_sales', {
        p_device_id: deviceId,
      });

      if (error) {
        console.error('Supabase error claiming device sales:', error);
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Error claiming device sales:', error);
      throw error;
    }
  },
};

