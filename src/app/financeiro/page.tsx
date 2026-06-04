"use client";

import { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { getStorageData, addTransaction, deleteTransaction, updateTransaction } from '../../lib/storage';

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);

  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  
  const [formData, setFormData] = useState<{
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: 'Venda' | 'Filamento' | 'Manutenção' | 'Energia' | 'Outros';
    description: string;
    date: string;
  }>({
    amount: 0,
    type: 'EXPENSE',
    category: 'Outros',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = () => {
    setTransactions(getStorageData<Transaction>('transactions'));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleEdit = (t: Transaction) => {
    setFormData({
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
    });
    setEditingId(t.id);
    setInstallments(1);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setInstallments(1);
    setFormData({
      amount: 0,
      type: 'EXPENSE',
      category: 'Outros',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description) {
      alert('Preencha um valor válido e uma descrição.');
      return;
    }

    if (editingId) {
      updateTransaction(editingId, {
        date: formData.date,
        amount: formData.amount,
        type: formData.type,
        category: formData.category,
        description: formData.description
      });
    } else {
      const amountPerInstallment = formData.amount / installments;
      const [year, month, day] = formData.date.split('-').map(Number);
      
      for (let i = 0; i < installments; i++) {
        const currentDate = new Date(year, month - 1 + i, day);
        
        addTransaction({
          date: currentDate.toISOString().split('T')[0],
          amount: amountPerInstallment,
          type: formData.type,
          category: formData.category,
          description: formData.description,
          installment: installments > 1 ? `${i + 1}/${installments}` : undefined
        });
      }
    }
    
    handleCancel();
    loadData();
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || t.type === selectedType;
    
    const matchesDateStart = !dateStart || new Date(t.date) >= new Date(dateStart);
    // Add time offset or just compare string dates
    const matchesDateEnd = !dateEnd || new Date(t.date) <= new Date(dateEnd);

    return matchesQuery && matchesCategory && matchesType && matchesDateStart && matchesDateEnd;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Financeiro</h2>
          <p className="text-[var(--solar-base1)] mt-1">Fluxo de Caixa, Entradas e Saídas.</p>
        </div>
        <button onClick={() => isAdding ? handleCancel() : setIsAdding(true)} className={`${isAdding ? 'bg-[var(--solar-red)]' : 'bg-[var(--solar-blue)]'} text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90`}>
          {isAdding ? 'Cancelar Edição' : '+ Novo Lançamento'}
        </button>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">Relatório Financeiro</h1>
        <p className="text-sm text-gray-600">ERP 3D Farm - Gerado em {new Date().toLocaleDateString()}</p>
        {(searchQuery || selectedCategory !== 'ALL' || selectedType !== 'ALL' || dateStart || dateEnd) && (
          <p className="text-xs text-gray-500 mt-1">
            Filtros: {searchQuery && `Busca: "${searchQuery}"`} {selectedCategory !== 'ALL' && `Categoria: ${selectedCategory}`} {selectedType !== 'ALL' && `Tipo: ${selectedType}`} {dateStart && `De: ${dateStart}`} {dateEnd && `Até: ${dateEnd}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
            <h4 className="text-sm font-bold text-[var(--solar-base1)] uppercase">Total Entradas</h4>
            <p className="text-3xl font-bold text-[var(--solar-green)] mt-2 font-mono">R$ {totalIncome.toFixed(2)}</p>
         </div>
         <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
            <h4 className="text-sm font-bold text-[var(--solar-base1)] uppercase">Total Saídas</h4>
            <p className="text-3xl font-bold text-[var(--solar-red)] mt-2 font-mono">R$ {totalExpense.toFixed(2)}</p>
         </div>
         <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
            <h4 className="text-sm font-bold text-[var(--solar-base1)] uppercase">Saldo no Período</h4>
            <p className={`text-3xl font-bold mt-2 font-mono ${balance >= 0 ? 'text-[var(--solar-base2)]' : 'text-[var(--solar-red)]'}`}>R$ {balance.toFixed(2)}</p>
         </div>
      </div>

      {/* Painel de Filtros e Exibição */}
      <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)] flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap flex-1 gap-2 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--solar-base1)] pointer-events-none">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar descrição ou categoria..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded pl-9 pr-4 py-2 text-[var(--solar-base0)] text-sm"
            />
          </div>

          <select 
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)}
            className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] text-sm"
          >
            <option value="ALL">Todos Tipos</option>
            <option value="INCOME">Entradas (+)</option>
            <option value="EXPENSE">Saídas (-)</option>
          </select>

          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] text-sm"
          >
            <option value="ALL">Todas Categorias</option>
            <option value="Venda">Venda</option>
            <option value="Filamento">Filamento</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Energia">Energia</option>
            <option value="Outros">Outros</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-[var(--solar-base1)] bg-[var(--solar-base03)] border border-[var(--solar-base01)] px-2 rounded">
            <span>De:</span>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-[var(--solar-base0)] border-0 p-0 text-xs focus:outline-none" />
            <span>Até:</span>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-[var(--solar-base0)] border-0 p-0 text-xs focus:outline-none" />
            {(dateStart || dateEnd) && (
              <button type="button" onClick={() => { setDateStart(''); setDateEnd(''); }} className="text-[var(--solar-red)] ml-1 font-bold">X</button>
            )}
          </div>
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

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end no-print">
           <div className="col-span-1">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Data</label>
             <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
           </div>
           
           <div className="col-span-1">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Tipo</label>
             <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-bold">
               <option value="INCOME">Entrada (+)</option>
               <option value="EXPENSE">Saída (-)</option>
             </select>
           </div>
           
           <div className="col-span-1">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Categoria</label>
             <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
               <option value="Venda">Venda</option>
               <option value="Filamento">Filamento</option>
               <option value="Manutenção">Manutenção</option>
               <option value="Energia">Energia</option>
               <option value="Outros">Outros</option>
             </select>
           </div>

           <div className="col-span-1 md:col-span-2 lg:col-span-2">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Descrição</label>
             <input type="text" required placeholder="Ex: Conta de Luz Maio" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
           </div>

           {!editingId && (
             <div className="col-span-1">
               <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Parcelas (Mês)</label>
               <select required value={installments} onChange={e => setInstallments(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                 {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
               </select>
             </div>
           )}

           <div className="col-span-1">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">{installments > 1 ? 'Valor Total (R$)' : 'Valor (R$)'}</label>
             <input type="number" required min="0.01" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono" />
             {installments > 1 && <p className="text-[10px] text-[var(--solar-base1)] mt-1 text-right">{installments}x de R$ {(formData.amount / installments).toFixed(2)}</p>}
           </div>

           <div className="col-span-1 md:col-span-full lg:col-span-full text-right mt-2">
              <button type="submit" className="bg-[var(--solar-green)] text-[var(--solar-base03)] px-6 py-2 rounded font-bold hover:opacity-90">
                {editingId ? 'Salvar Alteração' : 'Registrar'}
              </button>
           </div>
        </form>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print-card-grid">
          {sortedTransactions.map(t => (
            <div key={t.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col print-card">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-[var(--solar-base1)]">{new Date(t.date).toLocaleDateString()}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.type === 'INCOME' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 'bg-[var(--solar-red)] text-[var(--solar-base03)]'}`}>
                  {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-1">{t.description}</h3>
              <p className="text-xs text-[var(--solar-base1)] mb-4">Categoria: {t.category}</p>
              
              <div className="mt-auto pt-4 border-t border-[var(--solar-base01)] flex justify-between items-center">
                <div>
                  {t.installment && <span className="text-xs font-mono bg-[var(--solar-base03)] text-[var(--solar-base1)] px-1.5 py-0.5 rounded border border-[var(--solar-base01)]">{t.installment}</span>}
                  {t.orderId && <span className="text-xs font-mono bg-[var(--solar-base01)] text-[var(--solar-base03)] px-1.5 py-0.5 rounded ml-1">Venda</span>}
                  {t.filamentId && <span className="text-xs font-mono bg-[var(--solar-base01)] text-[var(--solar-base03)] px-1.5 py-0.5 rounded ml-1">Estoque</span>}
                </div>
                <span className={`text-xl font-bold font-mono ${t.type === 'INCOME' ? 'text-[var(--solar-green)]' : 'text-[var(--solar-red)]'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                </span>
              </div>
              
              <div className="mt-4 pt-2 border-t border-[var(--solar-base01)] border-dashed flex gap-2 no-print">
                <button onClick={() => handleEdit(t)} className="flex-1 text-xs bg-[var(--solar-blue)] bg-opacity-20 text-[var(--solar-blue)] py-1.5 rounded hover:bg-opacity-40 font-bold transition-all">
                  ✏️ Editar
                </button>
                <button onClick={() => { if(confirm('Excluir lançamento?')) { deleteTransaction(t.id); loadData(); } }} className="flex-1 text-xs bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] py-1.5 rounded hover:bg-opacity-40 font-bold transition-all">
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
          {sortedTransactions.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
              <p className="text-[var(--solar-base1)]">Nenhum lançamento encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                  <th className="p-4 text-sm font-bold">Data</th>
                  <th className="p-4 text-sm font-bold">Descrição</th>
                  <th className="p-4 text-sm font-bold">Categoria</th>
                  <th className="p-4 text-sm font-bold text-right">Valor</th>
                  <th className="p-4 text-sm font-bold text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map(t => (
                  <tr key={t.id} className="border-b border-[var(--solar-base01)] hover:bg-[var(--solar-base03)] bg-[var(--solar-base02)]">
                    <td className="p-4 text-[var(--solar-base0)]">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-4 text-[var(--solar-base0)] font-bold">
                      {t.description}
                      {t.installment && <span className="ml-2 text-xs font-mono bg-[var(--solar-base03)] text-[var(--solar-base1)] px-1 rounded border border-[var(--solar-base01)]">{t.installment}</span>}
                      {t.orderId && <span className="ml-2 text-xs font-mono bg-[var(--solar-base01)] text-[var(--solar-base03)] px-1 rounded">Venda</span>}
                      {t.filamentId && <span className="ml-2 text-xs font-mono bg-[var(--solar-base01)] text-[var(--solar-base03)] px-1 rounded">Estoque</span>}
                    </td>
                    <td className="p-4 text-[var(--solar-base1)] text-sm">{t.category}</td>
                    <td className={`p-4 font-bold font-mono text-right ${t.type === 'INCOME' ? 'text-[var(--solar-green)]' : 'text-[var(--solar-red)]'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(t)} className="text-xs bg-[var(--solar-blue)] bg-opacity-20 text-[var(--solar-blue)] px-2.5 py-1.5 rounded hover:bg-opacity-40 transition-colors">
                          ✏️
                        </button>
                        <button onClick={() => { if(confirm('Excluir lançamento?')) { deleteTransaction(t.id); loadData(); } }} className="text-xs bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] px-2.5 py-1.5 rounded hover:bg-opacity-40 transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--solar-base1)] bg-[var(--solar-base02)]">Nenhum lançamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
