"use client";

import { useState, useEffect } from 'react';
import { getSystemSettings } from '../lib/storage';
import { SystemSettings } from '../types';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const sysSettings = getSystemSettings();
    setSettings(sysSettings);

    const sessionAuth = sessionStorage.getItem('is_authenticated') === 'true';

    if (!sysSettings.securityEnabled) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(sessionAuth);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();

    // Listen to changes in settings (e.g. if the user turns on/off auth from config page)
    const handleStorageUpdate = () => {
      checkAuth();
    };

    window.addEventListener('storage-updated', handleStorageUpdate);
    return () => window.removeEventListener('storage-updated', handleStorageUpdate);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const expectedUser = settings.securityUsername || 'admin';
    const expectedPass = settings.securityPassword || 'admin';

    if (usernameInput === expectedUser && passwordInput === expectedPass) {
      sessionStorage.setItem('is_authenticated', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Usuário ou senha incorretos!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--solar-base03)] text-[var(--solar-base1)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--solar-yellow)]"></div>
          <p className="text-sm font-semibold tracking-wider font-mono">Carregando ERP 3D Farm...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--solar-base03)] relative overflow-hidden px-4">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--solar-yellow)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--solar-blue)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-[var(--solar-base03)] rounded-2xl border border-[var(--solar-base01)] mb-4 shadow-inner">
              <span className="text-4xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--solar-base2)]">ERP 3D Farm</h2>
            <p className="text-[var(--solar-base1)] text-sm mt-2">O acesso a este painel está protegido. Insira suas credenciais.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-[var(--solar-red)] bg-opacity-10 border border-[var(--solar-red)] border-opacity-30 text-[var(--solar-red)] p-3 rounded-lg text-sm text-center font-semibold">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--solar-base1)] mb-2">Usuário</label>
              <input
                type="text"
                required
                placeholder="Digite seu usuário"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded-xl px-4 py-3 text-[var(--solar-base0)] placeholder-[var(--solar-base01)] focus:outline-none focus:border-[var(--solar-yellow)] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--solar-base1)] mb-2">Senha</label>
              <input
                type="password"
                required
                placeholder="Digite sua senha"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded-xl px-4 py-3 text-[var(--solar-base0)] placeholder-[var(--solar-base01)] focus:outline-none focus:border-[var(--solar-yellow)] transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--solar-yellow)] text-[var(--solar-base03)] py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[rgba(181,137,0,0.2)] mt-2"
            >
              Desbloquear Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
