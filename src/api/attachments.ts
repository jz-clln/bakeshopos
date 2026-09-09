// File: app/src/api/attachments.ts
//
// Handles uploading an owner-selected image to Supabase Storage
// before sending it. The webhook (server-side) handles incoming
// customer images separately, using the service role key instead.

import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export async function uploadMessageAttachment(
  organizationId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files can be sent.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image is too large (max 8MB).');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${organizationId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('message-attachments')
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('message-attachments').getPublicUrl(path);
  return data.publicUrl;
}