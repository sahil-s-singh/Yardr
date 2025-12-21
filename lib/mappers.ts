import { GarageSale } from '@/types/garageSale';

/**
 * Database row type from Supabase garage_sales table
 */
export interface GarageSaleRow {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  date: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  categories: string[];
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  images: string[] | null;
  video_url: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
}

/**
 * Converts a database row (snake_case) to the app's GarageSale model (camelCase)
 * This mapper is used across multiple services to ensure consistency
 */
export const mapGarageSaleRow = (row: GarageSaleRow): GarageSale => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
    },
    date: row.date,
    startDate: row.start_date || row.date, // Fallback to date for backward compatibility
    endDate: row.end_date || row.date, // Fallback to date for backward compatibility
    startTime: row.start_time,
    endTime: row.end_time,
    categories: row.categories,
    contactName: row.contact_name,
    contactPhone: row.contact_phone || undefined,
    contactEmail: row.contact_email || undefined,
    images: row.images || undefined,
    videoUrl: row.video_url || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    userId: row.user_id || undefined,
  };
};
