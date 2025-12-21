const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWishlistInsert() {
  console.log('\n=== TEST WISHLIST INSERT ===\n');

  const userId = 'ee26ee35-b35c-4376-9b7c-eba6264ba3bd';

  console.log('Attempting to insert wishlist item...');
  console.log('User ID:', userId);
  console.log('Item name: test grape');
  console.log('Description: grape\n');

  const { data, error } = await supabase
    .from('user_wishlists')
    .insert([{
      user_id: userId,
      item_name: 'test grape',
      description: 'grape',
      category: null,
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ INSERT FAILED!');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
  } else {
    console.log('✅ INSERT SUCCESS!');
    console.log('Inserted data:', JSON.stringify(data, null, 2));
  }

  // Check if it's in the database now
  console.log('\nQuerying for all wishlists...');
  const { data: allWishlists, error: queryError } = await supabase
    .from('user_wishlists')
    .select('*');

  if (queryError) {
    console.error('Query error:', queryError);
  } else {
    console.log('Total wishlists found:', allWishlists?.length || 0);
    if (allWishlists && allWishlists.length > 0) {
      console.log('Wishlists:', JSON.stringify(allWishlists, null, 2));
    }
  }

  console.log('\n=== END TEST ===\n');
}

testWishlistInsert().catch(console.error);
