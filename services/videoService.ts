import { supabase } from '@/lib/supabase';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const videoService = {
  // Upload video to Supabase Storage and return public URL
  uploadVideo: async (videoUri: string): Promise<string> => {
    try {
      // Read video file as base64
      const base64 = await readAsStringAsync(videoUri, {
        encoding: EncodingType.Base64,
      });

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('garage-sale-videos')
        .upload(filename, arrayBuffer, {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload video: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('garage-sale-videos')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  // Delete video from Supabase Storage
  deleteVideo: async (videoUrl: string): Promise<void> => {
    try {
      // Extract filename from URL
      const filename = videoUrl.split('/').pop();
      if (!filename) {
        throw new Error('Invalid video URL');
      }

      const { error } = await supabase.storage
        .from('garage-sale-videos')
        .remove([filename]);

      if (error) {
        console.error('Error deleting video:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },
};
