"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function LoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Verifica se já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    
    checkUser();

    // Escuta mudanças de auth (quando logar com sucesso, redireciona)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Remove a necessidade de tenants falsos ("admin", etc)
        sessionStorage.removeItem('active_tenant');
        router.push('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">ERP 3D</h1>
          <p className="text-gray-400">Acesse sua conta ou cadastre-se</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#06b6d4', // cyan-500
                  brandAccent: '#0891b2', // cyan-600
                  inputText: 'white',
                  inputBackground: '#374151', // gray-700
                  inputBorder: '#4b5563', // gray-600
                }
              }
            }
          }}
          theme="dark"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Endereço de E-mail',
                password_label: 'Senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Sua senha',
                link_text: 'Já tem uma conta? Entre'
              },
              sign_up: {
                email_label: 'Endereço de E-mail',
                password_label: 'Crie uma Senha',
                button_label: 'Criar conta',
                loading_button_label: 'Criando conta...',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Sua senha',
                link_text: 'Não tem uma conta? Cadastre-se'
              }
            }
          }}
        />
      </div>
    </div>
  );
}
