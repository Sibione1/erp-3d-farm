"use client";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Login desativado a pedido do usuário.
  // O ERP funcionará usando apenas o LocalStorage do navegador.
  return <>{children}</>;
}
