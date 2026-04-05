import { supabase } from '@/lib/supabase';

/**
 * Analyze video frames via Supabase Edge Function (Claude API key stays server-side)
 */
export async function analyzeGarageSaleVideo(base64Images: string[]): Promise<{
  title: string;
  description: string;
  categories: string[];
}> {
  const { data, error } = await supabase.functions.invoke('analyze-video', {
    body: { base64Images },
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(`Video analysis failed: ${error.message}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    title: data.title || 'Garage Sale',
    description: data.description || 'Various items for sale',
    categories: data.categories || ['Other'],
  };
}

/**
 * Analyze wishlist match via Supabase Edge Function (Claude API key stays server-side)
 */
export async function analyzeWishlistMatch(
  wishlistItem: { item_name: string; description: string | null; category: string | null },
  garageSale: { title: string; description: string; categories?: string[] }
): Promise<{ isMatch: boolean; reason: string }> {
  const { data, error } = await supabase.functions.invoke('match-wishlist', {
    body: { wishlistItem, garageSale },
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(`Wishlist matching failed: ${error.message}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    isMatch: data.isMatch || false,
    reason: data.reason || 'Unknown',
  };
}
