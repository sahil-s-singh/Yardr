const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllWishlists() {
  console.log('\n=== CHECKING ALL WISHLISTS ===\n');

  // Try to get ALL wishlists without any filters
  console.log('Querying all wishlists (no filters)...');
  const { data: allWishlists, error: allError } = await supabase
    .from('user_wishlists')
    .select('*');

  if (allError) {
    console.error('❌ Error querying wishlists:');
    console.error('Error:', allError);
    console.error('Code:', allError.code);
    console.error('Message:', allError.message);
  } else {
    console.log(`✅ Found ${allWishlists?.length || 0} total wishlists`);
    if (allWishlists && allWishlists.length > 0) {
      console.log('\nWishlist items:');
      allWishlists.forEach((item, idx) => {
        console.log(`\n${idx + 1}. ${item.item_name}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   User ID: ${item.user_id}`);
        console.log(`   Description: ${item.description}`);
        console.log(`   Active: ${item.is_active}`);
        console.log(`   Created: ${item.created_at}`);
      });
    }
  }

  // Try to get the specific wishlist by ID
  console.log('\n\nQuerying specific wishlist by ID...');
  const wishlistId = '39d36ce9-e42f-450e-88df-f1184ddcc6a2';
  const { data: specificWishlist, error: specificError } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('id', wishlistId)
    .single();

  if (specificError) {
    console.error('❌ Error querying specific wishlist:');
    console.error('Error:', specificError);
  } else {
    console.log('✅ Found wishlist:', specificWishlist);
  }

  console.log('\n=== END CHECK ===\n');
}

checkAllWishlists().catch(console.error);
