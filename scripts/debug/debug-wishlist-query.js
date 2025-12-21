const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugWishlistQuery() {
  console.log('\n=== DEBUG WISHLIST QUERY ===\n');

  const userId = 'ee26ee35-b35c-4376-9b7c-eba6264ba3bd';
  console.log('Querying for user ID:', userId);

  // Try different query variations
  console.log('\n1. Standard query (with is_active filter):');
  const { data: data1, error: error1 } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  console.log('Results:', data1?.length || 0);
  if (error1) console.log('Error:', error1);
  if (data1) console.log('Data:', JSON.stringify(data1, null, 2));

  console.log('\n2. Query without is_active filter:');
  const { data: data2, error: error2 } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('user_id', userId);

  console.log('Results:', data2?.length || 0);
  if (error2) console.log('Error:', error2);
  if (data2) console.log('Data:', JSON.stringify(data2, null, 2));

  console.log('\n3. Query all wishlists (no user filter):');
  const { data: data3, error: error3 } = await supabase
    .from('user_wishlists')
    .select('*');

  console.log('Total wishlists in database:', data3?.length || 0);
  if (error3) console.log('Error:', error3);
  if (data3 && data3.length > 0) {
    console.log('Sample data:', JSON.stringify(data3.slice(0, 3), null, 2));
  }

  console.log('\n4. Check table structure:');
  const { data: data4, error: error4 } = await supabase
    .from('user_wishlists')
    .select('*')
    .limit(1);

  if (data4 && data4.length > 0) {
    console.log('Table columns:', Object.keys(data4[0]));
  }

  console.log('\n=== END DEBUG ===\n');
}

debugWishlistQuery().catch(console.error);
