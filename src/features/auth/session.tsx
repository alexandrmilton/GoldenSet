import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

type SessionState = {
  session: Session | null;
  /** False until the stored session has been read back from disk. */
  ready: boolean;
};

const SessionContext = createContext<SessionState>({ session: null, ready: false });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setReady(true);
    });

    // Fires on sign-in, sign-out and silent token refresh.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, ready }), [session, ready]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/**
 * Signing out has to succeed locally even when the server refuses.
 *
 * A session whose user was deleted gets a 403 from /auth/v1/logout; without the
 * fallback the stored token would survive and the app would come back up in the
 * same stuck state it was signing out of.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    await supabase.auth.signOut({ scope: 'local' });
  }
}
