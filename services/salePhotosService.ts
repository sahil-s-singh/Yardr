import { supabase } from '@/lib/supabase';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const BUCKET = 'sale-photos';
const MAX_PHOTOS = 8;

export const salePhotosService = {
  MAX_PHOTOS,

  /**
   * Upload a single local photo URI to Supabase Storage and return its public URL.
   */
  uploadPhoto: async (userId: string, fileUri: string): Promise<string> => {
    const base64 = await readAsStringAsync(fileUri, {
      encoding: EncodingType.Base64,
    });
    const arrayBuffer = decode(base64);
    const ext = (() => {
      const e = fileUri.split('.').pop()?.toLowerCase();
      if (e === 'png') return 'png';
      if (e === 'heic') return 'heic';
      return 'jpg';
    })();
    const path = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const contentType =
      ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType, upsert: false });

    if (error) {
      console.error('Sale photo upload error:', error);
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  },

  /**
   * Upload a list of local URIs in parallel; returns the resulting public URLs
   * in the same order. Local URIs that already look like https URLs are
   * passed through unchanged so callers can mix already-uploaded photos with
   * fresh ones.
   */
  uploadPhotos: async (userId: string, fileUris: string[]): Promise<string[]> => {
    const uploads = fileUris.map((uri) => {
      if (uri.startsWith('http')) return Promise.resolve(uri);
      return salePhotosService.uploadPhoto(userId, uri);
    });
    return Promise.all(uploads);
  },
};
