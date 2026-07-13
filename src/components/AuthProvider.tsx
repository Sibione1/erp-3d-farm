"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verifica a sessão atual no Supabase
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkSession();

    // Escuta mudanças de autenticação (login, logout, etc)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (!session && pathname !== '/login' && pathname !== '/cadastro') {
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

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

  // Se não estiver logado e a rota não for /login, redireciona. 
  // Caso a rota SEJA /login, quem renderiza é o próprio arquivo de rota.
  if (!isAuthenticated && pathname !== '/login' && pathname !== '/cadastro') {
    router.push('/login');
    return null;
  }

  // Se estiver logado ou na página pública de login, renderiza a tela normalmente
  return <>{children}</>;
}
