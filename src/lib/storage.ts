"use client";

import { Filament, Client, Project, Order, Transaction, Printer, SystemSettings } from '../types';
import { supabase } from './supabase';

const isBrowser = typeof window !== 'undefined';

export const getStorageData = <T>(key: string): T[] => {
  if (!isBrowser) return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setStorageData = (key: string, data: any[]) => {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('storage-updated'));
};

// --- SYNC ENGINE ---
export const syncFromSupabase = async () => {
  if (!isBrowser) return;
  // Integração Supabase Desabilitada conforme solicitado pelo usuário para evitar sobrescrita do LocalStorage.
  return;
};

// Helper para converter snake_case do DB para camelCase do App
const mapFromDb = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

const mapToDb = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
};

// Helper para ID local
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helpers for specific entities
export const addFilament = (filament: Omit<Filament, 'id' | 'createdAt'>) => {
  const filaments = getStorageData<Filament>('filaments');
  const newFilament: Filament = {
    ...filament,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('filaments', [...filaments, newFilament]);
  // supabase.from('filaments').insert([mapToDb(newFilament)]).then().catch(() => {});
  return newFilament;
};

export const updateFilament = (id: string, data: Partial<Filament>) => {
  const filaments = getStorageData<Filament>('filaments');
  const index = filaments.findIndex(f => f.id === id);
  if (index !== -1) {
    filaments[index] = { ...filaments[index], ...data };
    setStorageData('filaments', filaments);
    // supabase.from('filaments').update(mapToDb(data)).eq('id', id).then().catch(() => {});
  }
};

export const deleteFilament = (id: string) => {
  const filaments = getStorageData<Filament>('filaments');
  setStorageData('filaments', filaments.filter(f => f.id !== id));
  // supabase.from('filaments').delete().eq('id', id).then().catch(() => {});
};

export const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
  const clients = getStorageData<Client>('clients');
  const newClient: Client = {
    ...client,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('clients', [...clients, newClient]);
  // supabase.from('clients').insert([mapToDb(newClient)]).then().catch(() => {});
  return newClient;
};

export const updateClient = (id: string, data: Partial<Client>) => {
  const clients = getStorageData<Client>('clients');
  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients[index] = { ...clients[index], ...data };
    setStorageData('clients', clients);
    // supabase.from('clients').update(mapToDb(data)).eq('id', id).then().catch(() => {});
  }
};

export const deleteClient = (id: string) => {
  const clients = getStorageData<Client>('clients');
  setStorageData('clients', clients.filter(c => c.id !== id));
  // supabase.from('clients').delete().eq('id', id).then().catch(() => {});
};

export const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
  const projects = getStorageData<Project>('projects');
  const newProject: Project = {
    ...project,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('projects', [...projects, newProject]);
  // supabase.from('projects').insert([mapToDb(newProject)]).then().catch(() => {});
  return newProject;
};

export const updateProject = (id: string, data: Partial<Project>) => {
  const projects = getStorageData<Project>('projects');
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...data };
    setStorageData('projects', projects);
    // supabase.from('projects').update(mapToDb(data)).eq('id', id).then().catch(() => {});
  }
};

export const deleteProject = (id: string) => {
  const projects = getStorageData<Project>('projects');
  setStorageData('projects', projects.filter(p => p.id !== id));
  // supabase.from('projects').delete().eq('id', id).then().catch(() => {});
};

export const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
  const orders = getStorageData<Order>('orders');
  const newOrder: Order = {
    ...order,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('orders', [...orders, newOrder]);
  // supabase.from('orders').insert([mapToDb(newOrder)]).then().catch(() => {});
  return newOrder;
};

export const updateOrder = (id: string, data: Partial<Order>) => {
  const orders = getStorageData<Order>('orders');
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...data };
    setStorageData('orders', orders);
    // supabase.from('orders').update(mapToDb(data)).eq('id', id).then().catch(() => {});
  }
};

export const deleteOrder = (id: string) => {
  const orders = getStorageData<Order>('orders');
  setStorageData('orders', orders.filter(o => o.id !== id));
  // supabase.from('orders').delete().eq('id', id).then().catch(() => {});
};

