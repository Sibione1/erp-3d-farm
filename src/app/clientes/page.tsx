"use client";

import { useState, useEffect } from 'react';
import { Client } from '../../types';
import { getStorageData, addClient, deleteClient } from '../../lib/storage';

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  
  const defaultFormData = {
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    billingAddress: '',
    cpfCnpj: '',
    rgIe: '',
    postalCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    notes: '',
  };

  const [formData, setFormData] = useState(defaultFormData);

  const loadClients = () => {
    setClients(getStorageData<Client>('clients'));
  };

  useEffect(() => {
    loadClients();
    const handleStorage = () => loadClients();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleCepBlur = async () => {
    const cep = formData.postalCode.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }));
      } else {
        alert('CEP não encontrado!');
      }
    } catch (e) {
      console.error(e);
    }
    setIsSearchingCep(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const composedAddress = formData.street 
      ? `${formData.street}, ${formData.number || 'S/N'}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.postalCode}`
      : formData.billingAddress;

    addClient({
      ...formData,
      billingAddress: composedAddress
    });
    setIsAdding(false);
    setFormData(defaultFormData);
    loadClients();
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.billingAddress && c.billingAddress.toLowerCase().includes(q)) ||
      (c.cpfCnpj && c.cpfCnpj.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Gestão de Clientes</h2>
          <p className="text-[var(--solar-base1)] mt-1">Cadastre seus clientes para gerar orçamentos e pedidos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--solar-blue)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancelar' : '+ Novo Cliente'}
        </button>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">Relatório de Clientes</h1>
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
              placeholder="Buscar por nome, CPF/CNPJ, e-mail ou WhatsApp..." 
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
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Cadastro Completo de Cliente</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[var(--solar-blue)] uppercase tracking-wider border-b border-[var(--solar-base01)] pb-1">1. Dados Básicos e Fiscais</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome Completo *</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">CPF ou CNPJ</label>
                  <input type="text" placeholder="000.000.000-00" value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">RG ou Inscrição Estadual</label>
                  <input type="text" value={formData.rgIe} onChange={e => setFormData({...formData, rgIe: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Empresa / Razão Social</label>
                  <input type="text" placeholder="Opcional" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">WhatsApp / Telefone *</label>
                  <input required type="text" placeholder="(11) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">E-mail</label>
                  <input type="email" placeholder="cliente@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
              </div>
            </div>

            {/* Endereço Completo */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[var(--solar-blue)] uppercase tracking-wider border-b border-[var(--solar-base01)] pb-1">2. Endereço de Entrega / Faturamento</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">CEP</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="00000-000" 
                      value={formData.postalCode} 
                      onChange={e => setFormData({...formData, postalCode: e.target.value})} 
                      onBlur={handleCepBlur}
                      className="flex-1 bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono" 
                    />
                    <button type="button" onClick={handleCepBlur} disabled={isSearchingCep} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-3 py-2 rounded font-bold text-xs hover:bg-[var(--solar-base00)] disabled:opacity-50">
                      {isSearchingCep ? '...' : '🔍'}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Logradouro (Rua/Av)</label>
                  <input type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Número</label>
                  <input type="text" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Complemento</label>
                  <input type="text" placeholder="Apto, Sala, Bloco" value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Bairro</label>
                  <input type="text" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Cidade</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Estado (UF)</label>
                  <input type="text" maxLength={2} placeholder="SP" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] text-center font-mono" />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[var(--solar-blue)] uppercase tracking-wider border-b border-[var(--solar-base01)] pb-1">3. Informações Adicionais</h4>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Notas / Observações Internas</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Escreva observações relevantes sobre o cliente..." className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] h-20" />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button type="submit" className="bg-[var(--solar-blue)] text-[var(--solar-base2)] px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow">
                Salvar Cadastro Completo
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print-card-grid">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col print-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-[var(--solar-base2)]">{client.fullName}</h3>
                  {client.companyName && <p className="text-[var(--solar-base1)] text-xs">🏢 {client.companyName}</p>}
                </div>
              </div>

              {client.cpfCnpj && (
                <p className="text-xs text-[var(--solar-base1)] font-mono mt-1">Doc: {client.cpfCnpj}</p>
              )}
              
              <div className="space-y-2 flex-1 mt-4">
                {client.phone && <p className="text-[var(--solar-base0)] text-sm">📱 {client.phone}</p>}
                {client.email && <p className="text-[var(--solar-base0)] text-sm">✉️ {client.email}</p>}
                {client.billingAddress && <p className="text-[var(--solar-base0)] text-xs mt-2 border-t border-[var(--solar-base01)] border-dashed pt-2">📍 {client.billingAddress}</p>}
                {client.notes && (
                  <div className="mt-2 p-2 bg-[var(--solar-base03)] rounded border border-[var(--solar-base01)] text-[var(--solar-base1)] text-xs italic">
                    {client.notes}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--solar-base01)] flex gap-2 no-print">
                 {client.phone && (
                   <a 
                     href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="flex-1 bg-[#25D366] text-white text-xs py-2 rounded text-center hover:opacity-90 font-bold flex items-center justify-center gap-1.5"
                   >
                     <span>WhatsApp</span>
                   </a>
                 )}
                 {client.email && (
                   <a 
                     href={`mailto:${client.email}`} 
                     className="flex-1 bg-[var(--solar-blue)] text-[var(--solar-base03)] text-xs py-2 rounded text-center hover:opacity-90 font-bold flex items-center justify-center gap-1.5"
                   >
                     <span>E-mail</span>
                   </a>
                 )}
                 <button 
                  onClick={() => {
                    if(confirm('Excluir este cliente?')) {
                      deleteClient(client.id);
                      loadClients();
                    }
                  }}
                  className="bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-xs px-3 py-2 rounded hover:bg-opacity-40 transition-colors"
                  title="Excluir cliente"
                 >
                   🗑️
                 </button>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && !isAdding && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
              <p className="text-[var(--solar-base1)]">Nenhum cliente encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--solar-base03)] border-b border-[var(--solar-base01)] text-[var(--solar-base1)]">
                <th className="p-3 text-sm font-bold">Nome</th>
                <th className="p-3 text-sm font-bold">CPF/CNPJ</th>
                <th className="p-3 text-sm font-bold">Empresa</th>
                <th className="p-3 text-sm font-bold">WhatsApp / Telefone</th>
                <th className="p-3 text-sm font-bold">E-mail</th>
                <th className="p-3 text-sm font-bold text-center no-print">Ações Rápidas</th>
                <th className="p-3 text-sm font-bold text-center no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} className="border-b border-[var(--solar-base01)] bg-[var(--solar-base02)] hover:bg-[var(--solar-base03)] transition-colors">
                  <td className="p-3 text-[var(--solar-base2)] font-bold">{client.fullName}</td>
                  <td className="p-3 text-[var(--solar-base0)] font-mono text-xs">{client.cpfCnpj || '-'}</td>
                  <td className="p-3 text-[var(--solar-base0)]">{client.companyName || '-'}</td>
                  <td className="p-3 text-[var(--solar-base0)] font-mono">{client.phone || '-'}</td>
                  <td className="p-3 text-[var(--solar-base0)]">{client.email || '-'}</td>
                  <td className="p-3 text-center no-print">
                    <div className="flex items-center justify-center gap-1.5">
                       {client.phone && (
                         <a 
                           href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="bg-[#25D366] text-white p-1.5 rounded hover:opacity-90 text-xs font-bold"
                           title="WhatsApp"
                         >
                           WhatsApp
                         </a>
                       )}
                       {client.email && (
                         <a 
                           href={`mailto:${client.email}`} 
                           className="bg-[var(--solar-blue)] text-[var(--solar-base03)] p-1.5 rounded hover:opacity-90 text-xs font-bold"
                           title="E-mail"
                         >
                           E-mail
                         </a>
                       )}
                    </div>
                  </td>
                  <td className="p-3 text-center no-print">
                    <button 
                      onClick={() => {
                        if(confirm('Excluir este cliente?')) {
                          deleteClient(client.id);
                          loadClients();
                        }
                      }}
                      className="bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-xs px-2.5 py-1.5 rounded hover:bg-opacity-40 transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--solar-base1)] bg-[var(--solar-base02)]">
                    Nenhum cliente encontrado.
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
