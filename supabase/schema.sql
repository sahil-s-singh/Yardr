-- Garage Sales Table
CREATE TABLE garage_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  categories TEXT[] DEFAULT '{}',
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE garage_sales ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active garage sales
CREATE POLICY "Public garage sales are viewable by everyone"
  ON garage_sales
  FOR SELECT
  USING (is_active = true);

-- Policy: Anyone can insert garage sales (you can add auth later)
CREATE POLICY "Anyone can create garage sales"
  ON garage_sales
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own garage sales"
  ON garage_sales
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for location queries
CREATE INDEX garage_sales_location_idx ON garage_sales (latitude, longitude);

-- Create index for date queries
CREATE INDEX garage_sales_date_idx ON garage_sales (date);

-- Create index for active status
CREATE INDEX garage_sales_active_idx ON garage_sales (is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_garage_sales_updated_at
  BEFORE UPDATE ON garage_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for Saskatoon
INSERT INTO garage_sales (
  title,
  description,
  latitude,
  longitude,
  address,
  date,
  start_time,
  end_time,
  categories,
  contact_name,
  contact_phone,
  is_active
) VALUES
(
  'Huge Multi-Family Garage Sale!',
  'Furniture, kids toys, clothes, kitchen items, books, and much more! Everything must go!',
  52.1279,
  -106.6702,
  '123 Main St, Saskatoon, SK',
  '2025-12-15',
  '08:00',
  '16:00',
  ARRAY['furniture', 'toys', 'clothing', 'kitchen'],
  'Sarah Johnson',
  '306-555-0101',
  true
),
(
  'Electronics & Tools Sale',
  'Power tools, hand tools, old laptops, gaming consoles, and electronic gadgets.',
  52.1389,
  -106.6650,
  '456 Oak Avenue, Saskatoon, SK',
  '2025-12-14',
  '09:00',
  '15:00',
  ARRAY['electronics', 'tools'],
  'Mike Thompson',
  '306-555-0102',
  true
),
(
  'Moving Sale - Everything Priced to Sell',
  'We are moving! Couch, dining table, TV stand, bikes, sports equipment, and more.',
  52.1450,
  -106.6550,
  '789 Elm Street, Saskatoon, SK',
  '2025-12-21',
  '10:00',
  '17:00',
  ARRAY['furniture', 'sports', 'other'],
  'Emma Davis',
  '306-555-0103',
  true
),
(
  'Baby & Kids Items Sale',
  'Baby clothes (newborn to 2T), strollers, car seats, toys, books, and nursery items.',
  52.1200,
  -106.6800,
  '321 Maple Road, Saskatoon, SK',
  '2025-12-14',
  '08:30',
  '14:00',
  ARRAY['clothing', 'toys', 'books'],
  'Jennifer Lee',
  '306-555-0104',
  true
),
(
  'Vintage & Antique Treasures',
  'Collectibles, vintage furniture, antique dishes, old books, and unique finds!',
  52.1350,
  -106.6900,
  '555 Pine Drive, Saskatoon, SK',
  '2025-12-20',
  '09:00',
  '16:00',
  ARRAY['furniture', 'books', 'other'],
  'Robert Wilson',
  '306-555-0105',
  true
);
