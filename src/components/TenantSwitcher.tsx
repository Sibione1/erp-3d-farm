"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function TenantSwitcher() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!currentUserEmail) return null;

  return (
    <div className="p-4 bg-[var(--solar-base03)] rounded-xl border border-[var(--solar-base01)] space-y-3 mb-4 mx-4">
      <div className="flex justify-between items-center gap-2">
        <div className="overflow-hidden">
          <p className="text-[10px] uppercase font-bold text-[var(--solar-base1)]">Minha Conta</p>
          <p className="text-xs font-bold text-[var(--solar-base2)] truncate">{currentUserEmail}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="text-xs px-2.5 py-1 bg-solar-red/15 hover:bg-solar-red/30 text-solar-red font-bold rounded transition-colors shrink-0"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
