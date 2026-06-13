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

// Helper para converter snake_case do DB para camelCase do App
const mapFromDb = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    newObj[camelKey] = obj[key];
  }

  // Restore the imageUrls array expected by the UI for projects
  if (newObj.imageUrl) {
    try {
      newObj.imageUrls = JSON.parse(newObj.imageUrl);
      if (!Array.isArray(newObj.imageUrls)) {
        newObj.imageUrls = [newObj.imageUrl];
      }
    } catch {
      newObj.imageUrls = [newObj.imageUrl];
    }
    delete newObj.imageUrl;
  } else if (!newObj.imageUrls) {
    newObj.imageUrls = [];
  }

  return newObj;
};

// Mapeador seguro para DB: Envia apenas colunas existentes no Supabase dependendo da tabela
const mapToDb = (table: string, obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  
  const mapIfPresent = (localKey: string, dbKey: string, transform?: (val: any) => any) => {
    if (localKey in obj) {
      newObj[dbKey] = transform ? transform(obj[localKey]) : obj[localKey];
    }
  };

  if (table === 'filaments') {
    mapIfPresent('id', 'id');
    mapIfPresent('brand', 'brand');
    mapIfPresent('material', 'material');
    mapIfPresent('colorName', 'color_name');
    mapIfPresent('colorHex', 'color_hex');
    mapIfPresent('initialWeightG', 'initial_weight_g');
    mapIfPresent('currentWeightG', 'current_weight_g');
    mapIfPresent('purchaseCost', 'purchase_cost');
    mapIfPresent('tempPrintStart', 'temp_print_start');
    mapIfPresent('tempPrintEnd', 'temp_print_end');
    mapIfPresent('tempBedStart', 'temp_bed_start');
    mapIfPresent('tempBedEnd', 'temp_bed_end');
    mapIfPresent('createdAt', 'created_at');
  } else if (table === 'clients') {
    mapIfPresent('id', 'id');
    mapIfPresent('fullName', 'full_name');
    mapIfPresent('companyName', 'company_name');
    mapIfPresent('phone', 'phone');
    mapIfPresent('email', 'email');
    mapIfPresent('billingAddress', 'billing_address');
    mapIfPresent('cpfCnpj', 'cpf_cnpj');
    mapIfPresent('rgIe', 'rg_ie');
    mapIfPresent('postalCode', 'postal_code');
    mapIfPresent('street', 'street');
    mapIfPresent('number', 'address_number');
    mapIfPresent('complement', 'complement');
    mapIfPresent('neighborhood', 'neighborhood');
    mapIfPresent('city', 'city');
    mapIfPresent('state', 'state');
    mapIfPresent('notes', 'notes');
    mapIfPresent('createdAt', 'created_at');
  } else if (table === 'projects') {
    mapIfPresent('id', 'id');
    mapIfPresent('name', 'name');
    mapIfPresent('description', 'description');
    if ('imageUrls' in obj) {
      newObj.image_url = obj.imageUrls && obj.imageUrls.length > 0 ? JSON.stringify(obj.imageUrls) : null;
    }
    mapIfPresent('estimatedPrintTimeMinutes', 'estimated_print_time_minutes');
    mapIfPresent('estimatedConsumptionG', 'estimated_consumption_g');
    mapIfPresent('successRate', 'success_rate');
    if ('filamentsUsage' in obj) {
      newObj.filaments_usage = JSON.stringify(obj.filamentsUsage);
    }
    mapIfPresent('createdAt', 'created_at');
  } else if (table === 'orders') {
    mapIfPresent('id', 'id');
    mapIfPresent('clientId', 'client_id');
    mapIfPresent('orderNumber', 'order_number');
    mapIfPresent('isQuote', 'is_quote');
    mapIfPresent('paymentStatus', 'payment_status');
    mapIfPresent('paymentMethod', 'payment_method');
    mapIfPresent('machineCost', 'machine_cost');
    mapIfPresent('filamentCost', 'filament_cost');
    mapIfPresent('shippingCost', 'shipping_cost');
    mapIfPresent('marginPercentage', 'margin_percentage');
    mapIfPresent('estimatedDeliveryDate', 'estimated_delivery_date');
    if ('items' in obj) {
      const firstItem = obj.items && obj.items.length > 0 ? obj.items[0] : null;
      newObj.project_id = firstItem?.projectId || null;
      newObj.filament_id = firstItem?.filamentsUsage && firstItem.filamentsUsage.length > 0 ? firstItem.filamentsUsage[0].filamentId : null;
      newObj.printer_id = firstItem?.machineId || null;
      newObj.items = JSON.stringify(obj.items);
    }
    mapIfPresent('status', 'status');
    mapIfPresent('calculatedCost', 'calculated_cost');
    mapIfPresent('finalPrice', 'final_price');
    mapIfPresent('createdAt', 'created_at');
  } else if (table === 'printers') {
    mapIfPresent('id', 'id');
    mapIfPresent('name', 'name');
    mapIfPresent('model', 'model');
    mapIfPresent('depreciationCostPerHour', 'depreciation_cost_per_hour');
    mapIfPresent('energyConsumptionKwPerHour', 'energy_consumption_kw_per_hour');
    mapIfPresent('createdAt', 'created_at');
  } else if (table === 'transactions') {
    mapIfPresent('id', 'id');
    mapIfPresent('date', 'date');
    mapIfPresent('amount', 'amount');
    mapIfPresent('type', 'type');
    mapIfPresent('category', 'category');
    mapIfPresent('description', 'description');
    mapIfPresent('createdAt', 'created_at');
  } else {
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
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

// --- SYNC HELPERS (Type-safe and failsafe async calls) ---
const syncInsert = async (table: string, record: any) => {
  try {
    const { error } = await supabase.from(table).insert([record]);
    if (error) console.error(`Erro ao inserir em ${table}:`, error.message);
  } catch (e) {
    console.error(`Erro ao inserir em ${table}:`, e);
  }
};

const syncUpdate = async (table: string, id: string, record: any) => {
  try {
    const { error } = await supabase.from(table).update(record).eq('id', id);
    if (error) console.error(`Erro ao atualizar ${table}:`, error.message);
  } catch (e) {
    console.error(`Erro ao atualizar ${table}:`, e);
  }
};

const syncDelete = async (table: string, id: string) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error(`Erro ao deletar de ${table}:`, error.message);
  } catch (e) {
    console.error(`Erro ao deletar de ${table}:`, e);
  }
};

