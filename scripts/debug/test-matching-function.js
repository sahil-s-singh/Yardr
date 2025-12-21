const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMatchingFunction() {
  console.log('\n=== TESTING MATCHING FUNCTION ===\n');

  const saleId = '35ad20a3-b925-48e7-a22d-92a1464f8b63'; // Sale "Tr" with "Grape"

  console.log('Simulating checkNewSaleAgainstWishlists for sale:', saleId);

  // Step 1: Get the garage sale
  console.log('\n1. Getting garage sale...');
  const { data: garageSale, error: saleError } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('id', saleId)
    .single();

  if (saleError) {
    console.error('❌ Error getting sale:', saleError);
    return;
  }
  console.log('✅ Got sale:', garageSale.title);
  console.log('   Description:', garageSale.description);

  // Step 2: Get all active wishlist items (this is where it fails)
  console.log('\n2. Getting all active wishlists...');
  const { data: wishlists, error: wishlistError } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('is_active', true);

  if (wishlistError) {
    console.error('❌ Error getting wishlists:', wishlistError);
    console.error('   Code:', wishlistError.code);
    console.error('   Message:', wishlistError.message);
  } else {
    console.log(`✅ Got ${wishlists?.length || 0} active wishlists`);
    if (wishlists && wishlists.length > 0) {
      wishlists.forEach(w => {
        console.log(`   - ${w.item_name} (user: ${w.user_id})`);
      });
    }
  }

  // Step 3: Try simple text matching
  if (wishlists && wishlists.length > 0) {
    console.log('\n3. Checking for matches...');
    const saleDesc = garageSale.description.toLowerCase();

    wishlists.forEach(wishlist => {
      const itemName = wishlist.item_name.toLowerCase();
      if (saleDesc.includes(itemName) || itemName.includes(saleDesc)) {
        console.log(`✅ MATCH FOUND: Wishlist "${wishlist.item_name}" matches sale "${garageSale.title}"`);
      }
    });
  }

  console.log('\n=== END TEST ===\n');
}

testMatchingFunction().catch(console.error);
