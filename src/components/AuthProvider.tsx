"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { syncFromSupabase } from '../lib/storage';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = pathname === '/login' || pathname === '/cadastro';

  useEffect(() => {
    // Verifica a sessão atual no Supabase
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        if (session) {
          syncFromSupabase();
        }
      } catch (e) {
        console.error("Erro ao verificar sessão:", e);
        setIsAuthenticated(false);
      }
    };
    checkSession();

    // Escuta mudanças de autenticação (login, logout, etc)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        syncFromSupabase();
      } else if (!isAuthRoute) {
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router, isAuthRoute]);

  // Se estiver na rota de login/cadastro, renderiza imediatamente sem mostrar o loader
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Enquanto verifica o status de auth (inicialmente null), exibe o loader
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--solar-base03)] text-[var(--solar-base1)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--solar-yellow)]"></div>
          <p className="text-sm font-semibold tracking-wider font-mono">Carregando ERP SaaS...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado e tentar acessar área restrita, redireciona
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
