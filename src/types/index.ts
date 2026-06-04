export interface Filament {
  id: string;
  brand: string;
  colorName: string;
  colorHex?: string;
  material: string;
  initialWeightG: number;
  currentWeightG: number;
  purchaseCost: number;
  tempPrintStart?: number;
  tempPrintEnd?: number;
  tempBedStart?: number;
  tempBedEnd?: number;
  createdAt: string;
}

export interface Printer {
  id: string;
  name: string;
  model: string;
  status: 'Livre' | 'Ocupada' | 'Manutenção';
  depreciationCostPerHour: number;
  energyConsumptionKwPerHour: number;
  createdAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  cpfCnpj?: string;
  rgIe?: string;
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  imageUrls?: string[];
  estimatedPrintTimeMinutes: number;
  estimatedConsumptionG: number;
  successRate: number;
  filamentsUsage?: { filamentId: string; grams: number }[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  type: '3D_PROJECT' | 'CUSTOM';
  name: string; // Ex: Nome do Projeto ou "Taxa de Modelagem"
  projectId?: string;
  machineId?: string; // Atribuído a uma impressora
  filamentsUsage?: { filamentId: string; grams: number }[];
  quantity?: number; // Quantidade de peças
  status: 'Pendente' | 'Imprimindo' | 'Concluído' | 'Falha';
  wastedGrams: number;
  wastedCost: number;
  price: number; // Preço unitário (finalPrice sugerido ou alterado manualmente)
  cost: number; // Custo unitário
}

export interface Order {
  id: string;
  orderNumber: string; // Ex: ORC-001 ou PED-001
  clientId: string;
  isQuote: boolean; // True = Orçamento, False = Pedido
  items: OrderItem[];
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  paymentStatus: 'Pendente' | 'Pago';
  paymentMethod?: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência';
  calculatedCost: number; // total cost
  machineCost: number;
  filamentCost: number;
  shippingCost: number;
  finalPrice: number; // calculated cost + margin
  marginPercentage: number;
  estimatedDeliveryDate?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'Venda' | 'Filamento' | 'Manutenção' | 'Energia' | 'Outros';
  description: string;
  installment?: string; // Ex: "1/3"
  orderId?: string; // Vínculo com Pedido
  filamentId?: string; // Vínculo com Compra de Estoque
  createdAt: string;
}

export interface SystemSettings {
  userName?: string;
  userEmail?: string;
  companyName?: string;
  companyCnpj?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyPixKey?: string;
  
  // Customization of budgets (Orçamentos)
  quoteHeaderLogoUrl?: string; // Logo Base64 or URL
  quoteTermsConditions?: string; // Termos e condições padrão
  quoteValidityDays?: number; // Dias de validade do orçamento
  quoteHourBasePrice?: number; // Preço/hora máquina (padrão 18.0)

  // Customization of messages
  whatsappQuoteTemplate?: string; // Mensagem padrão para WhatsApp
  whatsappOrderTemplate?: string; // Mensagem padrão para Pedidos
  emailQuoteSubjectTemplate?: string; // Assunto de e-mail
  emailQuoteBodyTemplate?: string; // Corpo de e-mail

  // Security
  securityEnabled?: boolean;
  securityUsername?: string;
  securityPassword?: string;
}


