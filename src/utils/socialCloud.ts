import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export async function fetchPlaylistComments(playlistId: string) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('playlist_comments')
    .select('id, user_nickname, body, created_at')
    .eq('playlist_id', playlistId)
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) return [];
  return data ?? [];
}

export async function postPlaylistComment(playlistId: string, nickname: string, body: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('playlist_comments').insert({
    playlist_id: playlistId,
    user_nickname: nickname,
    body: body.trim().slice(0, 280),
  });
  if (error) throw error;
}

export async function isFollowingCreator(follower: string, creator: string) {
  const supabase = getSupabase();
  if (!supabase || !follower || !creator) return false;
  const { data } = await supabase
    .from('creator_follows')
    .select('id')
    .eq('follower_nickname', follower)
    .eq('creator_nickname', creator)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function toggleFollowCreator(follower: string, creator: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no configurado');
  if (follower === creator) return false;
  const following = await isFollowingCreator(follower, creator);
  if (following) {
    await supabase
      .from('creator_follows')
      .delete()
      .eq('follower_nickname', follower)
      .eq('creator_nickname', creator);
    return false;
  }
  await supabase.from('creator_follows').insert({
    follower_nickname: follower,
    creator_nickname: creator,
  });
  return true;
}
