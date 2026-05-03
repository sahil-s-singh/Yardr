import { supabase } from '@/lib/supabase';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const BUCKET = 'avatars';

export const avatarService = {
  uploadAvatar: async (userId: string, fileUri: string): Promise<string> => {
    const base64 = await readAsStringAsync(fileUri, {
      encoding: EncodingType.Base64,
    });
    const arrayBuffer = decode(base64);
    const ext = fileUri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Avatar upload error:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  },
};
