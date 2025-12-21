// Check wishlist matching for the apple sale
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMatching() {
  const saleId = 'e1ed3398-f6f1-4d5c-a4ec-50fd74f307e5';

  console.log('🔍 Checking wishlist matching for apple sale...\n');

  // 1. Check if user_wishlists table exists and has data
  console.log('1️⃣ Checking user_wishlists table...');
  const { data: wishlists, error: wishlistError } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('is_active', true);

  if (wishlistError) {
    console.log('❌ Error accessing user_wishlists table:', wishlistError.message);
    console.log('   This might mean the migration hasn\'t been run yet!\n');
  } else {
    console.log(`✅ Found ${wishlists.length} active wishlist items:`);
    wishlists.forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item.item_name}" (user: ${item.user_id.substring(0, 8)}...)`);
      if (item.description) console.log(`      Description: ${item.description}`);
    });
    console.log('');

    // Check if any contain "apple"
    const appleWishlists = wishlists.filter(w =>
      (w.item_name + ' ' + (w.description || '')).toLowerCase().includes('apple')
    );
    if (appleWishlists.length > 0) {
      console.log(`   🍎 Found ${appleWishlists.length} wishlist(s) mentioning "apple"`);
    }
    console.log('');
  }

  // 2. Check if wishlist_matches table exists
  console.log('2️⃣ Checking wishlist_matches table...');
  const { data: matches, error: matchError } = await supabase
    .from('wishlist_matches')
    .select('*')
    .eq('garage_sale_id', saleId);

  if (matchError) {
    console.log('❌ Error accessing wishlist_matches table:', matchError.message);
    console.log('   This means the migration hasn\'t been run yet!\n');
  } else {
    console.log(`✅ Found ${matches.length} matches for this sale`);
    if (matches.length > 0) {
      matches.forEach((match, idx) => {
        console.log(`   ${idx + 1}. Match confidence: ${match.match_confidence}`);
        console.log(`      Reason: ${match.match_reason}`);
        console.log(`      Notification sent: ${match.notification_sent}`);
      });
    } else {
      console.log('   ⚠️  No matches found - the matching logic might not have run');
    }
    console.log('');
  }

  // 3. Check the sale details
  console.log('3️⃣ Sale details:');
  const { data: sale } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('id', saleId)
    .single();

  console.log(`   Title: "${sale.title}"`);
  console.log(`   Description: "${sale.description}"`);
  console.log(`   Created: ${sale.created_at}`);
  console.log('');

  // 4. Summary
  console.log('📊 DIAGNOSIS:');
  if (wishlistError) {
    console.log('❌ The wishlist tables don\'t exist yet!');
    console.log('   You need to run the migration: supabase/migrations/004_add_wishlist_support.sql');
  } else if (wishlists.length === 0) {
    console.log('⚠️  No wishlist items have been added yet');
  } else if (matches.length === 0) {
    console.log('⚠️  Matching logic did not run or did not find matches');
    console.log('   Possible reasons:');
    console.log('   - The checkNewSaleAgainstWishlists() function had an error');
    console.log('   - The keyword matching failed');
    console.log('   - The matching ran but no matches were found');
  } else {
    console.log('✅ Matching system is working!');
  }
}

checkMatching().catch(console.error);
