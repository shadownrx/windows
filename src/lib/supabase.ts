import { createClient, SupabaseClient } from '@supabase/supabase-js';

function readSupabaseEnv() {
  // VITE_SUPABASE_* es el nombre correcto. VITE_SUPBASE_* cubre el typo frecuente en Vercel.
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPBASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

  const anonKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPBASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPBASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anonKey };
}

const { url, anonKey } = readSupabaseEnv();

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export interface DbGlobalPlaylist {
  id: string;
  name: string;
  cover: string | null;
  tracks: unknown;
  owner_nickname: string;
  owner_user_id: string | null;
  play_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbPlaylistVote {
  id: string;
  playlist_id: string;
  voter_nickname: string;
  user_id: string | null;
  created_at: string;
}

export interface DbPlaylistReaction {
  id: string;
  playlist_id: string;
  emoji: string;
  user_nickname: string;
  user_id: string | null;
  created_at: string;
}

export interface DbUserLibrary {
  user_id: string;
  nickname: string | null;
  favorites: unknown;
  history: unknown;
  updated_at: string;
}
