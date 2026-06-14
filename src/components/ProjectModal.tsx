import { useState, useEffect } from 'react';
import { addProject, updateProject, getStorageData } from '../lib/storage';
import { Filament, Project } from '../types';
import SlicerImageUpload, { SlicerData } from './SlicerImageUpload';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
  projectToEdit?: Project | null;
}

export default function ProjectModal({ isOpen, onClose, onSuccess, projectToEdit }: ProjectModalProps) {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    imageUrls: [] as string[],
    estimatedPrintTimeMinutes: 0,
    estimatedConsumptionG: 0,
    successRate: 100,
    filamentsUsage: [] as { filamentId: string; grams: number }[]
  });
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFilaments(getStorageData<Filament>('filaments'));
      if (projectToEdit) {
         setFormData({
            name: projectToEdit.name,
            imageUrls: projectToEdit.imageUrls || [],
            estimatedPrintTimeMinutes: projectToEdit.estimatedPrintTimeMinutes,
            estimatedConsumptionG: projectToEdit.estimatedConsumptionG,
            successRate: projectToEdit.successRate,
            filamentsUsage: projectToEdit.filamentsUsage ? [...projectToEdit.filamentsUsage] : []
         });
      } else {
         setFormData({
            name: '',
            imageUrls: [],
            estimatedPrintTimeMinutes: 0,
            estimatedConsumptionG: 0,
            successRate: 100,
            filamentsUsage: []
         });
      }
    }
  }, [isOpen, projectToEdit]);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectToEdit) {
      updateProject(projectToEdit.id, formData);
      onSuccess(projectToEdit.id);
    } else {
      const newProject = addProject({
        ...formData
      });
      onSuccess(newProject.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--solar-base2)] mb-4">{projectToEdit ? 'Editar Projeto 3D' : 'Cadastrar Novo Projeto 3D'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome do Projeto *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Vaso Geométrico" className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--solar-base1)] mb-1">Print de Tela (Opcional)</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Tempo Total Estimado *</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[var(--solar-base1)] mb-1">Horas</label>
                  <input required type="number" min="0" value={Math.floor(formData.estimatedPrintTimeMinutes / 60)} onChange={e => {
                    const h = Number(e.target.value);
                    const m = formData.estimatedPrintTimeMinutes % 60;
                    setFormData({...formData, estimatedPrintTimeMinutes: (h * 60) + m});
                  }} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--solar-base1)] mb-1">Minutos</label>
                  <input required type="number" min="0" max="59" value={formData.estimatedPrintTimeMinutes % 60} onChange={e => {
                    const h = Math.floor(formData.estimatedPrintTimeMinutes / 60);
                    const m = Number(e.target.value);
                    setFormData({...formData, estimatedPrintTimeMinutes: (h * 60) + m});
                  }} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Consumo Estimado (g) *</label>
              <input required type="number" step="0.1" value={formData.estimatedConsumptionG} onChange={e => setFormData({...formData, estimatedConsumptionG: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Taxa de Sucesso (%) *</label>
              <input required type="number" min="0" max="100" value={formData.successRate} onChange={e => setFormData({...formData, successRate: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
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
            <div className="grid grid-cols-6 gap-3 bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-4 mb-4">
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

          <div className="flex gap-4 mt-8 pt-4 border-t border-[var(--solar-base01)]">
            <button type="button" onClick={onClose} className="flex-1 bg-[var(--solar-base01)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-[var(--solar-blue)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
              Salvar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
