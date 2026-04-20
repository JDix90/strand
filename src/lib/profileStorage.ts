import { supabase } from './supabase';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Upload image to avatars/{userId}/... and return public URL, or null on failure. */
export async function uploadAvatarImage(userId: string, file: File): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED.includes(file.type)) {
    return { error: 'Please use JPEG, PNG, WebP, or GIF.' };
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Image must be 2 MB or smaller.' };
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  const safeExt = ext && /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
  const path = `${userId}/${Date.now()}.${safeExt}`;

  const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (upErr) return { error: upErr.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  if (!data?.publicUrl) return { error: 'Could not get image URL.' };
  return { url: data.publicUrl };
}
