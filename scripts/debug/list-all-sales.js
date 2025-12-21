// List all active sales
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listSales() {
  console.log('🔍 Fetching all active sales (same query as app)...\n');

  const { data, error } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${data.length} active sales:\n`);

  data.forEach((sale, idx) => {
    console.log(`${idx + 1}. ${sale.title}`);
    console.log(`   📍 ${sale.address}`);
    console.log(`   📅 ${sale.start_date} (${sale.start_time} - ${sale.end_time})`);
    console.log(`   🆔 ${sale.id}`);
    console.log(`   📝 ${sale.description}`);
    console.log('');
  });

  // Check if our specific sale is in the list
  const targetSale = data.find(s => s.id === 'e1ed3398-f6f1-4d5c-a4ec-50fd74f307e5');
  if (targetSale) {
    console.log('✅ TARGET SALE FOUND IN LIST!');
    console.log('This sale SHOULD appear on the map.');
  } else {
    console.log('❌ TARGET SALE NOT IN LIST');
  }
}

listSales().catch(console.error);
