-- Execute este SQL no SQL Editor do seu painel do Supabase

-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Filamentos
CREATE TABLE IF NOT EXISTS filaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT NOT NULL,
  material TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  initial_weight_g NUMERIC NOT NULL,
  current_weight_g NUMERIC NOT NULL,
  purchase_cost NUMERIC NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE,
  min_temp NUMERIC,
  max_temp NUMERIC,
  bed_temp NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  billing_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  estimated_print_time_minutes INTEGER NOT NULL,
  estimated_consumption_g NUMERIC NOT NULL,
  success_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos (Ordens de Serviço)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filament_id UUID REFERENCES filaments(id) ON DELETE CASCADE,
  printer_id TEXT,
  status TEXT NOT NULL,
  calculated_cost NUMERIC NOT NULL,
  final_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de Segurança (RLS - Row Level Security)
-- Como é um ERP interno, vamos habilitar e permitir acesso total para fins de teste
-- Em produção, você deve amarrar isso ao auth.uid()

ALTER TABLE filaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions on filaments" ON filaments FOR ALL USING (true);
CREATE POLICY "Allow all actions on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all actions on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all actions on orders" ON orders FOR ALL USING (true);
