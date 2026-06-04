"use client";

import { useState, useEffect } from 'react';
import { Filament } from '../../types';
import { getStorageData, addFilament, deleteFilament, updateFilament, addTransaction } from '../../lib/storage';

export default function FilamentosPage() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  
  const defaultFormData = {
    brand: '',
    colorName: '',
    colorHex: '#ffffff',
    material: 'PLA',
    initialWeightG: 1000,
    currentWeightG: 1000,
    purchaseCost: 0,
    tempPrintStart: 200,
    tempPrintEnd: 220,
    tempBedStart: 60,
    tempBedEnd: 60,
  };
  
  const [formData, setFormData] = useState(defaultFormData);
  const [installments, setInstallments] = useState(1);

  const loadFilaments = () => {
    setFilaments(getStorageData<Filament>('filaments'));
  };

  useEffect(() => {
    loadFilaments();
    const handleStorage = () => loadFilaments();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleEdit = (filament: Filament) => {
    setFormData({
      brand: filament.brand,
      colorName: filament.colorName,
      colorHex: filament.colorHex || '#ffffff',
      material: filament.material,
      initialWeightG: filament.initialWeightG,
      currentWeightG: filament.currentWeightG,
      purchaseCost: filament.purchaseCost,
      tempPrintStart: filament.tempPrintStart || 200,
      tempPrintEnd: filament.tempPrintEnd || 220,
      tempBedStart: filament.tempBedStart || 60,
      tempBedEnd: filament.tempBedEnd || 60,
    });
    setEditingId(filament.id);
    setInstallments(1);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setInstallments(1);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateFilament(editingId, {
        ...formData,
        initialWeightG: Number(formData.initialWeightG),
        currentWeightG: Number(formData.currentWeightG),
        purchaseCost: Number(formData.purchaseCost),
        tempPrintStart: Number(formData.tempPrintStart),
        tempPrintEnd: Number(formData.tempPrintEnd),
        tempBedStart: Number(formData.tempBedStart),
        tempBedEnd: Number(formData.tempBedEnd),
      });
    } else {
      const newFilament = addFilament({
        ...formData,
        initialWeightG: Number(formData.initialWeightG),
        currentWeightG: Number(formData.currentWeightG),
        purchaseCost: Number(formData.purchaseCost),
        tempPrintStart: Number(formData.tempPrintStart),
        tempPrintEnd: Number(formData.tempPrintEnd),
        tempBedStart: Number(formData.tempBedStart),
        tempBedEnd: Number(formData.tempBedEnd),
      });

      // Registrar Despesa no Financeiro
      const amountPerInstallment = formData.purchaseCost / installments;
      const now = new Date();
      
      for (let i = 0; i < installments; i++) {
        const currentDate = new Date(now.getFullYear(), now.getMonth() + i, now.getDate());
        
        addTransaction({
          date: currentDate.toISOString().split('T')[0],
          amount: amountPerInstallment,
          type: 'EXPENSE',
          category: 'Filamento',
          description: `Compra de Filamento: ${formData.brand} - ${formData.colorName}`,
          installment: installments > 1 ? `${i + 1}/${installments}` : undefined,
          filamentId: newFilament.id
        });
      }
    }

    handleCancel();
    loadFilaments();
  };

  const handleUpdateWeight = (id: string, usedGrams: number) => {
    const filament = filaments.find(f => f.id === id);
    if (filament) {
      const newWeight = Math.max(0, filament.currentWeightG - usedGrams);
      updateFilament(id, { currentWeightG: newWeight });
      loadFilaments();
    }
  };

  // Filter filaments
  const filteredFilaments = filaments.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = f.brand.toLowerCase().includes(q) || f.colorName.toLowerCase().includes(q);
    const matchesMaterial = selectedMaterial === 'ALL' || f.material === selectedMaterial;
    return matchesQuery && matchesMaterial;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Estoque de Filamentos</h2>
          <p className="text-[var(--solar-base1)] mt-1">Gerencie seus rolos, cores e controle as gramas restantes.</p>
        </div>
        <button 
          onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
          className={`${isAdding ? 'bg-[var(--solar-red)]' : 'bg-[var(--solar-green)]'} text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity`}
        >
          {isAdding ? 'Cancelar Edição' : '+ Novo Rolo'}
        </button>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">Relatório de Estoque de Filamentos</h1>
        <p className="text-sm text-gray-600">ERP 3D Farm - Gerado em {new Date().toLocaleDateString()}</p>
        {(searchQuery || selectedMaterial !== 'ALL') && (
          <p className="text-xs text-gray-500 mt-1">
            Filtros: {searchQuery && `Busca: "${searchQuery}"`} {selectedMaterial !== 'ALL' && `Material: ${selectedMaterial}`}
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
              placeholder="Buscar por marca ou cor..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded pl-9 pr-4 py-2 text-[var(--solar-base0)] text-sm"
            />
          </div>

          <select 
            value={selectedMaterial} 
            onChange={e => setSelectedMaterial(e.target.value)}
            className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] text-sm"
          >
            <option value="ALL">Todos Materiais</option>
            <option value="PLA">PLA</option>
            <option value="PETG">PETG</option>
            <option value="ABS">ABS</option>
            <option value="TPU">TPU</option>
            <option value="ASA">ASA</option>
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
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm no-print">
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">{editingId ? 'Editar Rolo' : 'Adicionar Novo Rolo'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Marca</label>
              <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Cor (Nome)</label>
              <input required type="text" value={formData.colorName} onChange={e => setFormData({...formData, colorName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Código Hex da Cor</label>
              <div className="flex gap-2">
                <input type="color" value={formData.colorHex} onChange={e => setFormData({...formData, colorHex: e.target.value})} className="h-10 w-10 rounded cursor-pointer" />
                <input type="text" value={formData.colorHex} onChange={e => setFormData({...formData, colorHex: e.target.value})} className="flex-1 bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Material</label>
              <select value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
                <option value="ASA">ASA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Peso Inicial (g)</label>
              <input required type="number" value={formData.initialWeightG} onChange={e => setFormData({...formData, initialWeightG: Number(e.target.value), currentWeightG: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div className="col-span-1">
             <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Custo Total (R$)</label>
             <input type="number" required min="0.01" step="0.01" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono" />
           </div>

           {!editingId && (
             <div className="col-span-1">
               <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Parcelas de Compra</label>
               <select required value={installments} onChange={e => setInstallments(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                 {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
               </select>
             </div>
           )}
           
           {!editingId && installments > 1 && (
             <div className="col-span-1 flex items-end">
                <p className="text-xs text-[var(--solar-base1)] mb-2">{installments}x de R$ {(formData.purchaseCost / installments).toFixed(2)} / mês</p>
             </div>
           )}
            
            {/* Especificações de temperatura */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[var(--solar-base01)] pt-4 mt-2">
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Bico Início (°C)</label>
                <input type="number" value={formData.tempPrintStart} onChange={e => setFormData({...formData, tempPrintStart: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Bico Fim (°C)</label>
                <input type="number" value={formData.tempPrintEnd} onChange={e => setFormData({...formData, tempPrintEnd: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Mesa Início (°C)</label>
                <input type="number" value={formData.tempBedStart} onChange={e => setFormData({...formData, tempBedStart: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Mesa Fim (°C)</label>
                <input type="number" value={formData.tempBedEnd} onChange={e => setFormData({...formData, tempBedEnd: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-4">
              <button type="submit" className="bg-[var(--solar-blue)] text-[var(--solar-base2)] px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity">
                {editingId ? 'Salvar Alteração' : 'Registrar Filamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print-card-grid">
          {filteredFilaments.map(filament => {
            const percentLeft = (filament.currentWeightG / filament.initialWeightG) * 100;
            const isLow = filament.currentWeightG < 100;
            const costPerGram = (filament.purchaseCost / filament.initialWeightG).toFixed(2);

            return (
              <div key={filament.id} className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden shadow-sm flex flex-col print-card">
                <div className="h-4 w-full" style={{ backgroundColor: filament.colorHex }}></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-[var(--solar-base2)]">{filament.brand}</h3>
                    <span className="bg-[var(--solar-base03)] text-[var(--solar-base1)] text-xs px-2 py-1 rounded border border-[var(--solar-base01)]">{filament.material}</span>
                  </div>
                  <p className="text-[var(--solar-base1)] mb-4">{filament.colorName}</p>
                  
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--solar-base1)]">Restante</span>
                      <span className={`font-bold ${isLow ? 'text-[var(--solar-red)]' : 'text-[var(--solar-green)]'}`}>
                        {filament.currentWeightG}g / {filament.initialWeightG}g
                      </span>
                    </div>
                    <div className="w-full bg-[var(--solar-base03)] rounded-full h-2.5 mb-4">
                      <div className={`h-2.5 rounded-full ${isLow ? 'bg-[var(--solar-red)]' : 'bg-[var(--solar-green)]'}`} style={{ width: `${Math.max(0, Math.min(100, percentLeft))}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-4 border-t border-[var(--solar-base01)] pt-4">
                      <div>
                        <p className="text-[var(--solar-base1)] text-xs">Custo de Compra</p>
                        <p className="text-[var(--solar-base2)] font-mono">R$ {filament.purchaseCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--solar-base1)] text-xs">Custo por Grama</p>
                        <p className="text-[var(--solar-base2)] font-mono">R$ {costPerGram}</p>
                      </div>
                      <div>
                        <p className="text-[var(--solar-base1)] text-xs">Temp. Bico</p>
                        <p className="text-[var(--solar-base2)] font-mono">{filament.tempPrintStart}-{filament.tempPrintEnd}°C</p>
                      </div>
                      <div>
                        <p className="text-[var(--solar-base1)] text-xs">Temp. Mesa</p>
                        <p className="text-[var(--solar-base2)] font-mono">{filament.tempBedStart}-{filament.tempBedEnd}°C</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--solar-base01)] flex items-center gap-2 no-print">
                     <div className="flex items-center bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded overflow-hidden h-9">
                       <button 
                        onClick={() => handleUpdateWeight(filament.id, 50)}
                        className="bg-[var(--solar-base02)] text-[var(--solar-base1)] text-[11px] px-2.5 h-full hover:bg-[var(--solar-base01)] hover:text-[var(--solar-base3)] transition-colors border-r border-[var(--solar-base01)] font-medium"
                        title="Subtrair 50g"
                       >
                         -50g
                       </button>
                       <input 
                         type="number" 
                         min="0"
                         max={filament.initialWeightG}
                         value={filament.currentWeightG} 
                         onChange={e => {
                           const val = Number(e.target.value);
                           updateFilament(filament.id, { currentWeightG: val });
                           loadFilaments();
                         }}
                         className="bg-transparent text-[var(--solar-base0)] font-bold font-mono text-xs w-16 text-center focus:outline-none h-full"
                         title="Digitar gramas restantes"
                       />
                       <span className="text-[var(--solar-base1)] text-[10px] pr-2 font-mono">g</span>
                     </div>
                     
                     <button 
                      onClick={() => handleEdit(filament)}
                      className="flex-1 bg-[var(--solar-blue)] bg-opacity-20 text-[var(--solar-blue)] text-xs h-9 rounded hover:bg-opacity-40 transition-colors flex items-center justify-center gap-1 font-bold"
                     >
                       ✏️ Editar
                     </button>
                     <button 
                      onClick={() => {
                        if(confirm('Excluir este filamento?')) {
                          deleteFilament(filament.id);
                          loadFilaments();
                        }
                      }}
                      className="w-9 bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-xs h-9 rounded hover:bg-opacity-40 transition-colors flex items-center justify-center"
                      title="Excluir filamento"
                     >
                       🗑️
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredFilaments.length === 0 && !isAdding && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
              <p className="text-[var(--solar-base1)]">Nenhum filamento encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                <th className="p-3 text-sm font-bold">Cor</th>
                <th className="p-3 text-sm font-bold">Marca</th>
                <th className="p-3 text-sm font-bold">Material</th>
                <th className="p-3 text-sm font-bold">Nome Cor</th>
                <th className="p-3 text-sm font-bold">Restante (g)</th>
                <th className="p-3 text-sm font-bold">Custo Compra</th>
                <th className="p-3 text-sm font-bold">Custo/g</th>
                <th className="p-3 text-sm font-bold">Temp. Bico/Mesa</th>
                <th className="p-3 text-sm font-bold text-center no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFilaments.map(filament => {
                const costPerGram = (filament.purchaseCost / filament.initialWeightG).toFixed(2);
                return (
                  <tr key={filament.id} className="border-b border-[var(--solar-base01)] bg-[var(--solar-base02)] hover:bg-[var(--solar-base03)] transition-colors">
                    <td className="p-3">
                      <div className="w-6 h-6 rounded-full border border-[var(--solar-base01)]" style={{ backgroundColor: filament.colorHex }}></div>
                    </td>
                    <td className="p-3 text-[var(--solar-base2)] font-bold">{filament.brand}</td>
                    <td className="p-3 text-[var(--solar-base0)]">{filament.material}</td>
                    <td className="p-3 text-[var(--solar-base0)]">{filament.colorName}</td>
                    <td className="p-3 text-[var(--solar-base0)] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={filament.currentWeightG < 100 ? 'text-[var(--solar-red)] font-bold' : ''}>
                          {filament.currentWeightG}g
                        </span>
                        <span className="text-xs text-[var(--solar-base1)]">/ {filament.initialWeightG}g</span>
                      </div>
                    </td>
                    <td className="p-3 text-[var(--solar-base2)] font-mono">R$ {filament.purchaseCost.toFixed(2)}</td>
                    <td className="p-3 text-[var(--solar-base2)] font-mono">R$ {costPerGram}</td>
                    <td className="p-3 text-[var(--solar-base1)] text-xs font-mono">
                      {filament.tempPrintStart}-{filament.tempPrintEnd}°C / {filament.tempBedStart}-{filament.tempBedEnd}°C
                    </td>
                    <td className="p-3 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(filament)} 
                          className="bg-[var(--solar-blue)] bg-opacity-20 text-[var(--solar-blue)] px-2.5 py-1.5 rounded hover:bg-opacity-40 transition-colors"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Excluir este filamento?')) {
                              deleteFilament(filament.id);
                              loadFilaments();
                            }
                          }}
                          className="bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] px-2.5 py-1.5 rounded hover:bg-opacity-40 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFilaments.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[var(--solar-base1)] bg-[var(--solar-base02)]">
                    Nenhum filamento encontrado.
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
