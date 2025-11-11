import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    async function init() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!ignore) {
        if (!error) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
        setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/login'];
    const isPublic = publicRoutes.includes(router.pathname);

    if (!user && !isPublic) {
      router.replace('/login');
    }

    if (user && router.pathname === '/login') {
      router.replace('/');
    }
  }, [loading, user, router.pathname]);

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error) {
      router.replace('/');
    }
    return result;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/login');
    }
    return { error };
  };

  const value = useMemo(
    () => ({ user, session, loading, signIn, signOut }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
