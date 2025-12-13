export interface GarageSale {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  date: string; // ISO string - kept for backward compatibility
  startDate: string; // ISO string - start date for multi-day events
  endDate: string; // ISO string - end date for multi-day events
  startTime: string; // e.g., "08:00"
  endTime: string; // e.g., "16:00"
  categories: string[]; // e.g., ["furniture", "clothes", "electronics"]
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  images?: string[]; // URLs to images
  videoUrl?: string; // URL to video
  createdAt: string; // ISO string
  isActive: boolean;
  userId?: string; // Optional - only set for authenticated users
}

export type GarageSaleCategory =
  | 'furniture'
  | 'clothing'
  | 'electronics'
  | 'toys'
  | 'books'
  | 'tools'
  | 'kitchen'
  | 'sports'
  | 'other';