// --- SYNC ENGINE ---
export const syncFromSupabase = async () => {
  if (!isBrowser) return;
  try {
    const { data: filaments } = await supabase.from('filaments').select('*');
    if (filaments && filaments.length > 0) {
      setStorageData('filaments', filaments.map(mapFromDb));
    }

    const { data: clients } = await supabase.from('clients').select('*');
    if (clients && clients.length > 0) {
      setStorageData('clients', clients.map(mapFromDb));
    }

    const { data: projects } = await supabase.from('projects').select('*');
    if (projects && projects.length > 0) {
      setStorageData('projects', projects.map(mapFromDb));
    }

    const { data: printers } = await supabase.from('printers').select('*');
    if (printers && printers.length > 0) {
      setStorageData('printers', printers.map(mapFromDb));
    }

    const { data: orders } = await supabase.from('orders').select('*');
    if (orders && orders.length > 0) {
      const mappedOrders = orders.map(mapFromDb).map((o: any) => {
        if (typeof o.items === 'string') {
          try { o.items = JSON.parse(o.items); } catch(e) {}
        }
        return o;
      });
      setStorageData('orders', mappedOrders);
    }
    
    const { data: transactions } = await supabase.from('transactions').select('*');
    if (transactions && transactions.length > 0) {
      setStorageData('transactions', transactions.map(mapFromDb));
    }
  } catch (e) {
    console.error('Erro de sincronização com Supabase:', e);
  }
};

// --- CRUD Operations ---

