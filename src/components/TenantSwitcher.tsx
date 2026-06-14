"use client";

import { useState, useEffect } from 'react';

export default function TenantSwitcher() {
  const [role, setRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTenant, setActiveTenant] = useState<string>('admin');

  useEffect(() => {
    setRole(sessionStorage.getItem('user_role'));
    setCurrentUser(sessionStorage.getItem('logged_in_user'));
    setActiveTenant(sessionStorage.getItem('active_tenant') || 'admin');

    const handleStorage = () => {
      setActiveTenant(sessionStorage.getItem('active_tenant') || 'admin');
    };

    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleTenantChange = (newTenant: string) => {
    sessionStorage.setItem('active_tenant', newTenant);
    setActiveTenant(newTenant);
    
    // Also update company name helper in session
    const company = newTenant === 'admin' ? 'Admin Farm' : 'Bruna 3D';
    sessionStorage.setItem('company_name', company);

    // Dispatch update to reload all state
    window.dispatchEvent(new Event('storage-updated'));
    window.location.reload();
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  if (!currentUser) return null;

  return (
    <div className="p-4 bg-[var(--solar-base03)] rounded-xl border border-[var(--solar-base01)] space-y-3 mb-4 mx-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] uppercase font-bold text-[var(--solar-base1)]">Usuário Logado</p>
          <p className="text-sm font-bold text-[var(--solar-base2)] capitalize">{currentUser}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="text-xs px-2.5 py-1 bg-solar-red/15 hover:bg-solar-red/30 text-solar-red font-bold rounded transition-colors"
        >
          Sair
        </button>
      </div>

      {role === 'admin' && (
        <div className="pt-2 border-t border-[var(--solar-base01)]">
          <label className="block text-[10px] uppercase font-bold text-[var(--solar-base1)] mb-1.5">Alternar Empresa</label>
          <select 
            value={activeTenant} 
            onChange={(e) => handleTenantChange(e.target.value)}
            className="w-full bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded px-2.5 py-1.5 text-xs text-[var(--solar-base0)] font-bold focus:outline-none focus:border-[var(--solar-yellow)]"
          >
            <option value="admin">Admin Farm (Geral)</option>
            <option value="bruna">Bruna 3D</option>
          </select>
        </div>
      )}
    </div>
  );
}
