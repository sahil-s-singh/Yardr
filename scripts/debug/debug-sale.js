// Quick debug script to check a specific sale
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSale() {
  const saleId = 'e1ed3398-f6f1-4d5c-a4ec-50fd74f307e5';

  console.log('🔍 Checking sale:', saleId);

  // Try to get the sale without any filters
  const { data, error } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('id', saleId)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data) {
    console.log('❌ Sale not found in database');
    return;
  }

  console.log('\n✅ Sale found!');
  console.log('Title:', data.title);
  console.log('Description:', data.description);
  console.log('Is Active:', data.is_active);
  console.log('Date:', data.date);
  console.log('Start Date:', data.start_date);
  console.log('End Date:', data.end_date);
  console.log('Location:', data.address);
  console.log('Coordinates:', data.latitude, data.longitude);
  console.log('Created At:', data.created_at);
  console.log('User ID:', data.user_id);
  console.log('\n📋 Full record:');
  console.log(JSON.stringify(data, null, 2));

  // Check if it would be returned by getAllGarageSales
  if (!data.is_active) {
    console.log('\n⚠️  ISSUE: Sale is NOT ACTIVE (is_active = false)');
    console.log('This is why it\'s not showing up on the map.');
  } else {
    console.log('\n✅ Sale is active and should appear on the map');
  }
}

checkSale().catch(console.error);
