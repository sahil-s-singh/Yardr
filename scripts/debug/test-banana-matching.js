const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple keyword matching function
function matchWishlistAgainstSale(wishlistItem, garageSale) {
  const saleText = `${garageSale.title} ${garageSale.description}`.toLowerCase();
  const wishlistText = `${wishlistItem.item_name} ${wishlistItem.description || ''}`.toLowerCase();

  // Simple check: does sale contain wishlist item name?
  if (saleText.includes(wishlistItem.item_name.toLowerCase())) {
    return {
      isMatch: true,
      confidence: 'high',
      reason: `Sale contains "${wishlistItem.item_name}"`,
    };
  }

  return {
    isMatch: false,
    confidence: 'low',
    reason: 'No match',
  };
}

async function testBananaMatching() {
  console.log('\n=== TEST BANANA MATCHING ===\n');

  // Get Banana wishlist
  const { data: wishlists, error: wishlistError } = await supabase
    .from('user_wishlists')
    .select('*')
    .ilike('item_name', '%banana%');

  if (wishlistError || !wishlists || wishlists.length === 0) {
    console.error('❌ Cannot find Banana wishlist');
    return;
  }

  const bananaWishlist = wishlists[0];
  console.log('Found wishlist:', bananaWishlist.item_name);
  console.log('User ID:', bananaWishlist.user_id);
  console.log('Wishlist ID:', bananaWishlist.id);

  // Get all active sales
  const { data: sales, error: salesError } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('is_active', true);

  if (salesError || !sales) {
    console.error('❌ Cannot get sales');
    return;
  }

  console.log(`\nFound ${sales.length} active sales`);
  console.log('\nChecking for matches...\n');

  let matchCount = 0;
  for (const sale of sales) {
    const matchResult = matchWishlistAgainstSale(bananaWishlist, sale);

    if (matchResult.isMatch) {
      matchCount++;
      console.log(`✅ MATCH #${matchCount}:`);
      console.log(`   Sale: "${sale.title}" - "${sale.description}"`);
      console.log(`   Sale ID: ${sale.id}`);
      console.log(`   Reason: ${matchResult.reason}`);
      console.log(`   Created: ${sale.created_at}`);

      // Try to create match record
      console.log(`   Attempting to create match record...`);
      const { data: matchData, error: matchError } = await supabase
        .from('wishlist_matches')
        .insert([{
          user_id: bananaWishlist.user_id,
          wishlist_item_id: bananaWishlist.id,
          garage_sale_id: sale.id,
          match_confidence: matchResult.confidence,
          match_reason: matchResult.reason,
        }])
        .select()
        .single();

      if (matchError) {
        console.log(`   ❌ Failed to create match:`, matchError.message);
        console.log(`   Error code:`, matchError.code);
      } else {
        console.log(`   ✅ Match record created! ID: ${matchData.id}`);
      }
      console.log('');
    }
  }

  if (matchCount === 0) {
    console.log('No matches found for Banana wishlist');
  } else {
    console.log(`\n✅ Found ${matchCount} total matches`);
  }

  // Check how many matches exist in database
  console.log('\nChecking matches in database...');
  const { data: dbMatches, error: dbMatchError } = await supabase
    .from('wishlist_matches')
    .select('*')
    .eq('wishlist_item_id', bananaWishlist.id);

  if (dbMatchError) {
    console.error('Error:', dbMatchError);
  } else {
    console.log(`Database has ${dbMatches?.length || 0} matches for Banana wishlist`);
  }

  console.log('\n=== END TEST ===\n');
}

testBananaMatching().catch(console.error);
