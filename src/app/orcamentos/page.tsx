"use client";

import { useState, useEffect } from 'react';
import { Order, OrderItem, Client, Project, Filament, SystemSettings } from '../../types';
import { getStorageData, addOrder, deleteOrder, updateOrder, getSystemSettings } from '../../lib/storage';
import ClientModal from '../../components/ClientModal';
import ProjectModal from '../../components/ProjectModal';

const MACHINE_COST_PER_HOUR = 0.50; // Custo fixo estimado por hora (Energia + Depreciação)

export default function OrcamentosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingQuoteItemId, setEditingQuoteItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  // Orçamento Principal
  const [clientId, setClientId] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [quoteItems, setQuoteItems] = useState<OrderItem[]>([]);
  const [cepDestino, setCepDestino] = useState('');
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [customTotalPrice, setCustomTotalPrice] = useState<number | null>(null);

  // Item Form
  const [itemFormData, setItemFormData] = useState<{
    projectId: string;
    filamentsUsage: { filamentId: string; grams: number }[];
    quantity: number;
    margin: number;
  }>({
    projectId: '',
    filamentsUsage: [],
    quantity: 1,
    margin: 100, // Default 100% Markup
  });
  const [manualPrice, setManualPrice] = useState<number | null>(null);

  // Modal States
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const loadData = () => {
    setOrders(getStorageData<Order>('orders'));
    setClients(getStorageData<Client>('clients'));
    setProjects(getStorageData<Project>('projects'));
    setFilaments(getStorageData<Filament>('filaments'));
    setSettings(getSystemSettings());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const quotes = orders.filter(o => o.isQuote);

  const filteredQuotes = quotes.filter(order => {
    const client = clients.find(c => c.id === order.clientId);
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      (client && client.fullName.toLowerCase().includes(q)) ||
      order.items.some(i => i.name.toLowerCase().includes(q))
    );
  });

  const selectedProject = projects.find(p => p.id === itemFormData.projectId);
  
  let averageCostPerGram = 0;
  let filamentCostUnit = 0;
  if (itemFormData.filamentsUsage.length > 0) {
    itemFormData.filamentsUsage.forEach(usage => {
      const fil = filaments.find(f => f.id === usage.filamentId);
      if (fil) {
        const costPerGram = fil.purchaseCost / fil.initialWeightG;
        filamentCostUnit += costPerGram * usage.grams;
      }
    });
  }

  let machineCostUnit = 0;
  let totalCostUnit = 0;
  let suggestedPriceTotal = 0;
  let minPriceApplied = false;

  if (selectedProject) {
    const hours = selectedProject.estimatedPrintTimeMinutes / 60;
    machineCostUnit = hours * MACHINE_COST_PER_HOUR;
    totalCostUnit = filamentCostUnit + machineCostUnit;
    
    // Formula de Markup correta: Custo * (1 + Margem/100)
    const markupPrice = (totalCostUnit * itemFormData.quantity) * (1 + (itemFormData.margin / 100));
    const baseHourPrice = settings.quoteHourBasePrice !== undefined ? settings.quoteHourBasePrice : 18.00;
    const minSuggestedPrice = hours * baseHourPrice * itemFormData.quantity;
    
    if (markupPrice < minSuggestedPrice) {
      suggestedPriceTotal = minSuggestedPrice;
      minPriceApplied = true;
    } else {
      suggestedPriceTotal = markupPrice;
    }
  }

  const itemFinalPrice = manualPrice !== null ? manualPrice : suggestedPriceTotal;

  const handleAddItem = () => {
    if (!selectedProject) {
      alert('Selecione um Projeto!');
      return;
    }

    if (editingQuoteItemId) {
      setQuoteItems(quoteItems.map(item => {
        if (item.id === editingQuoteItemId) {
          return {
            ...item,
            name: selectedProject.name,
            projectId: selectedProject.id,
            filamentsUsage: itemFormData.filamentsUsage,
            quantity: itemFormData.quantity,
            price: itemFinalPrice,
            cost: totalCostUnit * itemFormData.quantity
          };
        }
        return item;
      }));
      setEditingQuoteItemId(null);
    } else {
      const newItem: OrderItem = {
        id: crypto.randomUUID(),
        type: '3D_PROJECT',
        name: selectedProject.name,
        projectId: selectedProject.id,
        filamentsUsage: itemFormData.filamentsUsage,
        quantity: itemFormData.quantity,
        status: 'Pendente',
        wastedGrams: 0,
        wastedCost: 0,
        price: itemFinalPrice,
        cost: totalCostUnit * itemFormData.quantity
      };
      setQuoteItems([...quoteItems, newItem]);
    }
    
    // Reset Item Form
    setItemFormData({
      projectId: '',
      filamentsUsage: [],
      quantity: 1,
      margin: 100,
    });
    setManualPrice(null);
  };

  const handleEditItem = (item: OrderItem) => {
    setEditingQuoteItemId(item.id);
    const p = projects.find(proj => proj.id === item.projectId);
    setItemFormData({
      projectId: item.projectId || '',
      filamentsUsage: item.filamentsUsage || (p?.filamentsUsage ? [...p.filamentsUsage] : []),
      quantity: item.quantity || 1,
      margin: 100,
    });
    setManualPrice(item.price);
  };

  const handleRemoveItem = (id: string) => {
    setQuoteItems(quoteItems.filter(i => i.id !== id));
    if (editingQuoteItemId === id) {
      setEditingQuoteItemId(null);
    }
  };

  const handleSaveQuote = () => {
    if (!clientId) {
      alert('Selecione um cliente!');
      return;
    }
    if (quoteItems.length === 0) {
      alert('Adicione ao menos 1 item ao orçamento!');
      return;
    }

    const orderNumber = `ORC-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(orders.length + 1).padStart(3,'0')}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    const totalCalculatedCost = quoteItems.reduce((acc, curr) => acc + curr.cost, 0);
    const totalFinalPrice = customTotalPrice !== null ? customTotalPrice : (quoteItems.reduce((acc, curr) => acc + curr.price, 0) + shippingCost);

    // Apenas para métricas do pedido (Soma tudo)
    const machineCostTotal = quoteItems.reduce((acc, item) => {
       const p = projects.find(p => p.id === item.projectId);
       if(!p) return acc;
       return acc + ((p.estimatedPrintTimeMinutes/60) * MACHINE_COST_PER_HOUR * (item.quantity || 1));
    }, 0);

    const filamentCostTotal = totalCalculatedCost - machineCostTotal;

    if (editingOrderId) {
      updateOrder(editingOrderId, {
        clientId: clientId,
        items: quoteItems,
        calculatedCost: totalCalculatedCost,
        machineCost: machineCostTotal,
        filamentCost: filamentCostTotal,
        shippingCost,
        finalPrice: totalFinalPrice,
      });
      setEditingOrderId(null);
    } else {
      addOrder({
        orderNumber,
        clientId: clientId,
        isQuote: true,
        items: quoteItems,
        status: 'Pendente',
        paymentStatus: 'Pendente',
        calculatedCost: totalCalculatedCost,
        machineCost: machineCostTotal,
        filamentCost: filamentCostTotal,
        shippingCost,
        finalPrice: totalFinalPrice,
        marginPercentage: 0,
        estimatedDeliveryDate: estimatedDelivery.toISOString()
      });
    }
    
    setIsAdding(false);
    setClientId('');
    setShippingCost(0);
    setCepDestino('');
    setQuoteItems([]);
    setCustomTotalPrice(null);
    setEditingQuoteItemId(null);
    loadData();
  };

  const handleEditQuote = (order: Order) => {
    setEditingOrderId(order.id);
    setClientId(order.clientId);
    setShippingCost(order.shippingCost);
    setQuoteItems(order.items);
    setCustomTotalPrice(order.finalPrice);
    setCepDestino('');
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateShipping = async () => {
     if (cepDestino.replace(/\D/g, '').length !== 8) return alert('CEP Inválido. Digite 8 dígitos.');
     setIsCalculatingShipping(true);
     try {
       const res = await fetch(`https://viacep.com.br/ws/${cepDestino.replace(/\D/g, '')}/json/`);
       const data = await res.json();
       if (data.erro) {
          alert('CEP não encontrado!');
       } else {
          // Simulation logic: SP = R$15.00, Sul/Sudeste = 25, Outros = 40
          let cost = 40;
          const uf = data.uf;
          if (uf === 'SP') cost = 15;
          else if (['RJ','MG','ES','PR','SC','RS'].includes(uf)) cost = 25;
          setShippingCost(cost);
          alert(`Frete para ${data.localidade}-${data.uf} calculado!\n\nValor Base Correios (PAC Simulado): R$ ${cost.toFixed(2)}`);
       }
     } catch (e) {
       alert('Erro ao consultar ViaCEP.');
     }
     setIsCalculatingShipping(false);
  };

  const approveQuote = (order: Order) => {
    if(confirm('Aprovar este Orçamento? Ele será convertido em Pedido e movido para a tela de Pedidos.')) {
      const newOrderNumber = order.orderNumber.replace('ORC-', 'PED-');
      updateOrder(order.id, { isQuote: false, orderNumber: newOrderNumber, status: 'Em Andamento' });
      loadData();
    }
  };

  const generateWhatsAppLink = (order: Order, client: Client) => {
    if (!client) return '#';
    const defaultTemplate = `Olá {cliente_nome}! Tudo bem?\n\nO orçamento *{orcamento_numero}* ficou pronto!\n\n*Itens:*\n{orcamento_itens}\n*Frete:* R$ {orcamento_frete}\n*Valor Total:* R$ {orcamento_total}\n*Prazo Estimado:* {orcamento_prazo}\n\nO que acha? Podemos dar andamento na produção?`;
    const template = settings.whatsappQuoteTemplate || defaultTemplate;
    
    const itemsStr = order.items.map(i => `- ${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})`).join('\n');
    const deliveryStr = order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'A combinar';
    
    const replacements: Record<string, string> = {
      '{cliente_nome}': client.fullName || '',
      '{orcamento_numero}': order.orderNumber || '',
      '{orcamento_total}': order.finalPrice.toFixed(2),
      '{orcamento_frete}': order.shippingCost.toFixed(2),
      '{orcamento_prazo}': deliveryStr,
      '{orcamento_itens}': itemsStr,
      '{empresa_nome}': settings.companyName || 'Fazenda 3D',
      '{usuario_nome}': settings.userName || 'Operador',
    };

    let text = template;
    Object.entries(replacements).forEach(([key, val]) => {
      text = text.replaceAll(key, val);
    });

    return `https://wa.me/${client.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`;
  };

  const generateEmailLink = (order: Order, client: Client) => {
    if (!client) return '#';
    const defaultSubject = `Orçamento {orcamento_numero} - {empresa_nome}`;
    const defaultBody = `Prezado(a) {cliente_nome},\n\nSegue o orçamento referente à sua solicitação:\n\nNúmero: {orcamento_numero}\nData: {orcamento_data}\n\nItens:\n{orcamento_itens}\n\nValor do Frete: R$ {orcamento_frete}\nValor Total: R$ {orcamento_total}\n\nPrazo de entrega estimado: {orcamento_prazo}\n\nTermos:\n{orcamento_termos}\n\nPara aprovar ou tirar dúvidas, entre em contato conosco.\n\nAtenciosamente,\n{empresa_nome}\n{usuario_nome}`;

    const subjectTemplate = settings.emailQuoteSubjectTemplate || defaultSubject;
    const bodyTemplate = settings.emailQuoteBodyTemplate || defaultBody;

    const itemsStr = order.items.map(i => `- ${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})`).join('\n');
    const deliveryStr = order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'A combinar';
    const dateStr = new Date(order.createdAt).toLocaleDateString();
    
    const termsWithVal = (settings.quoteTermsConditions || '')
      .replace(/{validade_dias}/g, String(settings.quoteValidityDays || 15));

    const replacements: Record<string, string> = {
      '{cliente_nome}': client.fullName || '',
      '{orcamento_numero}': order.orderNumber || '',
      '{orcamento_total}': order.finalPrice.toFixed(2),
      '{orcamento_frete}': order.shippingCost.toFixed(2),
      '{orcamento_prazo}': deliveryStr,
      '{orcamento_data}': dateStr,
      '{orcamento_itens}': itemsStr,
      '{orcamento_termos}': termsWithVal,
      '{empresa_nome}': settings.companyName || 'Fazenda 3D',
      '{usuario_nome}': settings.userName || 'Operador',
    };

    let subject = subjectTemplate;
    let body = bodyTemplate;

    Object.entries(replacements).forEach(([key, val]) => {
      subject = subject.replaceAll(key, val);
      body = body.replaceAll(key, val);
    });

    return `mailto:${client.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const totalQuoteDraftPrice = quoteItems.reduce((acc, curr) => acc + curr.price, 0) + shippingCost;

  return (
    <div className="space-y-6 pb-20">
      <ClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} onSuccess={(id) => { setShowClientModal(false); setClientId(id); loadData(); }} />
      <ProjectModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} onSuccess={(id) => { 
        setShowProjectModal(false); 
        const allProjects = getStorageData<Project>('projects');
        const newProj = allProjects.find(p => p.id === id);
        setItemFormData(prev => ({ 
          ...prev, 
          projectId: id,
          filamentsUsage: newProj?.filamentsUsage ? [...newProj.filamentsUsage] : []
        })); 
        loadData(); 
      }} />

      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Orçamentos</h2>
          <p className="text-[var(--solar-base1)] mt-1">Simulações e propostas com múltiplos itens.</p>
        </div>
        <button onClick={() => {
            if (isAdding) {
               setIsAdding(false);
               setEditingOrderId(null);
               setClientId('');
               setQuoteItems([]);
               setShippingCost(0);
               setCustomTotalPrice(null);
               setEditingQuoteItemId(null);
            } else {
               setIsAdding(true);
            }
          }} 
          className="bg-[var(--solar-orange)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90"
        >
          {isAdding ? 'Cancelar' : '+ Novo Orçamento'}
        </button>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">Relatório de Orçamentos</h1>
        <p className="text-sm text-gray-600">ERP 3D Farm - Gerado em {new Date().toLocaleDateString()}</p>
        {searchQuery && <p className="text-xs text-gray-500 mt-1">Filtro de busca: "{searchQuery}"</p>}
      </div>

      {/* Painel de Filtros e Exibição */}
      <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)] flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex flex-1 min-w-[280px] gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--solar-base1)] pointer-events-none">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por cliente, número ou itens..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded pl-9 pr-4 py-2 text-[var(--solar-base0)] text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-[var(--solar-base03)] rounded border border-[var(--solar-base01)] p-0.5">
            <button 
              type="button" 
              onClick={() => setViewMode('card')} 
              className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'card' ? 'bg-[var(--solar-orange)] text-[var(--solar-base03)] font-bold' : 'text-[var(--solar-base1)] hover:text-[var(--solar-base3)]'}`}
            >
              🗂️ Cards
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--solar-orange)] text-[var(--solar-base03)] font-bold' : 'text-[var(--solar-base1)] hover:text-[var(--solar-base3)]'}`}
            >
              📋 Lista
            </button>
          </div>

          <button 
            type="button" 
            onClick={() => window.print()} 
            className="bg-[var(--solar-green)] text-[var(--solar-base03)] px-4 py-2 rounded text-xs font-bold hover:opacity-90 flex items-center gap-1.5 transition-opacity"
          >
            🖨️ Imprimir Relatório
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm space-y-8">
          
          {/* Header do Orçamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[var(--solar-base01)]">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-[var(--solar-base1)] mb-1">Cliente *</label>
                <select required value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-bold">
                  <option value="">Selecione um Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => setShowClientModal(true)} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-3 py-2 rounded font-bold hover:bg-[var(--solar-base00)]">+ Novo</button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-[var(--solar-base1)] mb-1">Simular Frete (CEP Destino)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="00000-000" value={cepDestino} onChange={e => setCepDestino(e.target.value)} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono" />
                  <button type="button" onClick={calculateShipping} disabled={isCalculatingShipping} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:bg-[var(--solar-base00)] disabled:opacity-50">
                    {isCalculatingShipping ? '...' : 'Calcular'}
                  </button>
                </div>
              </div>
              <div className="w-48">
                <label className="block text-sm font-bold text-[var(--solar-base1)] mb-1">Custo de Envio (R$)</label>
                <input type="number" min="0" step="0.01" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono text-right" />
              </div>
            </div>
          </div>

          {/* Adicionar Novo Item */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 bg-[var(--solar-base03)] p-4 rounded-xl border border-[var(--solar-base01)]">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-2">Adicionar Item ao Orçamento</h3>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Projeto / Modelo 3D *</label>
                  <select required value={itemFormData.projectId} onChange={e => { 
                      const pId = e.target.value;
                      const p = projects.find(proj => proj.id === pId);
                      setItemFormData({
                         ...itemFormData, 
                         projectId: pId,
                         filamentsUsage: p?.filamentsUsage ? [...p.filamentsUsage] : []
                      }); 
                      setManualPrice(null); 
                    }} className="w-full bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                    <option value="">Selecione um Projeto...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setShowProjectModal(true)} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-3 py-2 rounded font-bold hover:bg-[var(--solar-base00)]">+ Novo</button>
              </div>

              {itemFormData.filamentsUsage.length > 0 && (
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-2">Filamentos do Projeto (Carregados automaticamente)</label>
                  <div className="bg-[var(--solar-base02)] border border-[var(--solar-base01)] p-3 rounded flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {itemFormData.filamentsUsage.map(usage => {
                      const f = filaments.find(fil => fil.id === usage.filamentId);
                      if (!f) return null;
                      return (
                        <div key={f.id} className="flex items-center gap-2 text-sm text-[var(--solar-base0)]">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.colorHex || '#ccc' }}></div>
                          <span>{f.brand} - {f.colorName}</span>
                          <span className="ml-auto font-mono text-[var(--solar-base1)]">{usage.grams}g</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Quantidade (Qtd)</label>
                  <input required type="number" min="1" value={itemFormData.quantity} onChange={e => { setItemFormData({...itemFormData, quantity: Number(e.target.value)}); setManualPrice(null); }} className="w-full bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Margem de Lucro Markup (%)</label>
                  <input required type="number" min="0" value={itemFormData.margin} onChange={e => { setItemFormData({...itemFormData, margin: Number(e.target.value)}); setManualPrice(null); }} className="w-full bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
              </div>
            </div>

            {/* Resumo do Item Atual */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[var(--solar-base1)] uppercase mb-4 tracking-wider">Custo Calculado (Total da Qtd)</h4>
                <div className="space-y-2 text-sm bg-[var(--solar-base02)] p-4 rounded border border-[var(--solar-base01)]">
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Custo Fixo (Máquina):</span>
                    <span className="font-mono">R$ {(machineCostUnit * itemFormData.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Custo Material:</span>
                    <span className="font-mono">R$ {(filamentCostUnit * itemFormData.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--solar-base0)] border-t border-[var(--solar-base01)] pt-2 mt-2">
                    <span>Custo Base (Total):</span>
                    <span className="font-mono">R$ {(totalCostUnit * itemFormData.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-[var(--solar-base02)] p-4 rounded border border-[var(--solar-base01)] border-l-4 border-l-[var(--solar-yellow)]">
                <label className="block text-sm font-bold text-[var(--solar-base1)] mb-1">Preço Final do Item (Sugerido vs Manual)</label>
                <p className="text-[10px] text-[var(--solar-base1)] mb-2">O valor sugerido é {suggestedPriceTotal.toFixed(2)}. Você pode alterar ou arredondar abaixo:</p>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={manualPrice !== null ? manualPrice : (suggestedPriceTotal ? suggestedPriceTotal.toFixed(2) : '')} 
                  onChange={e => setManualPrice(Number(e.target.value))} 
                  placeholder={suggestedPriceTotal.toFixed(2)}
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-yellow)] rounded p-3 text-[var(--solar-yellow)] font-bold text-xl font-mono" 
                />
                {minPriceApplied && selectedProject && (
                  <p className="text-[var(--solar-orange)] text-[10px] mt-1 font-semibold">
                    ⚠️ Preço mínimo de R$ {(settings.quoteHourBasePrice !== undefined ? settings.quoteHourBasePrice : 18.00).toFixed(2)}/h aplicado ({(selectedProject.estimatedPrintTimeMinutes / 60).toFixed(2)}h de produção * {itemFormData.quantity}x)
                  </p>
                )}
              </div>

              <button type="button" onClick={handleAddItem} disabled={itemFormData.filamentsUsage.length === 0 || !itemFormData.projectId} className="w-full mt-4 bg-[var(--solar-blue)] text-[var(--solar-base03)] px-6 py-3 rounded font-bold hover:opacity-90 disabled:opacity-50">
                {editingQuoteItemId ? '✓ Salvar Alterações do Item' : '+ Adicionar Item à Tabela'}
              </button>
            </div>
          </div>

          {/* Tabela de Itens */}
          {quoteItems.length > 0 && (
            <div className="mt-8">
               <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4 border-b border-[var(--solar-base01)] pb-2">Itens do Orçamento</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                       <th className="p-3 text-sm font-bold">Item</th>
                       <th className="p-3 text-sm font-bold text-center">Qtd</th>
                       <th className="p-3 text-sm font-bold">Custo</th>
                       <th className="p-3 text-sm font-bold text-right">Preço Venda</th>
                       <th className="p-3 text-sm font-bold text-center">Ações</th>
                     </tr>
                   </thead>
                   <tbody>
                     {quoteItems.map((item, index) => (
                       <tr key={item.id} className="border-b border-[var(--solar-base01)] bg-[var(--solar-base02)]">
                         <td className="p-3 text-[var(--solar-base0)] font-bold">{index + 1}. {item.name}</td>
                         <td className="p-3 text-[var(--solar-base0)] text-center">{item.quantity}</td>
                         <td className="p-3 text-[var(--solar-base1)] font-mono text-sm">R$ {item.cost.toFixed(2)}</td>
                         <td className="p-3 text-[var(--solar-yellow)] font-bold font-mono text-right">R$ {item.price.toFixed(2)}</td>
                          <td className="p-3 text-center flex justify-center items-center gap-2">
                            <button type="button" onClick={() => handleEditItem(item)} className="bg-[var(--solar-blue)] bg-opacity-20 text-[var(--solar-blue)] p-1.5 rounded hover:bg-opacity-40 transition-colors" title="Alterar Item">
                              ✏️
                            </button>
                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] p-1.5 rounded hover:bg-opacity-40 transition-colors" title="Excluir Item">
                              🗑️
                            </button>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* Botão de Fechar Orçamento */}
          <div className="pt-6 border-t border-[var(--solar-base01)] flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[var(--solar-base1)] text-sm">Valor Total (Itens + Frete):</p>
               <div className="flex items-center gap-3">
                 <span className="text-3xl font-bold text-[var(--solar-green)] font-mono">R$</span>
                 <input 
                   type="number" 
                   step="0.01" 
                   min="0"
                   value={customTotalPrice !== null ? customTotalPrice : Number(totalQuoteDraftPrice.toFixed(2))} 
                   onChange={e => setCustomTotalPrice(Number(e.target.value))}
                   className="bg-[var(--solar-base03)] border border-[var(--solar-green)] rounded px-3 py-1 text-3xl font-bold text-[var(--solar-green)] font-mono w-48 text-right"
                 />
                 {customTotalPrice !== null && (
                   <button 
                     type="button" 
                     onClick={() => setCustomTotalPrice(null)} 
                     className="text-xs bg-[var(--solar-base01)] text-[var(--solar-base03)] px-2 py-1 rounded font-bold hover:bg-[var(--solar-base00)]"
                     title="Resetar para cálculo automático"
                   >
                     Reset
                   </button>
                 )}
               </div>
            </div>
            <button onClick={handleSaveQuote} disabled={quoteItems.length === 0 || !clientId} className="bg-[var(--solar-green)] text-[var(--solar-base03)] px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50">
              {editingOrderId ? 'Salvar Alterações do Orçamento' : 'Finalizar e Salvar Orçamento'}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print-card-grid">
          {filteredQuotes.map(order => {
            const client = clients.find(c => c.id === order.clientId);
            
            return (
              <div key={order.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col relative print-card">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[var(--solar-base1)] text-xs font-mono">{order.orderNumber}</span>
                  <span className="text-[var(--solar-base1)] text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-2">{client?.fullName || 'Cliente Removido'}</h3>
                
                <div className="bg-[var(--solar-base03)] p-3 rounded-xl border border-[var(--solar-base01)] mb-4 space-y-2">
                  {(order.items || []).map(item => (
                     <div key={item.id} className="text-sm border-b border-[var(--solar-base02)] pb-2 last:border-0 last:pb-0">
                       <p className="text-[var(--solar-base0)] font-bold">📦 {item.quantity}x {item.name}</p>
                       <div className="flex flex-wrap gap-1 mt-1 mb-1">
                          {item.filamentsUsage?.map(usage => {
                             const f = filaments.find(fi => fi.id === usage.filamentId);
                             if(!f) return null;
                             return <div key={f.id} title={`${f.colorName} (${usage.grams}g)`} className="w-3 h-3 rounded-full" style={{backgroundColor: f.colorHex||'#ccc'}} />
                          })}
                       </div>
                       <p className="text-[10px] text-[var(--solar-base1)] font-mono">R$ {item.price.toFixed(2)}</p>
                     </div>
                  ))}
                </div>

                <div className="text-sm flex justify-between font-bold mb-4">
                  <span className="text-[var(--solar-base0)]">Valor Proposto:</span>
                  <span className="text-[var(--solar-yellow)]">R$ {order.finalPrice.toFixed(2)}</span>
                </div>

                <div className="mt-auto pt-4 flex flex-wrap gap-2 no-print">
                   <a href={generateWhatsAppLink(order, client as Client)} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[70px] bg-[#25D366] text-white text-xs py-2 rounded text-center hover:opacity-90 font-bold flex items-center justify-center">
                     Zap
                   </a>
                   <a href={generateEmailLink(order, client as Client)} className="flex-1 min-w-[70px] bg-[var(--solar-green)] text-[var(--solar-base03)] text-xs py-2 rounded text-center hover:opacity-90 font-bold flex items-center justify-center">
                     E-mail
                   </a>
                   <button 
                     onClick={() => handleEditQuote(order)}
                     className="flex-1 min-w-[70px] bg-[var(--solar-blue)] text-[var(--solar-base03)] text-xs py-2 rounded font-bold hover:opacity-90 transition-opacity"
                   >
                     Editar
                   </button>
                   <button 
                     onClick={() => approveQuote(order)}
                     className="flex-1 min-w-[70px] bg-[var(--solar-yellow)] text-[var(--solar-base03)] text-xs py-2 rounded font-bold hover:opacity-90 transition-opacity"
                   >
                     Aprovar
                   </button>
                    <button onClick={() => { if(confirm('Excluir orçamento?')) deleteOrder(order.id); loadData(); }} className="w-8 bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] rounded flex items-center justify-center hover:bg-opacity-40">
                      🗑️
                    </button>
                 </div>
              </div>
            );
          })}

          {filteredQuotes.length === 0 && !isAdding && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
              <p className="text-[var(--solar-base1)]">Nenhum orçamento encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                <th className="p-3 text-sm font-bold">Orçamento #</th>
                <th className="p-3 text-sm font-bold">Data</th>
                <th className="p-3 text-sm font-bold">Cliente</th>
                <th className="p-3 text-sm font-bold">Itens</th>
                <th className="p-3 text-sm font-bold text-right">Frete</th>
                <th className="p-3 text-sm font-bold text-right">Valor Total</th>
                <th className="p-3 text-sm font-bold text-center no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map(order => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <tr key={order.id} className="border-b border-[var(--solar-base01)] bg-[var(--solar-base02)] hover:bg-[var(--solar-base03)] transition-colors">
                    <td className="p-3 text-[var(--solar-base2)] font-mono font-bold">{order.orderNumber}</td>
                    <td className="p-3 text-[var(--solar-base0)]">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-[var(--solar-base2)] font-bold">{client?.fullName || 'Cliente Removido'}</td>
                    <td className="p-3 text-xs text-[var(--solar-base0)]">
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id}>📦 {item.quantity}x {item.name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-[var(--solar-base0)] text-right font-mono">R$ {order.shippingCost.toFixed(2)}</td>
                    <td className="p-3 text-[var(--solar-yellow)] text-right font-bold font-mono">R$ {order.finalPrice.toFixed(2)}</td>
                    <td className="p-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <a href={generateWhatsAppLink(order, client as Client)} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white text-[10px] px-2 py-1 rounded font-bold hover:opacity-90">
                          Zap
                        </a>
                        <a href={generateEmailLink(order, client as Client)} className="bg-[var(--solar-green)] text-[var(--solar-base03)] text-[10px] px-2 py-1 rounded font-bold hover:opacity-90">
                          E-mail
                        </a>
                        <button 
                          onClick={() => handleEditQuote(order)}
                          className="bg-[var(--solar-blue)] text-[var(--solar-base03)] text-[10px] px-2 py-1 rounded font-bold hover:opacity-90"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => approveQuote(order)}
                          className="bg-[var(--solar-yellow)] text-[var(--solar-base03)] text-[10px] px-2 py-1 rounded font-bold hover:opacity-90"
                        >
                          Aprovar
                        </button>
                        <button onClick={() => { if(confirm('Excluir orçamento?')) deleteOrder(order.id); loadData(); }} className="bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-[10px] px-2 py-1 rounded hover:bg-opacity-40 transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--solar-base1)] bg-[var(--solar-base02)]">
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
