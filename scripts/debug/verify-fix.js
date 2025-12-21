const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyFix() {
  console.log('\n=== VERIFY RLS POLICY FIX ===\n');

  console.log('After applying the SQL fix, this script should be able to:');
  console.log('1. Read all wishlists');
  console.log('2. Find the "Grape" wishlist');
  console.log('3. Match it against sales with "grape" in description\n');

  // Test: Get all wishlists
  console.log('Testing: Get all active wishlists...');
  const { data: wishlists, error: wishlistError } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('is_active', true);

  if (wishlistError) {
    console.error('❌ FAILED - Still cannot read wishlists');
    console.error('Error:', wishlistError);
    console.log('\n⚠️  RLS policy fix has NOT been applied yet!');
    console.log('Please run the SQL in fix-wishlist-select-policy.sql in Supabase SQL editor\n');
    return;
  }

  console.log(`✅ SUCCESS - Can now read ${wishlists?.length || 0} wishlists`);

  if (wishlists && wishlists.length > 0) {
    console.log('\nWishlists found:');
    wishlists.forEach((item, idx) => {
      console.log(`  ${idx + 1}. "${item.item_name}" (user: ${item.user_id.substring(0, 8)}...)`);
    });

    // Test matching
    console.log('\n\nTesting: Find sales with "grape"...');
    const { data: sales, error: salesError } = await supabase
      .from('garage_sales')
      .select('*')
      .eq('is_active', true);

    if (!salesError && sales) {
      console.log(`Found ${sales.length} active sales`);

      // Check for matches
      console.log('\nChecking for matches...');
      let matchCount = 0;

      for (const sale of sales) {
        const saleDesc = sale.description.toLowerCase();

        for (const wishlist of wishlists) {
          const itemName = wishlist.item_name.toLowerCase();

          if (saleDesc.includes(itemName) || itemName.includes(saleDesc)) {
            matchCount++;
            console.log(`\n  ✅ MATCH #${matchCount}:`);
            console.log(`     Wishlist: "${wishlist.item_name}"`);
            console.log(`     Sale: "${sale.title}" - "${sale.description}"`);
            console.log(`     Sale ID: ${sale.id}`);
            console.log(`     Wishlist ID: ${wishlist.id}`);
          }
        }
      }

      if (matchCount === 0) {
        console.log('  No matches found (this is unexpected!)');
      } else {
        console.log(`\n✅ Found ${matchCount} match(es)!`);
        console.log('\nNow the automatic matching system should work correctly.');
        console.log('Next step: Manually trigger matching OR create a new sale to test.');
      }
    }
  } else {
    console.log('\n⚠️  No wishlists found in database');
    console.log('This might be because:');
    console.log('  1. All wishlists were deleted');
    console.log('  2. The wishlist is set to is_active = false');
  }

  console.log('\n=== END VERIFY ===\n');
}

verifyFix().catch(console.error);