export const addFilament = (filament: Omit<Filament, 'id' | 'createdAt'>) => {
  const filaments = getStorageData<Filament>('filaments');
  const newFilament: Filament = {
    ...filament,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('filaments', [...filaments, newFilament]);
  syncInsert('filaments', mapToDb('filaments', newFilament));
  return newFilament;
};

export const updateFilament = (id: string, data: Partial<Filament>) => {
  const filaments = getStorageData<Filament>('filaments');
  const index = filaments.findIndex(f => f.id === id);
  if (index !== -1) {
    filaments[index] = { ...filaments[index], ...data };
    setStorageData('filaments', filaments);
    syncUpdate('filaments', id, mapToDb('filaments', data));
  }
};

export const deleteFilament = (id: string) => {
  const filaments = getStorageData<Filament>('filaments');
  setStorageData('filaments', filaments.filter(f => f.id !== id));
  syncDelete('filaments', id);
};

export const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
  const clients = getStorageData<Client>('clients');
  const newClient: Client = {
    ...client,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('clients', [...clients, newClient]);
  syncInsert('clients', mapToDb('clients', newClient));
  return newClient;
};

export const updateClient = (id: string, data: Partial<Client>) => {
  const clients = getStorageData<Client>('clients');
  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients[index] = { ...clients[index], ...data };
    setStorageData('clients', clients);
    syncUpdate('clients', id, mapToDb('clients', data));
  }
};

export const deleteClient = (id: string) => {
  const clients = getStorageData<Client>('clients');
  setStorageData('clients', clients.filter(c => c.id !== id));
  syncDelete('clients', id);
};

export const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
  const projects = getStorageData<Project>('projects');
  const newProject: Project = {
    ...project,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('projects', [...projects, newProject]);
  syncInsert('projects', mapToDb('projects', newProject));
  return newProject;
};

export const updateProject = (id: string, data: Partial<Project>) => {
  const projects = getStorageData<Project>('projects');
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...data };
    setStorageData('projects', projects);
    syncUpdate('projects', id, mapToDb('projects', data));
  }
};

export const deleteProject = (id: string) => {
  const projects = getStorageData<Project>('projects');
  setStorageData('projects', projects.filter(p => p.id !== id));
  syncDelete('projects', id);
};

export const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
  const orders = getStorageData<Order>('orders');
  const newOrder: Order = {
    ...order,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('orders', [...orders, newOrder]);
  syncInsert('orders', mapToDb('orders', newOrder));
  return newOrder;
};

export const updateOrder = (id: string, data: Partial<Order>) => {
  const orders = getStorageData<Order>('orders');
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...data };
    setStorageData('orders', orders);
    syncUpdate('orders', id, mapToDb('orders', data));
  }
};

export const deleteOrder = (id: string) => {
  const orders = getStorageData<Order>('orders');
  setStorageData('orders', orders.filter(o => o.id !== id));
  syncDelete('orders', id);
};

export const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
  const transactions = getStorageData<Transaction>('transactions');
  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('transactions', [...transactions, newTransaction]);
  syncInsert('transactions', mapToDb('transactions', newTransaction));
  return newTransaction;
};

export const updateTransaction = (id: string, data: Partial<Transaction>) => {
  const transactions = getStorageData<Transaction>('transactions');
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...data };
    setStorageData('transactions', transactions);
    syncUpdate('transactions', id, mapToDb('transactions', data));
  }
};

export const deleteTransaction = (id: string) => {
  const transactions = getStorageData<Transaction>('transactions');
  setStorageData('transactions', transactions.filter(t => t.id !== id));
  syncDelete('transactions', id);
};

export const addPrinter = (printer: Omit<Printer, 'id' | 'createdAt'>) => {
  const printers = getStorageData<Printer>('printers');
  const newPrinter: Printer = {
    ...printer,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('printers', [...printers, newPrinter]);
  syncInsert('printers', mapToDb('printers', newPrinter));
  return newPrinter;
};

export const updatePrinter = (id: string, data: Partial<Printer>) => {
  const printers = getStorageData<Printer>('printers');
  const index = printers.findIndex(p => p.id === id);
  if (index !== -1) {
    printers[index] = { ...printers[index], ...data };
    setStorageData('printers', printers);
    syncUpdate('printers', id, mapToDb('printers', data));
  }
};

export const deletePrinter = (id: string) => {
  const printers = getStorageData<Printer>('printers');
  setStorageData('printers', printers.filter(p => p.id !== id));
  syncDelete('printers', id);
};

export const getSystemSettings = (): SystemSettings => {
  if (!isBrowser) return {};
  const data = localStorage.getItem('system_settings');
  if (!data) {
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
