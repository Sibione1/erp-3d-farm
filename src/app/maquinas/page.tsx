"use client";

import { useState, useEffect } from 'react';
import { Printer } from '../../types';
import { getStorageData, addPrinter, deletePrinter, updatePrinter } from '../../lib/storage';

export default function MaquinasPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [formData, setFormData] = useState<{
    name: string;
    model: string;
    status: 'Livre' | 'Ocupada' | 'Manutenção';
    depreciationCostPerHour: number;
    energyConsumptionKwPerHour: number;
  }>({
    name: '',
    model: '',
    status: 'Livre',
    depreciationCostPerHour: 0.50,
    energyConsumptionKwPerHour: 0.15
  });

  const loadData = () => {
    setPrinters(getStorageData<Printer>('printers'));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPrinter(formData);
    setIsAdding(false);
    setFormData({
      name: '',
      model: '',
      status: 'Livre',
      depreciationCostPerHour: 0.50,
      energyConsumptionKwPerHour: 0.15
    });
    loadData();
  };

  const handleUpdateStatus = (id: string, status: 'Livre' | 'Ocupada' | 'Manutenção') => {
    updatePrinter(id, { status });
    loadData();
  };

  // Filter printers
  const filteredPrinters = printers.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q);
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Máquinas (Frota)</h2>
          <p className="text-[var(--solar-base1)] mt-1">Gerencie suas impressoras 3D e acompanhe a frota de produção.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-[var(--solar-blue)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
          {isAdding ? 'Cancelar' : '+ Nova Impressora'}
        </button>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">Relatório de Máquinas (Frota)</h1>
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
              placeholder="Buscar por nome ou modelo..." 
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
            <option value="Livre">Livre</option>
            <option value="Ocupada">Ocupada</option>
            <option value="Manutenção">Manutenção</option>
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

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end no-print">
           <div className="col-span-1 md:col-span-2">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Nome de Identificação</label>
             <input type="text" required placeholder="Ex: Bambulab A1 001" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
           </div>
           
           <div className="col-span-1">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Modelo</label>
             <input type="text" required placeholder="Ex: A1, P1S, Ender 3" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
           </div>

           <div className="col-span-1">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Custo Depreciação (R$/h)</label>
             <input type="number" required min="0" step="0.01" value={formData.depreciationCostPerHour} onChange={e => setFormData({...formData, depreciationCostPerHour: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
           </div>

           <div className="col-span-1 text-right mt-2">
              <button type="submit" className="w-full bg-[var(--solar-green)] text-[var(--solar-base03)] px-6 py-2 rounded font-bold hover:opacity-90">Cadastrar</button>
           </div>
        </form>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print-card-grid">
          {filteredPrinters.map(printer => (
            <div key={printer.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col print-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[var(--solar-base2)]">{printer.name}</h3>
                  <p className="text-[var(--solar-base1)] text-sm">{printer.model}</p>
                </div>
                <button onClick={() => { if(confirm('Excluir impressora?')) deletePrinter(printer.id); loadData(); }} className="text-xs bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] px-2 py-1 rounded hover:bg-opacity-40 no-print">
                  🗑️
                </button>
              </div>

              <div className="bg-[var(--solar-base03)] p-4 rounded-xl border border-[var(--solar-base01)] mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--solar-base1)]">Custo Depreciação:</span>
                  <span className="font-mono font-bold text-[var(--solar-base0)]">R$ {printer.depreciationCostPerHour.toFixed(2)}/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--solar-base1)]">Consumo Energia:</span>
                  <span className="font-mono font-bold text-[var(--solar-base0)]">{printer.energyConsumptionKwPerHour.toFixed(2)} kW/h</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-[var(--solar-base01)]">
                <label className="block text-xs font-bold text-[var(--solar-base1)] mb-2">Status Atual da Máquina</label>
                <div className="flex gap-2 no-print">
                   <button onClick={() => handleUpdateStatus(printer.id, 'Livre')} className={`flex-1 text-xs py-2 rounded font-bold transition-all ${printer.status === 'Livre' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 'bg-[var(--solar-base03)] text-[var(--solar-base1)] border border-[var(--solar-base01)]'}`}>
                     🟢 Livre
                   </button>
                   <button onClick={() => handleUpdateStatus(printer.id, 'Ocupada')} className={`flex-1 text-xs py-2 rounded font-bold transition-all ${printer.status === 'Ocupada' ? 'bg-[var(--solar-yellow)] text-[var(--solar-base03)]' : 'bg-[var(--solar-base03)] text-[var(--solar-base1)] border border-[var(--solar-base01)]'}`}>
                     🟡 Ocupada
                   </button>
                   <button onClick={() => handleUpdateStatus(printer.id, 'Manutenção')} className={`flex-1 text-xs py-2 rounded font-bold transition-all ${printer.status === 'Manutenção' ? 'bg-[var(--solar-red)] text-[var(--solar-base03)]' : 'bg-[var(--solar-base03)] text-[var(--solar-base1)] border border-[var(--solar-base01)]'}`}>
                     🔴 Manutenção
                   </button>
                </div>
                <div className="hidden print-only text-sm font-bold mt-1">
                  Status: {printer.status}
                </div>
              </div>
            </div>
          ))}

          {filteredPrinters.length === 0 && !isAdding && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
               <p className="text-[var(--solar-base1)]">Nenhuma impressora encontrada.</p>
             </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                <th className="p-3 text-sm font-bold">Identificação</th>
                <th className="p-3 text-sm font-bold">Modelo</th>
                <th className="p-3 text-sm font-bold">Custo Depreciação</th>
                <th className="p-3 text-sm font-bold">Consumo de Energia</th>
                <th className="p-3 text-sm font-bold">Status</th>
                <th className="p-3 text-sm font-bold text-center no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrinters.map(printer => (
                <tr key={printer.id} className="border-b border-[var(--solar-base01)] bg-[var(--solar-base02)] hover:bg-[var(--solar-base03)] transition-colors">
                  <td className="p-3 text-[var(--solar-base2)] font-bold">{printer.name}</td>
                  <td className="p-3 text-[var(--solar-base0)]">{printer.model}</td>
                  <td className="p-3 text-[var(--solar-base0)] font-mono">R$ {printer.depreciationCostPerHour.toFixed(2)}/h</td>
                  <td className="p-3 text-[var(--solar-base0)] font-mono">{printer.energyConsumptionKwPerHour.toFixed(2)} kW/h</td>
                  <td className="p-3">
                    <div className="flex gap-1 items-center no-print">
                      <select 
                        value={printer.status} 
                        onChange={e => handleUpdateStatus(printer.id, e.target.value as any)}
                        className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded text-xs p-1 text-[var(--solar-base0)] font-bold"
                      >
                        <option value="Livre">🟢 Livre</option>
                        <option value="Ocupada">🟡 Ocupada</option>
                        <option value="Manutenção">🔴 Manutenção</option>
                      </select>
                    </div>
                    <span className="hidden print-only">{printer.status}</span>
                  </td>
                  <td className="p-3 text-center no-print">
                    <button onClick={() => { if(confirm('Excluir impressora?')) deletePrinter(printer.id); loadData(); }} className="bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] px-2.5 py-1.5 rounded hover:bg-opacity-40 transition-colors">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPrinters.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--solar-base1)] bg-[var(--solar-base02)]">
                    Nenhuma impressora encontrada.
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
