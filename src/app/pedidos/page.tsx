"use client";

import { useState, useEffect } from 'react';
import { Order, Client, Filament, Project, Transaction, Printer } from '../../types';
import { getStorageData, updateOrder, updateFilament, addTransaction, deleteOrder } from '../../lib/storage';

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const loadData = () => {
    setOrders(getStorageData<Order>('orders'));
    setClients(getStorageData<Client>('clients'));
    setFilaments(getStorageData<Filament>('filaments'));
    setProjects(getStorageData<Project>('projects'));
    setPrinters(getStorageData<Printer>('printers'));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const activeOrders = orders.filter(o => !o.isQuote);

  const handleUpdatePayment = (orderId: string, status: 'Pendente' | 'Pago', method?: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência') => {
    updateOrder(orderId, { paymentStatus: status, paymentMethod: method });
    
    if (status === 'Pago') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const transactions = getStorageData<Transaction>('transactions');
        const exists = transactions.some(t => t.orderId === order.id);
        
        if (!exists) {
          addTransaction({
            date: new Date().toISOString().split('T')[0],
            amount: order.finalPrice,
            type: 'INCOME',
            category: 'Venda',
            description: `Pgto Pedido ${order.orderNumber} via ${method || 'Não especificado'}`,
            orderId: order.id
          });
        }
      }
    }

    loadData();
  };

  const handleItemStatus = (orderId: string, itemId: string, newStatus: 'Concluído' | 'Falha') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const item = order.items.find(i => i.id === itemId);
    if (!item) return;

    if (item.status === 'Concluído' || item.status === 'Falha') {
      alert('Este item já teve sua baixa de estoque realizada.');
      return;
    }

    if (newStatus === 'Concluído') {
      if (confirm(`Finalizar item e dar baixa de filamento no estoque?`)) {
        if (item.filamentsUsage && item.filamentsUsage.length > 0) {
          let hasStock = true;
          let stockErrors: string[] = [];
          item.filamentsUsage.forEach(usage => {
             const fil = filaments.find(f => f.id === usage.filamentId);
             if (fil) {
                if (fil.currentWeightG < usage.grams) {
                   hasStock = false;
                   stockErrors.push(`Faltam ${(usage.grams - fil.currentWeightG).toFixed(1)}g do filamento ${fil.brand} - ${fil.colorName}`);
                }
             }
          });
          if (!hasStock) {
             alert(`Não há filamento suficiente em estoque para produzir este item:\n\n${stockErrors.join('\n')}\n\nTransação bloqueada.`);
             return;
          }
          item.filamentsUsage.forEach(usage => {
             const fil = filaments.find(f => f.id === usage.filamentId);
             if (fil) {
                updateFilament(fil.id, { currentWeightG: fil.currentWeightG - usage.grams });
             }
          });
        }
        
        const updatedItems = order.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i);
        updateOrder(orderId, { items: updatedItems });
        loadData();
      }
    } else if (newStatus === 'Falha') {
      const wastedStr = prompt('Ocorreu uma falha. Quantas gramas foram desperdiçadas? (Total em gramas)');
      if (wastedStr) {
        const wastedGrams = Number(wastedStr);
        if (!isNaN(wastedGrams) && wastedGrams > 0) {
          let wastedCost = 0;
          if (item.filamentsUsage && item.filamentsUsage.length > 0) {
             const totalItemGrams = item.filamentsUsage.reduce((acc, u) => acc + u.grams, 0) || 1;
             item.filamentsUsage.forEach(usage => {
                const fil = filaments.find(f => f.id === usage.filamentId);
                if(fil) {
                  const proportion = usage.grams / totalItemGrams;
                  const filamentWastedGrams = wastedGrams * proportion;
                  const avgCostPerGram = (fil.purchaseCost / fil.initialWeightG);
                  wastedCost += filamentWastedGrams * avgCostPerGram;
                  updateFilament(fil.id, { currentWeightG: fil.currentWeightG - filamentWastedGrams });
                }
             });
          }

          const updatedItems = order.items.map(i => i.id === itemId ? { ...i, status: newStatus, wastedGrams, wastedCost } : i);
          updateOrder(orderId, { items: updatedItems });
          loadData();
        }
      }
    }
  };

  const handleOrderStatus = (orderId: string, status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado') => {
    updateOrder(orderId, { status });
    loadData();
  };

  const handleEditOrder = (orderId: string) => {
    sessionStorage.setItem('edit_order_id', orderId);
    window.location.href = '/orcamentos';
  };

  // Filter orders
  const filteredOrders = activeOrders.filter(order => {
    const client = clients.find(c => c.id === order.clientId);
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      order.orderNumber.toLowerCase().includes(q) ||
      (client && client.fullName.toLowerCase().includes(q)) ||
      order.items.some(i => i.name.toLowerCase().includes(q));
      
    const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Pedidos em Andamento</h2>
          <p className="text-[var(--solar-base1)] mt-1">Gerencie a produção e o faturamento das vendas fechadas.</p>
        </div>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">Relatório de Pedidos em Andamento</h1>
        <p className="text-sm text-gray-600">ERP 3D Farm - Gerado em {new Date().toLocaleDateString()}</p>
        {(searchQuery || selectedStatus !== 'ALL') && (
          <p className="text-xs text-gray-500 mt-1">
            Filtros: {searchQuery && `Busca: "${searchQuery}"`} {selectedStatus !== 'ALL' && `Status: ${selectedStatus}`}
          </p>
        )}
      </div>

      {/* Painel de Filtros e Exibição */}
      <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)] flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex flex-1 min-w-[280px] gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--solar-base1)] pointer-events-none">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por cliente, pedido # ou itens..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded pl-9 pr-4 py-2 text-[var(--solar-base0)] text-sm"
            />
          </div>

          <select 
            value={selectedStatus} 
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] text-sm"
          >
            <option value="ALL">Todos Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-[var(--solar-base03)] rounded border border-[var(--solar-base01)] p-0.5">
            <button 
              type="button" 
              onClick={() => setViewMode('card')} 
              className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'card' ? 'bg-[var(--solar-blue)] text-[var(--solar-base03)] font-bold' : 'text-[var(--solar-base1)] hover:text-[var(--solar-base3)]'}`}
            >
              🗂️ Cards
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--solar-blue)] text-[var(--solar-base03)] font-bold' : 'text-[var(--solar-base1)] hover:text-[var(--solar-base3)]'}`}
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

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print-card-grid">
          {filteredOrders.map(order => {
            const client = clients.find(c => c.id === order.clientId);
            
            return (
              <div key={order.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col print-card">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[var(--solar-base1)] text-xs font-mono mb-1">{order.orderNumber}</span>
                    <select 
                      value={order.status} 
                      onChange={e => handleOrderStatus(order.id, e.target.value as any)}
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        order.status === 'Pendente' ? 'bg-[var(--solar-yellow)] text-[var(--solar-base03)]' : 
                        order.status === 'Em Andamento' ? 'bg-[var(--solar-blue)] text-[var(--solar-base03)]' : 
                        order.status === 'Concluído' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 
                        'bg-[var(--solar-base01)] text-[var(--solar-base03)]'
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-[var(--solar-base1)] text-xs font-bold">Cliente</span>
                      <span className="text-[var(--solar-base2)] text-base font-bold">{client?.fullName || 'Desconhecido'}</span>
                    </div>
                    <div className="flex gap-2 no-print">
                      <button onClick={() => handleEditOrder(order.id)} className="bg-solar-blue/15 text-solar-blue px-3 py-1 text-xs rounded font-bold hover:bg-solar-blue/30 transition-colors">
                        ✏️ Alterar
                      </button>
                      <a href={`/pedidos/${order.id}/os`} target="_blank" className="bg-[var(--solar-cyan)] text-[var(--solar-base03)] px-3 py-1 text-xs rounded font-bold hover:opacity-90">
                        🖨️ Imprimir OS
                      </a>
                      <button onClick={() => { if(confirm('Excluir este pedido?')) deleteOrder(order.id); loadData(); }} className="text-xs bg-solar-red/15 text-solar-red px-2 py-1 rounded hover:bg-solar-red/30 transition-colors">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--solar-base03)] p-4 rounded-xl border border-[var(--solar-base01)] mb-4 space-y-4">
                  <h4 className="text-xs font-bold text-[var(--solar-base1)] uppercase tracking-wider">Itens do Pedido</h4>
                  {(order.items || []).map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--solar-base02)] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-[var(--solar-base0)] font-bold">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            item.status === 'Concluído' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' :
                            item.status === 'Falha' ? 'bg-[var(--solar-red)] text-[var(--solar-base03)]' :
                            'bg-[var(--solar-base01)] text-[var(--solar-base03)]'
                          }`}>
                            {item.status}
                          </span>
                          {item.wastedGrams > 0 && <span className="text-[10px] text-[var(--solar-red)]">-{item.wastedGrams}g perdidos</span>}
                          
                          <select 
                            value={item.machineId || ''} 
                            onChange={e => {
                               const updatedItems = order.items.map(i => i.id === item.id ? { ...i, machineId: e.target.value } : i);
                               updateOrder(order.id, { items: updatedItems });
                               loadData();
                            }}
                            className="text-[10px] bg-[var(--solar-base02)] text-[var(--solar-base1)] border border-[var(--solar-base01)] rounded px-1 py-0.5"
                          >
                             <option value="">Nenhuma Máquina</option>
                             {printers.map(p => (
                               <option key={p.id} value={p.id}>{p.name}</option>
                             ))}
                          </select>
                        </div>
                      </div>
                      
                      {item.status !== 'Concluído' && item.status !== 'Falha' && (
                        <div className="flex gap-2 no-print">
                          <button onClick={() => handleItemStatus(order.id, item.id, 'Falha')} className="text-xs bg-[var(--solar-red)] text-[var(--solar-base03)] px-2 py-1 rounded font-bold hover:opacity-90">Falha (Desperdício)</button>
                          <button onClick={() => handleItemStatus(order.id, item.id, 'Concluído')} className="text-xs bg-[var(--solar-green)] text-[var(--solar-base03)] px-2 py-1 rounded font-bold hover:opacity-90">Concluído</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-end mt-auto pt-4 border-t border-[var(--solar-base01)]">
                  <div>
                    <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Pagamento</label>
                    <div className="flex gap-2 no-print">
                      <select 
                        value={order.paymentStatus} 
                        onChange={e => handleUpdatePayment(order.id, e.target.value as any, order.paymentMethod)}
                        className={`text-xs px-2 py-1 rounded font-bold ${order.paymentStatus === 'Pago' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 'bg-[var(--solar-red)] text-[var(--solar-base03)]'}`}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago</option>
                      </select>
                      
                      {order.paymentStatus === 'Pago' && (
                        <select 
                          value={order.paymentMethod || ''} 
                          onChange={e => handleUpdatePayment(order.id, 'Pago', e.target.value as any)}
                          className="text-xs px-2 py-1 rounded bg-[var(--solar-base03)] text-[var(--solar-base0)] border border-[var(--solar-base01)]"
                        >
                          <option value="">Forma de Pgto</option>
                          <option value="PIX">PIX</option>
                          <option value="Cartão">Cartão</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Transferência">Transferência</option>
                        </select>
                      )}
                    </div>
                    {/* Exibição em Impressão */}
                    <div className="hidden print-only text-xs">
                      <p>Status: <span className="font-bold">{order.paymentStatus}</span> {order.paymentMethod && `(${order.paymentMethod})`}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-[var(--solar-base1)]">Valor Total</p>
                    <p className="text-xl font-bold text-[var(--solar-yellow)] font-mono">R$ {order.finalPrice.toFixed(2)}</p>
                  </div>
                </div>

              </div>
            );
          })}
          {filteredOrders.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
              <p className="text-[var(--solar-base1)]">Nenhum pedido encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                <th className="p-3 text-sm font-bold">Pedido #</th>
                <th className="p-3 text-sm font-bold">Cliente</th>
                <th className="p-3 text-sm font-bold">Itens</th>
                <th className="p-3 text-sm font-bold">Produção</th>
                <th className="p-3 text-sm font-bold">Pagamento</th>
                <th className="p-3 text-sm font-bold text-right">Valor Total</th>
                <th className="p-3 text-sm font-bold text-center no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <tr key={order.id} className="border-b border-[var(--solar-base01)] bg-[var(--solar-base02)] hover:bg-[var(--solar-base03)] transition-colors">
                    <td className="p-3 font-mono font-bold text-[var(--solar-base2)]">{order.orderNumber}</td>
                    <td className="p-3 text-[var(--solar-base2)] font-bold">{client?.fullName || 'Desconhecido'}</td>
                    <td className="p-3 text-xs text-[var(--solar-base0)]">
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-1.5">
                            <span>📦 {item.name}</span>
                            <span className="text-[10px] px-1 rounded bg-[var(--solar-base03)] font-mono">{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <select 
                        value={order.status} 
                        onChange={e => handleOrderStatus(order.id, e.target.value as any)}
                        className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded text-xs p-1 text-[var(--solar-base0)] no-print"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                      <span className="hidden print-only">{order.status}</span>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="flex gap-1 items-center no-print">
                        <select 
                          value={order.paymentStatus} 
                          onChange={e => handleUpdatePayment(order.id, e.target.value as any, order.paymentMethod)}
                          className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded text-xs p-1 text-[var(--solar-base0)]"
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Pago">Pago</option>
                        </select>
                        {order.paymentStatus === 'Pago' && (
                          <select 
                            value={order.paymentMethod || ''} 
                            onChange={e => handleUpdatePayment(order.id, 'Pago', e.target.value as any)}
                            className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded text-xs p-1 text-[var(--solar-base0)]"
                          >
                            <option value="">Forma</option>
                            <option value="PIX">PIX</option>
                            <option value="Cartão">Cartão</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Transferência">Transferência</option>
                          </select>
                        )}
                      </div>
                      <span className="hidden print-only">{order.paymentStatus} {order.paymentMethod && `(${order.paymentMethod})`}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-[var(--solar-yellow)] font-mono">R$ {order.finalPrice.toFixed(2)}</td>
                    <td className="p-3 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditOrder(order.id)} className="bg-solar-blue/15 text-solar-blue px-2 py-1 rounded text-xs font-bold hover:bg-solar-blue/30 transition-colors">
                          Alterar
                        </button>
                        <a href={`/pedidos/${order.id}/os`} target="_blank" className="bg-[var(--solar-cyan)] text-[var(--solar-base03)] px-2 py-1 rounded text-xs font-bold hover:opacity-90">
                          OS
                        </a>
                        <button onClick={() => { if(confirm('Excluir este pedido?')) deleteOrder(order.id); loadData(); }} className="bg-solar-red/15 text-solar-red px-2 py-1 rounded hover:bg-solar-red/30 transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--solar-base1)] bg-[var(--solar-base02)]">
                    Nenhum pedido encontrado.
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
