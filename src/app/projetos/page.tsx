"use client";

import { useState, useEffect } from 'react';
import { Project, Filament, Order } from '../../types';
import { getStorageData, addProject, deleteProject, updateProject, updateFilament } from '../../lib/storage';
import SlicerImageUpload, { SlicerData } from '../../components/SlicerImageUpload';

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    imageUrls: [] as string[],
    estimatedPrintTimeMinutes: 0,
    estimatedConsumptionG: 0,
    successRate: 100,
    filamentsUsage: [] as { filamentId: string; grams: number }[]
  });

  const [deductStock, setDeductStock] = useState(true);

  const loadData = () => {
    setProjects(getStorageData<Project>('projects'));
    setFilaments(getStorageData<Filament>('filaments'));
    setOrders(getStorageData<Order>('orders'));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProjectId) {
      updateProject(editingProjectId, formData);
      setEditingProjectId(null);
    } else {
      addProject(formData);
      if (deductStock && formData.filamentsUsage.length > 0) {
        formData.filamentsUsage.forEach(usage => {
          const fil = filaments.find(f => f.id === usage.filamentId);
          if (fil) {
            const newWeight = Math.max(0, fil.currentWeightG - usage.grams);
            updateFilament(fil.id, { currentWeightG: newWeight });
          }
        });
      }
    }
    setIsAdding(false);
    setFormData({ name: '', imageUrls: [], estimatedPrintTimeMinutes: 0, estimatedConsumptionG: 0, successRate: 100, filamentsUsage: [] });
    loadData();
  };

  const handleEdit = (project: Project) => {
     setFormData({
        name: project.name,
        imageUrls: project.imageUrls || [],
        estimatedPrintTimeMinutes: project.estimatedPrintTimeMinutes,
        estimatedConsumptionG: project.estimatedConsumptionG,
        successRate: project.successRate,
        filamentsUsage: project.filamentsUsage ? [...project.filamentsUsage] : []
     });
     setEditingProjectId(project.id);
     setIsAdding(true);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSlicerData = (data: SlicerData, base64Image: string) => {
    let extractedUsage: { filamentId: string; grams: number }[] = [];
    
    if (data.filaments && data.filaments.length > 0) {
      data.filaments.forEach(fAi => {
         let match;
         if (fAi.id) {
            match = filaments.find(f => f.id === fAi.id);
         }
         
         if (!match) {
            const lowerName = fAi.name.toLowerCase();
            match = filaments.find(f => {
                const colorWords = f.colorName.toLowerCase().split(' ').filter(w => w.length > 2);
                const hasColorMatch = colorWords.some(w => lowerName.includes(w)) || lowerName.includes(f.colorName.toLowerCase());
                const hasMaterialMatch = lowerName.includes(f.material.toLowerCase());
                return hasColorMatch && hasMaterialMatch;
            });
            if (!match) {
                match = filaments.find(f => {
                   const colorWords = f.colorName.toLowerCase().split(' ').filter(w => w.length > 2);
                   return colorWords.some(w => lowerName.includes(w)) || lowerName.includes(f.colorName.toLowerCase());
                });
            }
         }

         if (match) {
            extractedUsage.push({ filamentId: match.id, grams: fAi.grams });
         }
      });
    }

    setFormData(prev => {
      const mergedUsage = [...prev.filamentsUsage];
      extractedUsage.forEach(eu => {
         const existingIndex = mergedUsage.findIndex(m => m.filamentId === eu.filamentId);
         if (existingIndex >= 0) {
            mergedUsage[existingIndex].grams += eu.grams;
         } else {
            mergedUsage.push(eu);
         }
      });

      return {
        ...prev,
        name: data.projectName ? data.projectName : prev.name,
        imageUrls: [...prev.imageUrls, base64Image],
        estimatedPrintTimeMinutes: prev.estimatedPrintTimeMinutes + ((data.hours * 60) + data.minutes),
        estimatedConsumptionG: prev.estimatedConsumptionG + data.totalGrams,
        filamentsUsage: mergedUsage
      };
    });
  };

  const toggleFilament = (id: string) => {
    const current = formData.filamentsUsage || [];
    const exists = current.find(u => u.filamentId === id);
    if (exists) {
      setFormData({ ...formData, filamentsUsage: current.filter(u => u.filamentId !== id) });
    } else {
      setFormData({ ...formData, filamentsUsage: [...current, { filamentId: id, grams: 0 }] });
    }
  };

  const updateFilamentGrams = (id: string, grams: number) => {
    const current = formData.filamentsUsage || [];
    setFormData({
      ...formData,
      filamentsUsage: current.map(u => u.filamentId === id ? { ...u, grams } : u)
    });
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Projetos e Modelos 3D</h2>
          <p className="text-[var(--solar-base1)] mt-1">Faça upload de prints do fatiador para a IA extrair dados automaticamente.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--solar-magenta)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancelar' : '+ Novo Projeto'}
        </button>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">Relatório de Projetos 3D</h1>
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
              placeholder="Buscar por nome do projeto..." 
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
              className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'card' ? 'bg-[var(--solar-magenta)] text-[var(--solar-base03)] font-bold' : 'text-[var(--solar-base1)] hover:text-[var(--solar-base3)]'}`}
            >
              🗂️ Cards
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--solar-magenta)] text-[var(--solar-base03)] font-bold' : 'text-[var(--solar-base1)] hover:text-[var(--solar-base3)]'}`}
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
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Adicionar Projeto (Upload Inteligente)</h3>
          
          <div className="mb-6">
            {formData.imageUrls.length === 0 ? (
              <SlicerImageUpload 
                onDataExtracted={handleSlicerData} 
                availableFilaments={filaments.map(f => ({ id: f.id, name: `${f.brand} ${f.material} ${f.colorName}` }))} 
              />
            ) : (
              <div className="relative border-2 border-[var(--solar-blue)] rounded-xl p-4 text-center group">
                 <div className="flex gap-2 overflow-x-auto pb-2">
                    {formData.imageUrls.map((img, i) => (
                      <div key={i} className="relative flex-shrink-0">
                        <img src={img} alt="Preview" className="h-32 w-48 object-cover rounded" />
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({...prev, imageUrls: prev.imageUrls.filter((_, idx) => idx !== i)}))}
                          className="absolute top-1 right-1 bg-[var(--solar-red)] text-[var(--solar-base3)] w-6 h-6 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          X
                        </button>
                      </div>
                    ))}
                 </div>
                <p className="text-[var(--solar-green)] font-bold mt-2">✓ {formData.imageUrls.length} Imagem(ns) carregada(s)!</p>
                <div className="mt-4">
                  <SlicerImageUpload 
                    onDataExtracted={handleSlicerData} 
                    availableFilaments={filaments.map(f => ({ id: f.id, name: `${f.brand} ${f.material} ${f.colorName}` }))} 
                  />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome do Projeto</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Horas</label>
                <input required type="number" min="0" value={Math.floor(formData.estimatedPrintTimeMinutes / 60)} onChange={e => {
                  const h = Number(e.target.value);
                  const m = formData.estimatedPrintTimeMinutes % 60;
                  setFormData({...formData, estimatedPrintTimeMinutes: (h * 60) + m});
                }} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Minutos</label>
                <input required type="number" min="0" max="59" value={formData.estimatedPrintTimeMinutes % 60} onChange={e => {
                  const h = Math.floor(formData.estimatedPrintTimeMinutes / 60);
                  const m = Number(e.target.value);
                  setFormData({...formData, estimatedPrintTimeMinutes: (h * 60) + m});
                }} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Consumo Total Estimado (Gramas)</label>
              <input required type="number" step="0.1" value={formData.estimatedConsumptionG} onChange={e => setFormData({...formData, estimatedConsumptionG: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Taxa de Sucesso (%)</label>
              <input required type="number" min="0" max="100" value={formData.successRate} onChange={e => setFormData({...formData, successRate: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div className="md:col-span-2">
              {formData.imageUrls.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {formData.imageUrls.map((img, idx) => (
                    <img key={idx} src={img} alt={`Print ${idx+1}`} className="h-20 w-auto rounded border border-[var(--solar-base01)] shadow-sm" />
                  ))}
                </div>
              )}

              <label className="block text-sm text-[var(--solar-base1)] mb-2 flex justify-between">
                <span>Filamentos Associados (Cores ativadas: {formData.filamentsUsage?.length || 0})</span>
              </label>
              
              <div className="grid grid-cols-6 md:grid-cols-10 gap-3 bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-4 mb-4">
                {filaments.length === 0 ? (
                  <p className="col-span-full text-xs text-[var(--solar-base1)] text-center">Nenhum filamento cadastrado no estoque.</p>
                ) : filaments.map(f => {
                  const usageIndex = formData.filamentsUsage?.findIndex(u => u.filamentId === f.id);
                  const isSelected = usageIndex !== undefined && usageIndex >= 0;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFilament(f.id)}
                      title={`${f.brand} ${f.material} ${f.colorName} (${f.currentWeightG}g disponíveis)`}
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 ${isSelected ? 'border-[var(--solar-green)] ring-2 ring-[var(--solar-green)] ring-offset-2 ring-offset-[var(--solar-base03)] shadow-lg' : 'border-transparent shadow-sm'}`}
                      style={{ backgroundColor: f.colorHex || '#586e75' }}
                    >
                      {isSelected && (
                        <span className="text-white drop-shadow-md text-lg font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {formData.filamentsUsage.length > 0 && (
                <div className="bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[var(--solar-base1)] mb-2">Consumo por Filamento Ativado</h4>
                  {formData.filamentsUsage.map(usage => {
                    const f = filaments.find(fil => fil.id === usage.filamentId);
                    if (!f) return null;
                    return (
                      <div key={f.id} className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full border border-gray-400" style={{ backgroundColor: f.colorHex || '#ccc' }}></div>
                        <span className="flex-1 text-sm text-[var(--solar-base0)]">{f.brand} {f.colorName}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0"
                            value={usage.grams} 
                            onChange={e => updateFilamentGrams(f.id, Number(e.target.value))}
                            className="w-24 bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-1 text-right text-[var(--solar-base0)]"
                          />
                          <span className="text-xs text-[var(--solar-base1)]">g</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-end mt-4 gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="deductStock" 
                  checked={deductStock} 
                  onChange={e => setDeductStock(e.target.checked)}
                  className="w-4 h-4 text-[var(--solar-magenta)] bg-[var(--solar-base03)] border-[var(--solar-base01)] rounded"
                />
                <label htmlFor="deductStock" className="text-sm font-bold text-[var(--solar-base0)]">
                  Dar baixa automática no estoque de filamentos agora
                </label>
              </div>

              <div className="flex gap-2">
                {editingProjectId && (
                  <button type="button" onClick={() => { setIsAdding(false); setEditingProjectId(null); setFormData({ name: '', imageUrls: [], estimatedPrintTimeMinutes: 0, estimatedConsumptionG: 0, successRate: 100, filamentsUsage: [] }); }} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-6 py-2 rounded font-bold hover:opacity-90">
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={isAnalyzing} className="bg-[var(--solar-magenta)] text-[var(--solar-base2)] px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {editingProjectId ? 'Salvar Alterações' : 'Salvar Projeto'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print-card-grid">
          {filteredProjects.map(project => {
            const linkedOrders = orders.filter(o => o.items.some(i => i.projectId === project.id));

            return (
              <div key={project.id} className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] shadow-sm overflow-hidden flex flex-col print-card">
                {project.imageUrls && project.imageUrls.length > 0 ? (
                  <div className="relative h-40 w-full overflow-hidden bg-[var(--solar-base03)] group">
                    <img src={project.imageUrls[0]} alt={project.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    {project.imageUrls.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-[var(--solar-base02)] bg-opacity-80 px-2 py-1 rounded text-xs font-bold text-[var(--solar-base0)]">
                        +{project.imageUrls.length - 1} print{project.imageUrls.length - 1 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-40 bg-[var(--solar-base03)] flex items-center justify-center border-b border-[var(--solar-base01)]">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                
                {linkedOrders.length > 0 && (
                   <div className="px-6 py-2 bg-[var(--solar-base03)] border-b border-[var(--solar-base01)]">
                     <p className="text-[10px] text-[var(--solar-base1)] font-bold mb-1">USADO EM:</p>
                     <div className="flex flex-wrap gap-1">
                        {linkedOrders.map(o => (
                           <span key={o.id} className="text-[10px] px-2 py-0.5 rounded bg-[var(--solar-base02)] border border-[var(--solar-base01)] text-[var(--solar-blue)] font-mono">
                             {o.orderNumber}
                           </span>
                        ))}
                     </div>
                   </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">{project.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="bg-[var(--solar-base03)] p-3 rounded border border-[var(--solar-base01)]">
                      <p className="text-[var(--solar-base1)] text-xs mb-1">Tempo</p>
                      <p className="text-[var(--solar-base2)] font-mono">{formatTime(project.estimatedPrintTimeMinutes)}</p>
                    </div>
                    <div className="bg-[var(--solar-base03)] p-3 rounded border border-[var(--solar-base01)]">
                      <p className="text-[var(--solar-base1)] text-xs mb-1">Consumo</p>
                      <p className="text-[var(--solar-base2)] font-mono">{project.estimatedConsumptionG}g</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--solar-base01)] flex gap-2 no-print">
                     <button 
                      onClick={() => handleEdit(project)}
                      className="flex-1 bg-solar-blue/15 text-solar-blue text-xs py-2 rounded hover:bg-solar-blue/30 transition-colors font-bold"
                     >
                       Editar
                     </button>
                     <button 
                      onClick={() => {
                        if(confirm('Excluir este projeto?')) {
                          deleteProject(project.id);
                          loadData();
                        }
                      }}
                      className="flex-1 bg-solar-red/15 text-solar-red text-xs py-2 rounded hover:bg-solar-red/30 transition-colors font-bold"
                     >
                       Excluir
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProjects.length === 0 && !isAdding && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
              <p className="text-[var(--solar-base1)]">Nenhum projeto encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                <th className="p-3 text-sm font-bold">Preview</th>
                <th className="p-3 text-sm font-bold">Nome do Projeto</th>
                <th className="p-3 text-sm font-bold">Tempo Estimado</th>
                <th className="p-3 text-sm font-bold">Consumo (g)</th>
                <th className="p-3 text-sm font-bold">Taxa de Sucesso</th>
                <th className="p-3 text-sm font-bold">Usado em Orçamentos</th>
                <th className="p-3 text-sm font-bold text-center no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => {
                const linkedOrders = orders.filter(o => o.items.some(i => i.projectId === project.id));
                return (
                  <tr key={project.id} className="border-b border-[var(--solar-base01)] bg-[var(--solar-base02)] hover:bg-[var(--solar-base03)] transition-colors">
                    <td className="p-3">
                      {project.imageUrls && project.imageUrls.length > 0 ? (
                        <img src={project.imageUrls[0]} alt={project.name} className="h-10 w-16 object-cover rounded border border-[var(--solar-base01)]" />
                      ) : (
                        <div className="h-10 w-16 bg-[var(--solar-base03)] flex items-center justify-center rounded text-lg border border-[var(--solar-base01)]">📦</div>
                      )}
                    </td>
                    <td className="p-3 text-[var(--solar-base2)] font-bold">{project.name}</td>
                    <td className="p-3 text-[var(--solar-base0)] font-mono">{formatTime(project.estimatedPrintTimeMinutes)}</td>
                    <td className="p-3 text-[var(--solar-base0)] font-mono">{project.estimatedConsumptionG}g</td>
                    <td className="p-3 text-[var(--solar-base0)] font-mono">{project.successRate}%</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {linkedOrders.map(o => (
                          <span key={o.id} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--solar-base03)] border border-[var(--solar-base01)] text-[var(--solar-blue)] font-mono">
                            {o.orderNumber}
                          </span>
                        ))}
                        {linkedOrders.length === 0 && <span className="text-[var(--solar-base1)] text-xs">-</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEdit(project)} className="bg-solar-blue/15 text-solar-blue px-2.5 py-1.5 rounded hover:bg-solar-blue/30 transition-colors text-xs font-bold">
                          Editar
                        </button>
                        <button onClick={() => { if(confirm('Excluir este projeto?')) { deleteProject(project.id); loadData(); } }} className="bg-solar-red/15 text-solar-red px-2.5 py-1.5 rounded hover:bg-solar-red/30 transition-colors text-xs font-bold">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--solar-base1)] bg-[var(--solar-base02)]">
                    Nenhum projeto encontrado.
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
