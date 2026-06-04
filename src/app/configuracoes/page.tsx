"use client";

import { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings } from '../../lib/storage';
import { SystemSettings } from '../../types';

type Tab = 'empresa' | 'seguranca' | 'orcamentos' | 'mensagens';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('empresa');
  const [settings, setSettings] = useState<SystemSettings>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSettings(getSystemSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Configurações do Sistema</h2>
        <p className="text-[var(--solar-base1)] mt-1">Configure as preferências do seu ERP, dados comerciais, controle de acesso e modelos de comunicação.</p>
      </div>

      {saveSuccess && (
        <div className="bg-[var(--solar-green)] bg-opacity-10 border border-[var(--solar-green)] text-[var(--solar-green)] p-4 rounded-xl font-bold flex items-center justify-between animate-fade-in">
          <span>✓ Configurações salvas com sucesso! As alterações já estão em vigor em todo o sistema.</span>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-[var(--solar-base01)] gap-2">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'empresa' ? 'border-[var(--solar-yellow)] text-[var(--solar-yellow)]' : 'border-transparent text-[var(--solar-base1)] hover:text-[var(--solar-base2)]'}`}
        >
          🏢 Empresa & Usuário
        </button>
        <button
          onClick={() => setActiveTab('seguranca')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'seguranca' ? 'border-[var(--solar-yellow)] text-[var(--solar-yellow)]' : 'border-transparent text-[var(--solar-base1)] hover:text-[var(--solar-base2)]'}`}
        >
          🔑 Segurança & Acesso
        </button>
        <button
          onClick={() => setActiveTab('orcamentos')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'orcamentos' ? 'border-[var(--solar-yellow)] text-[var(--solar-yellow)]' : 'border-transparent text-[var(--solar-base1)] hover:text-[var(--solar-base2)]'}`}
        >
          📊 Orçamentos
        </button>
        <button
          onClick={() => setActiveTab('mensagens')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'mensagens' ? 'border-[var(--solar-yellow)] text-[var(--solar-yellow)]' : 'border-transparent text-[var(--solar-base1)] hover:text-[var(--solar-base2)]'}`}
        >
          💬 Modelos de Mensagens
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* ABA: EMPRESA & USUÁRIO */}
        {activeTab === 'empresa' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-1">Dados da Empresa & Usuário</h3>
              <p className="text-xs text-[var(--solar-base1)]">Essas informações são usadas no cabeçalho dos relatórios e nas tags automáticas de e-mails/WhatsApp.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome do Operador / Usuário</label>
                <input
                  type="text"
                  value={settings.userName || ''}
                  onChange={e => setSettings({ ...settings, userName: e.target.value })}
                  placeholder="Nome do operador"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">E-mail do Operador</label>
                <input
                  type="email"
                  value={settings.userEmail || ''}
                  onChange={e => setSettings({ ...settings, userEmail: e.target.value })}
                  placeholder="operador@email.com"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome da Empresa / Nome Comercial</label>
                <input
                  type="text"
                  value={settings.companyName || ''}
                  onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="Sua Fazenda 3D"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">CNPJ da Empresa</label>
                <input
                  type="text"
                  value={settings.companyCnpj || ''}
                  onChange={e => setSettings({ ...settings, companyCnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">WhatsApp / Telefone Comercial</label>
                <input
                  type="text"
                  value={settings.companyPhone || ''}
                  onChange={e => setSettings({ ...settings, companyPhone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={settings.companyEmail || ''}
                  onChange={e => setSettings({ ...settings, companyEmail: e.target.value })}
                  placeholder="comercial@suaempresa.com"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Chave PIX para Recebimentos</label>
                <input
                  type="text"
                  value={settings.companyPixKey || ''}
                  onChange={e => setSettings({ ...settings, companyPixKey: e.target.value })}
                  placeholder="CNPJ, celular, e-mail ou chave aleatória"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">URL da Logomarca (Orçamentos)</label>
                <input
                  type="text"
                  value={settings.quoteHeaderLogoUrl || ''}
                  onChange={e => setSettings({ ...settings, quoteHeaderLogoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Endereço Comercial Completo</label>
                <input
                  type="text"
                  value={settings.companyAddress || ''}
                  onChange={e => setSettings({ ...settings, companyAddress: e.target.value })}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA: SEGURANÇA & ACESSO */}
        {activeTab === 'seguranca' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-1">Segurança de Acesso</h3>
              <p className="text-xs text-[var(--solar-base1)]">Ative a solicitação de login e senha ao carregar o ERP para proteger seus dados locais.</p>
            </div>

            <div className="bg-[var(--solar-base03)] p-4 rounded-xl border border-[var(--solar-base01)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--solar-base2)] text-sm">Bloquear sistema com Usuário e Senha</span>
                  <p className="text-[var(--solar-base1)] text-[10px] mt-0.5">Se ativado, a tela de login protegerá todas as páginas.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.securityEnabled || false}
                    onChange={e => setSettings({ ...settings, securityEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--solar-base01)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--solar-yellow)]"></div>
                </label>
              </div>

              {settings.securityEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--solar-base02)]">
                  <div>
                    <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome do Usuário de Acesso</label>
                    <input
                      type="text"
                      required
                      value={settings.securityUsername || ''}
                      onChange={e => setSettings({ ...settings, securityUsername: e.target.value })}
                      placeholder="admin"
                      className="w-full bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--solar-base1)] mb-1">Senha de Acesso</label>
                    <input
                      type="password"
                      required
                      value={settings.securityPassword || ''}
                      onChange={e => setSettings({ ...settings, securityPassword: e.target.value })}
                      placeholder="Sua senha de segurança"
                      className="w-full bg-[var(--solar-base02)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: ORÇAMENTOS */}
        {activeTab === 'orcamentos' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-1">Definições de Orçamento</h3>
              <p className="text-xs text-[var(--solar-base1)]">Parâmetros financeiros padrão e textos impressos nos relatórios/documentos de orçamentos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Preço Padrão de Produção (Hora/Máquina) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--solar-base1)] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settings.quoteHourBasePrice || 18.00}
                    onChange={e => setSettings({ ...settings, quoteHourBasePrice: Number(e.target.value) })}
                    className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded pl-9 pr-2 py-2 text-[var(--solar-base0)] font-mono"
                  />
                </div>
                <p className="text-[10px] text-[var(--solar-base1)] mt-1">Este valor define o cálculo do preço mínimo de venda atrelado ao tempo de impressão.</p>
              </div>

              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Dias de Validade do Orçamento</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={settings.quoteValidityDays || 15}
                  onChange={e => setSettings({ ...settings, quoteValidityDays: Number(e.target.value) })}
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Termos & Condições Padrão (Impressão)</label>
                <textarea
                  value={settings.quoteTermsConditions || ''}
                  onChange={e => setSettings({ ...settings, quoteTermsConditions: e.target.value })}
                  placeholder="Digite as condições gerais, regras de pagamento e garantia..."
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] h-28"
                />
                <p className="text-[10px] text-[var(--solar-base1)] mt-1">Variáveis disponíveis: `{'{validade_dias}'}`.</p>
              </div>
            </div>
          </div>
        )}

        {/* ABA: MODELOS DE MENSAGENS */}
        {activeTab === 'mensagens' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-1">Modelos de Mensagens (WhatsApp e E-mail)</h3>
              <p className="text-xs text-[var(--solar-base1)]">Customize as mensagens automáticas enviadas para os clientes. O sistema preencherá as tags com os dados reais ao enviar.</p>
            </div>

            {/* Dica de Tags */}
            <div className="bg-[var(--solar-base03)] p-4 rounded-xl border border-[var(--solar-base01)]">
              <span className="font-bold text-[var(--solar-base2)] text-xs block mb-2">🏷️ Tags Dinâmicas Disponíveis:</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-[var(--solar-base1)]">
                <div>{`{cliente_nome}`} - Nome Cliente</div>
                <div>{`{orcamento_numero}`} - Número Orç/Ped</div>
                <div>{`{orcamento_total}`} - Preço Total</div>
                <div>{`{orcamento_frete}`} - Valor do Frete</div>
                <div>{`{orcamento_prazo}`} - Prazo de Entrega</div>
                <div>{`{orcamento_itens}`} - Itens na Proposta</div>
                <div>{`{empresa_nome}`} - Sua Empresa</div>
                <div>{`{usuario_nome}`} - Seu Nome</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--solar-blue)] mb-1">WhatsApp: Envio de Orçamento</label>
                <textarea
                  value={settings.whatsappQuoteTemplate || ''}
                  onChange={e => setSettings({ ...settings, whatsappQuoteTemplate: e.target.value })}
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] h-28 font-sans text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--solar-blue)] mb-1">WhatsApp: Atualização de Pedido</label>
                <textarea
                  value={settings.whatsappOrderTemplate || ''}
                  onChange={e => setSettings({ ...settings, whatsappOrderTemplate: e.target.value })}
                  className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] h-24 font-sans text-sm"
                />
                <p className="text-[10px] text-[var(--solar-base1)] mt-1">Variável extra: `{'{pedido_status}'}`.</p>
              </div>

              <div className="border-t border-[var(--solar-base01)] pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--solar-green)] mb-1">E-mail: Assunto do Orçamento</label>
                  <input
                    type="text"
                    value={settings.emailQuoteSubjectTemplate || ''}
                    onChange={e => setSettings({ ...settings, emailQuoteSubjectTemplate: e.target.value })}
                    className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--solar-green)] mb-1">E-mail: Corpo do Orçamento</label>
                  <textarea
                    value={settings.emailQuoteBodyTemplate || ''}
                    onChange={e => setSettings({ ...settings, emailQuoteBodyTemplate: e.target.value })}
                    className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] h-36 font-sans text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-[var(--solar-base01)] flex justify-end">
          <button type="submit" className="bg-[var(--solar-yellow)] text-[var(--solar-base03)] px-8 py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow">
            Salvar Todas as Configurações
          </button>
        </div>

      </form>
    </div>
  );
}
