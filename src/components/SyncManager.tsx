"use client";

import { useEffect } from "react";
import { syncFromSupabase } from "../lib/storage";

export default function SyncManager() {
  useEffect(() => {
    syncFromSupabase();
    
    // Configura um intervalo para sincronizar periodicamente (opcional)
    const interval = setInterval(syncFromSupabase, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
