 'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AdminAuth from './Auth';

export default function ProtectedRouteTemp({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const isCheckingAuth = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (isCheckingAuth.current) return;
      isCheckingAuth.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
        isCheckingAuth.current = false;
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Prevent multiple simultaneous auth checks
      if (isCheckingAuth.current) return;
      isCheckingAuth.current = true;
      
      setLoading(true);
      try {
        if (session) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.push('/admin/auth');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        router.push('/admin/auth');
      } finally {
        setLoading(false);
        isCheckingAuth.current = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminAuth />;
  }

  return <>{children}</>;
}