export const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
  const transactions = getStorageData<Transaction>('transactions');
  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('transactions', [...transactions, newTransaction]);
  // supabase.from('transactions').insert([mapToDb(newTransaction)]).then().catch(() => {});
  return newTransaction;
};

export const updateTransaction = (id: string, data: Partial<Transaction>) => {
  const transactions = getStorageData<Transaction>('transactions');
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...data };
    setStorageData('transactions', transactions);
    // supabase.from('transactions').update(mapToDb(data)).eq('id', id).then().catch(() => {});
  }
};

export const deleteTransaction = (id: string) => {
  const transactions = getStorageData<Transaction>('transactions');
  setStorageData('transactions', transactions.filter(t => t.id !== id));
  // supabase.from('transactions').delete().eq('id', id).then().catch(() => {});
};

export const addPrinter = (printer: Omit<Printer, 'id' | 'createdAt'>) => {
  const printers = getStorageData<Printer>('printers');
  const newPrinter: Printer = {
    ...printer,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('printers', [...printers, newPrinter]);
  // supabase.from('printers').insert([mapToDb(newPrinter)]).then().catch(() => {});
  return newPrinter;
};

export const updatePrinter = (id: string, data: Partial<Printer>) => {
  const printers = getStorageData<Printer>('printers');
  const index = printers.findIndex(p => p.id === id);
  if (index !== -1) {
    printers[index] = { ...printers[index], ...data };
    setStorageData('printers', printers);
    // supabase.from('printers').update(mapToDb(data)).eq('id', id).then().catch(() => {});
  }
};

export const deletePrinter = (id: string) => {
  const printers = getStorageData<Printer>('printers');
  setStorageData('printers', printers.filter(p => p.id !== id));
  // supabase.from('printers').delete().eq('id', id).then().catch(() => {});
};

export const getSystemSettings = (): SystemSettings => {
  if (!isBrowser) return {};
  const data = localStorage.getItem('system_settings');
  if (!data) {
    // Default system settings
    return {
      quoteHourBasePrice: 18.0,
      quoteValidityDays: 15,
      whatsappQuoteTemplate: `Olá {cliente_nome}! Tudo bem?\n\nO orçamento *{orcamento_numero}* da *{empresa_nome}* ficou pronto!\n\n*Itens:*\n{orcamento_itens}\n*Frete:* R$ {orcamento_frete}\n*Valor Total:* R$ {orcamento_total}\n*Prazo Estimado:* {orcamento_prazo}\n\nO que acha? Podemos dar andamento na produção?`,
      whatsappOrderTemplate: `Olá {cliente_nome}!\n\nSeu pedido *{pedido_numero}* está com o status: *{pedido_status}*.\n\nQualquer dúvida, estamos à disposição!`,
      emailQuoteSubjectTemplate: `Orçamento {orcamento_numero} - {empresa_nome}`,
      emailQuoteBodyTemplate: `Prezado(a) {cliente_nome},\n\nSegue o orçamento referente à sua solicitação:\n\nNúmero: {orcamento_numero}\nData: {orcamento_data}\n\nItens:\n{orcamento_itens}\n\nValor do Frete: R$ {orcamento_frete}\nValor Total: R$ {orcamento_total}\n\nPrazo de entrega estimado: {orcamento_prazo}\n\nTermos:\n{orcamento_termos}\n\nPara aprovar ou tirar dúvidas, entre em contato conosco.\n\nAtenciosamente,\n{empresa_nome}\n{usuario_nome}`,
      quoteTermsConditions: `1. O prazo de entrega começa a contar a partir da confirmação do pagamento do sinal.\n2. Orçamento válido por {validade_dias} dias.\n3. Projetos sob medida podem ter variação no tempo final de produção.`
    };
  }
  return JSON.parse(data);
};

export const updateSystemSettings = (data: Partial<SystemSettings>) => {
  const current = getSystemSettings();
  const updated = { ...current, ...data };
  localStorage.setItem('system_settings', JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-updated'));
};

