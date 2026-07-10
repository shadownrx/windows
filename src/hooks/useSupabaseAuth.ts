import { useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export function useSupabaseAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(!isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    if (!supabase) {
      setIsReady(true);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          if (!cancelled) setUserId(sessionData.session.user.id);
          return;
        }

        const { data, error: signErr } = await supabase.auth.signInAnonymously();
        if (signErr) throw signErr;
        if (!cancelled && data.user) setUserId(data.user.id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error de autenticación');
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { userId, isReady, error, isEnabled: isSupabaseConfigured };
}
