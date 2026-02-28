import { supabase, isSupabaseConfigured } from './supabase'

// ── Storage Layer ───────────────────────────────────────
// Uploads generated assets (audio, video, thumbnails) to Supabase Storage
// Bucket: "assets" — create this in Supabase Dashboard > Storage

const BUCKET = 'assets'

export async function uploadAudio(
  userId: string, videoId: string, audioData: Buffer | ArrayBuffer
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const path = `${userId}/${videoId}/audio.mp3`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, audioData, { contentType: 'audio/mpeg', upsert: true })
  if (error) { console.error('Upload audio error:', error); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadVideo(
  userId: string, videoId: string, videoData: Buffer | ArrayBuffer
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const path = `${userId}/${videoId}/video.mp4`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, videoData, { contentType: 'video/mp4', upsert: true })
  if (error) { console.error('Upload video error:', error); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadThumbnail(
  userId: string, videoId: string, imageData: Buffer | ArrayBuffer
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const path = `${userId}/${videoId}/thumbnail.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageData, { contentType: 'image/jpeg', upsert: true })
  if (error) { console.error('Upload thumbnail error:', error); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteAssets(userId: string, videoId: string) {
  if (!isSupabaseConfigured()) return
  const prefix = `${userId}/${videoId}/`
  const { data: files } = await supabase.storage.from(BUCKET).list(prefix)
  if (files && files.length > 0) {
    const paths = files.map(f => `${prefix}${f.name}`)
    await supabase.storage.from(BUCKET).remove(paths)
  }
}

export function getAssetUrl(path: string): string {
  if (!isSupabaseConfigured()) return ''
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ── Storage Setup SQL ───────────────────────────────────
// Run in Supabase SQL Editor:
export const STORAGE_SETUP = `
-- Create storage bucket (run in Supabase Dashboard > Storage > New Bucket)
-- Name: assets
-- Public: true
-- File size limit: 100MB

-- Storage policies
CREATE POLICY "Users upload own assets" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own assets" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own assets" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');
`
