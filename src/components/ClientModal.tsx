import { useState } from 'react';
import { addClient } from '../lib/storage';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}

export default function ClientModal({ isOpen, onClose, onSuccess }: ClientModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    billingAddress: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient = addClient(formData);
    onSuccess(newClient.id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Cadastrar Novo Cliente</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome Completo *</label>
            <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
          </div>
          <div>
            <label className="block text-sm text-[var(--solar-base1)] mb-1">Empresa (Opcional)</label>
            <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Telefone (WhatsApp)</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="5511999999999" className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">E-mail</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--solar-base1)] mb-1">Endereço</label>
            <textarea value={formData.billingAddress} onChange={e => setFormData({...formData, billingAddress: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" rows={2} />
          </div>

          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 bg-[var(--solar-base01)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-[var(--solar-green)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
