"use client";

import { usePathname } from "next/navigation";
import AuthProvider from "../AuthProvider";
import TenantSwitcher from "../TenantSwitcher";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/cadastro";

  return (
    <AuthProvider>
      {!isAuthPage && (
        <aside className="w-64 bg-[var(--solar-base02)] border-r border-[var(--solar-base01)] flex flex-col hidden md:flex no-print">
          <div className="p-6 flex items-center gap-3">
            <img src="/logo-modu.png" alt="MODU Logo" className="h-10 w-auto rounded object-contain" />
            <h1 className="text-xl font-bold text-[var(--solar-yellow)]">ERP 3D</h1>
          </div>
          
          <TenantSwitcher />
          
          <nav className="flex-1 px-4 space-y-2">
            <a href="/" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Dashboard</a>
            <a href="/filamentos" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Filamentos</a>
            <a href="/clientes" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Clientes</a>
            <a href="/projetos" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Projetos</a>
            <a href="/orcamentos" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Orçamentos</a>
            <a href="/pedidos" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Pedidos</a>
            <a href="/maquinas" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Máquinas (Frota)</a>
            <a href="/financeiro" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors">Financeiro</a>
            <a href="/configuracoes" className="block py-2 px-4 rounded hover:bg-[var(--solar-base01)] text-[var(--solar-base1)] hover:text-[var(--solar-base3)] transition-colors border-t border-[var(--solar-base01)] pt-4 mt-4">⚙️ Configurações</a>
          </nav>
        </aside>
      )}
      
      <main className={`flex-1 overflow-y-auto ${!isAuthPage ? 'p-8 bg-[var(--solar-base03)]' : ''}`}>
        {children}
      </main>
    </AuthProvider>
  );
}
