/*
  # Reverence Technology Database Schema

  ## Overview
  This migration creates the database schema for the Reverence Technology website,
  including tables for service packages and customer inquiries.

  ## New Tables
  
  ### `services`
  - `id` (uuid, primary key) - Unique identifier for each service package
  - `package_name` (text) - Name of the service package
  - `description` (text) - Detailed description of the service
  - `key_features` (jsonb) - Array of key features offered
  - `target_audience` (jsonb) - Array of target customer types
  - `suggested_pricing` (text) - Price range in UGX
  - `display_order` (integer) - Order for displaying services
  - `created_at` (timestamptz) - Timestamp of creation
  
  ### `inquiries`
  - `id` (uuid, primary key) - Unique identifier for each inquiry
  - `full_name` (text) - Customer's full name
  - `email` (text) - Customer's email address
  - `phone` (text) - Customer's phone number
  - `company` (text) - Customer's company name (optional)
  - `service_interest` (text) - Which service they're interested in
  - `message` (text) - Customer's message or inquiry details
  - `status` (text) - Status of inquiry (new, contacted, closed)
  - `created_at` (timestamptz) - Timestamp of inquiry submission

  ## Security
  - Enable RLS on both tables
  - Services table: Public read access, no write access (admin only)
  - Inquiries table: Public insert access only, admin read access
*/

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  description text NOT NULL,
  key_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_audience jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_pricing text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  service_interest text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are publicly readable"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit inquiries"
  ON inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

INSERT INTO services (package_name, description, key_features, target_audience, suggested_pricing, display_order)
VALUES
  ('Starter Web Package', 'A foundational online presence package for businesses taking their first digital steps.', '["5-page website", "Responsive design", "Mobile optimization", "Basic SEO", ".ug domain setup"]'::jsonb, '["Local shops", "Startups", "NGOs in Kampala or district towns"]'::jsonb, 'UGX 500,000 – 1,000,000', 1),
  ('E-Commerce Growth Kit', 'Custom online stores optimized for mobile money and regional delivery systems.', '["Product catalog", "Payment integration (MTN, Airtel, Pesapal)", "Stock management", "Delivery tracking"]'::jsonb, '["Fashion boutiques", "Food vendors", "Local supermarkets"]'::jsonb, 'UGX 1,500,000 – 3,000,000', 2),
  ('Custom Software Bundle', 'Tailored software solutions that streamline operations and fit local workflows.', '["Web/mobile app development", "USSD/SMS gateway", "Data dashboards", "Admin console"]'::jsonb, '["Agri-tech startups", "Health centers", "Logistics firms"]'::jsonb, 'UGX 2,000,000 – 4,000,000 (one-time + maintenance)', 3),
  ('Cloud Migration Pro', 'Hassle-free transition to the cloud with guaranteed data protection.', '["AWS/Azure setup", "Backup automation", "API integrations", "Compliance with local data policies"]'::jsonb, '["Fintechs", "NGOs", "Universities"]'::jsonb, 'UGX 3,000,000 – 5,000,000', 4),
  ('Cyber Security Shield', 'Robust protection from cyber threats increasingly targeting African enterprises.', '["Firewalls", "Anti-phishing protection", "Employee training", "24/7 threat monitoring"]'::jsonb, '["Banks", "Ministries", "Corporate firms"]'::jsonb, 'UGX 2,500,000+', 5),
  ('Digital Marketing Boost', 'Full-scale digital promotion using both local and global channels.', '["SEO/SEM", "WhatsApp Business integration", "Influencer outreach", "Analytics reports"]'::jsonb, '["Event organizers", "Schools", "SMEs", "Churches"]'::jsonb, 'UGX 1,000,000 – 2,500,000', 6),
  ('Networking & Infrastructure Kit', 'Strengthen internal networks and improve team collaboration.', '["Structured cabling", "Wi-Fi setup", "VoIP systems", "CCTV installation", "Server racks"]'::jsonb, '["Schools", "Hotels", "District offices", "NGOs"]'::jsonb, 'UGX 4,000,000 (installation) + UGX 1,000,000/month', 7),
  ('Fintech Compliance Pack', 'End-to-end digital payment ecosystem aligned with local laws.', '["Mobile money APIs", "Transaction dashboards", "POS systems", "Fraud detection tools"]'::jsonb, '["SACCOs", "Microfinance institutions", "Remittance firms"]'::jsonb, 'UGX 5,000,000+', 8),
  ('IT Consulting Enterprise', 'Strategic consulting for organizations scaling across East Africa.', '["Digital strategy", "ERP setup", "Vendor evaluation", "NITA-U compliance advisory"]'::jsonb, '["Corporates", "Exporters", "Government agencies"]'::jsonb, 'UGX 10,000,000 (project-based)', 9),
  ('Hardware & Repair All-In', 'Simplified device procurement, repair, and maintenance support.', '["Device sourcing", "Repairs", "Warranties", "Software licensing", "Onsite servicing"]'::jsonb, '["Hospitals", "Schools", "Factories"]'::jsonb, 'UGX 800,000 – 2,000,000', 10),
  ('Solar-Powered Tech Hub Kit', 'Empower off-grid institutions with sustainable power and connectivity.', '["Solar installation", "Inverter systems", "Low-power servers", "IoT-based monitoring"]'::jsonb, '["Rural schools", "Health centers", "District offices"]'::jsonb, 'UGX 6,000,000 – 10,000,000 (setup)', 11),
  ('E-Learning Pro Suite', 'Transform learning experiences through digital education systems.', '["Learning Management System (LMS)", "Student tracking", "Video lessons", "Quiz automation"]'::jsonb, '["Primary & secondary schools", "Training centers"]'::jsonb, 'UGX 2,000,000 – 3,500,000', 12),
  ('AI Integration & Automation Lab', 'Leverage artificial intelligence to simplify daily operations.', '["AI chatbots", "Predictive analytics", "Facial recognition", "Workflow automation"]'::jsonb, '["Banks", "Telecoms", "Logistics", "Tech startups"]'::jsonb, 'UGX 4,000,000 – 8,000,000', 13),
  ('Brand Identity & Design Package', 'Create a lasting impression through refined visual identity and tone.', '["Logo design", "Brand colors", "Tone guide", "Social media templates", "Business cards"]'::jsonb, '["New startups", "NGOs", "Personal brands"]'::jsonb, 'UGX 600,000 – 1,200,000', 14),
  ('Community Wi-Fi Access Network', 'Bring affordable connectivity to underserved rural or peri-urban communities.', '["Hotspot setup", "Local authentication systems", "Data usage monitoring"]'::jsonb, '["Local governments", "SACCOs", "Schools"]'::jsonb, 'UGX 3,000,000 (setup) + UGX 500,000/month', 15),
  ('Agri-Digital Connect', 'Digitizing agriculture value chains with data and mobile tools.', '["Crop tracking", "Weather integration", "Farmer registry", "E-extension tools"]'::jsonb, '["Cooperatives", "Agribusiness firms", "NGOs"]'::jsonb, 'UGX 3,000,000 – 5,000,000', 16),
  ('Government & NGO Systems Suite', 'Transparent, scalable systems tailored to institutional accountability.', '["Project tracking", "Beneficiary management", "Impact dashboards", "Reporting automation"]'::jsonb, '["Government projects", "NGOs", "Donor agencies"]'::jsonb, 'UGX 6,000,000 – 12,000,000', 17);