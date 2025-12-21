const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simulate the checkNewSaleAgainstWishlists function
async function checkNewSaleAgainstWishlists(garageSaleId) {
  console.log('\n=== SIMULATING checkNewSaleAgainstWishlists ===\n');
  console.log('Sale ID:', garageSaleId);

  try {
    // Step 1: Get the garage sale
    console.log('\n1. Getting garage sale...');
    const { data: garageSale, error: saleError } = await supabase
      .from('garage_sales')
      .select('*')
      .eq('id', garageSaleId)
      .single();

    if (saleError || !garageSale) {
      console.error('❌ Failed to get sale:', saleError);
      return;
    }
    console.log(`✅ Got sale: "${garageSale.title}" - "${garageSale.description}"`);

    // Step 2: Get all active wishlist items
    console.log('\n2. Getting all active wishlists...');
    const { data: wishlists, error: wishlistError } = await supabase
      .from('user_wishlists')
      .select('*')
      .eq('is_active', true);

    if (wishlistError) {
      console.error('❌ Failed to get wishlists:', wishlistError);
      return;
    }
    console.log(`✅ Got ${wishlists?.length || 0} active wishlists`);

    if (!wishlists || wishlists.length === 0) {
      console.log('No wishlists to check');
      return;
    }

    // Step 3: Check each wishlist item
    console.log('\n3. Checking for matches...\n');
    let matchCount = 0;
    const saleText = `${garageSale.title} ${garageSale.description}`.toLowerCase();

    for (const wishlistItem of wishlists) {
      const itemName = wishlistItem.item_name.toLowerCase();

      if (saleText.includes(itemName)) {
        matchCount++;
        console.log(`✅ MATCH #${matchCount}:`);
        console.log(`   Wishlist: "${wishlistItem.item_name}" (user: ${wishlistItem.user_id.substring(0, 8)}...)`);
        console.log(`   Sale: "${garageSale.title}"`);

        // Try to create match record
        console.log(`   Creating match record...`);
        const { data: matchData, error: matchError } = await supabase
          .from('wishlist_matches')
          .insert([{
            user_id: wishlistItem.user_id,
            wishlist_item_id: wishlistItem.id,
            garage_sale_id: garageSaleId,
            match_confidence: 'high',
            match_reason: `Sale contains "${wishlistItem.item_name}"`,
          }])
          .select()
          .single();

        if (matchError) {
          console.log(`   ❌ FAILED:`, matchError.message);
          console.log(`   Code:`, matchError.code);
        } else {
          console.log(`   ✅ SUCCESS! Match ID: ${matchData.id}`);
        }
        console.log('');
      }
    }

    console.log(`\nTotal matches found: ${matchCount}`);

  } catch (error) {
    console.error('Error in checkNewSaleAgainstWishlists:', error);
  }

  console.log('\n=== END SIMULATION ===\n');
}

// Test with the most recent "Banana sale 2"
const testSaleId = '8e769099-6e5e-4e30-840f-fb8d1fa597f1';

checkNewSaleAgainstWishlists(testSaleId).catch(console.error);
