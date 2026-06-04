-- Schema for ERP 3D Printing

-- 1. Filaments
CREATE TABLE filaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand VARCHAR(255) NOT NULL,
  color_name VARCHAR(255) NOT NULL,
  color_hex VARCHAR(50),
  material VARCHAR(50) NOT NULL,
  initial_weight_g DECIMAL(10, 2) NOT NULL DEFAULT 1000,
  current_weight_g DECIMAL(10, 2) NOT NULL DEFAULT 1000,
  purchase_cost DECIMAL(10, 2) NOT NULL,
  temp_print_start DECIMAL(5, 2),
  temp_print_end DECIMAL(5, 2),
  temp_bed_start DECIMAL(5, 2),
  temp_bed_end DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Printers
CREATE TABLE printers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  depreciation_cost_per_hour DECIMAL(10, 2) NOT NULL,
  energy_consumption_kw_per_hour DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  billing_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Projects (3D Models)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  estimated_print_time_minutes INTEGER NOT NULL,
  estimated_consumption_g DECIMAL(10, 2) NOT NULL,
  success_rate DECIMAL(5, 2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders (Orçamentos e Ordens de Serviço)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  printer_id UUID REFERENCES printers(id),
  status VARCHAR(50) NOT NULL DEFAULT 'Pendente', -- Pendente, Imprimindo, Concluído, Falha, Cancelado
  filament_id UUID REFERENCES filaments(id),
  calculated_cost DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
