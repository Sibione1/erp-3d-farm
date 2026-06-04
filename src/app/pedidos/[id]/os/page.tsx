"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStorageData } from '../../../../lib/storage';
import { Order, Client, Filament, Project, Printer } from '../../../../types';

export default function OrderServicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);

  useEffect(() => {
    const orders = getStorageData<Order>('orders');
    const clients = getStorageData<Client>('clients');
    const allFilaments = getStorageData<Filament>('filaments');
    const allProjects = getStorageData<Project>('projects');
    const allPrinters = getStorageData<Printer>('printers');

    setFilaments(allFilaments);
    setProjects(allProjects);
    setPrinters(allPrinters);

    const foundOrder = orders.find(o => o.id === id);
    if (foundOrder) {
      setOrder(foundOrder);
      setClient(clients.find(c => c.id === foundOrder.clientId) || null);
    }
  }, [id]);

  if (!order) return <div className="p-8 text-center">Carregando OS...</div>;

  return (
    <div className="bg-white text-black min-h-screen font-sans p-8 print:p-0">
      {/* Header OS */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase">Ordem de Serviço (Produção)</h1>
          <p className="text-xl mt-1">Pedido <span className="font-mono font-bold">#{order.orderNumber}</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase text-gray-500">Data de Emissão</p>
          <p className="font-mono">{new Date().toLocaleDateString()}</p>
          <button onClick={() => window.print()} className="mt-2 bg-black text-white px-4 py-2 rounded text-sm print:hidden">
             🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="border-2 border-black p-4 mb-6">
        <h2 className="text-xs font-black uppercase bg-black text-white inline-block px-2 py-1 mb-2">Dados do Cliente</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Nome</p>
            <p className="font-bold text-lg">{client?.fullName || 'Desconhecido'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Contato</p>
            <p className="font-mono">{client?.phone || 'Não informado'}</p>
          </div>
          <div className="col-span-2">
             <p className="text-xs text-gray-500 uppercase font-bold">Endereço</p>
             <p>{client?.billingAddress || 'Retirada no local'}</p>
          </div>
        </div>
      </div>

      {/* Itens a Imprimir */}
      <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 pb-2">Roteiro de Impressão</h2>
      
      <div className="space-y-6">
        {order.items.map((item, index) => {
          const project = projects.find(p => p.id === item.projectId);
          const printer = printers.find(p => p.id === item.machineId);
          
          return (
            <div key={item.id} className="border-2 border-dashed border-gray-400 p-4 relative page-break-inside-avoid">
              <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 font-black">Item {index + 1}</div>
              
              <div className="mb-4 pr-20">
                <h3 className="text-2xl font-bold">{item.name}</h3>
                <p className="text-gray-600 italic mt-1">{'Sem observações do pedido.'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                 <div className="border border-gray-300 p-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Projeto Base</p>
                    <p className="font-bold text-sm">{project?.name || 'Desconhecido'}</p>
                 </div>
                 <div className="border border-gray-300 p-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Máquina / Impressora</p>
                    <p className="font-bold text-sm">{printer?.name || 'NÃO ATRIBUÍDA'}</p>
                 </div>
                 <div className="border border-gray-300 p-2 text-center bg-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Status Atual</p>
                    <p className="font-black text-sm uppercase">{item.status}</p>
                 </div>
              </div>

              {/* Informações de Filamento para AMS */}
              <div className="mt-4 border-t border-gray-300 pt-4">
                <h4 className="text-sm font-black uppercase mb-2">Cores / Filamentos Necessários (Carregamento AMS)</h4>
                {item.filamentsUsage && item.filamentsUsage.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.filamentsUsage.map(usage => {
                      const fil = filaments.find(f => f.id === usage.filamentId);
                      if (!fil) return null;
                      return (
                        <div key={usage.filamentId} className="flex items-center gap-2 border border-gray-300 p-2 rounded w-48">
                          <div className="w-6 h-6 border border-gray-400 rounded-full" style={{ backgroundColor: fil.colorHex }}></div>
                          <div className="flex-1">
                            <p className="text-xs font-bold leading-tight">{fil.colorName}</p>
                            <p className="text-[10px] text-gray-600 leading-tight">{fil.brand} - {fil.material} ({usage.grams}g)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhum filamento específico selecionado.</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-between text-xs border-t border-dashed border-gray-300 pt-2">
                 <span>[ ] Fatiado</span>
                 <span>[ ] Enviado p/ Impressora</span>
                 <span>[ ] Concluído c/ Sucesso</span>
                 <span>[ ] Limpo & Embalado</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>ERP 3D Farm - Gestão Interna de Produção</p>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          aside {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
