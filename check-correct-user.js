const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCorrectUser() {
  console.log('\n=== CHECKING CORRECT USER ===\n');

  const correctUserId = 'e65ae9c5-303f-4d61-88d3-da54f26f52ef';
  const wishlistItemId = '39d36ce9-e42f-450e-88df-f1184ddcc6a2';

  // 1. Get wishlist items for correct user
  console.log('1. Wishlist items for user:', correctUserId);
  const { data: wishlists, error: wishlistError } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('user_id', correctUserId);

  if (wishlistError) {
    console.error('Error:', wishlistError);
  } else {
    console.log(`Found ${wishlists?.length || 0} wishlist items:`);
    if (wishlists) {
      wishlists.forEach(item => {
        console.log(`  - ${item.item_name} (${item.id})`);
      });
    }
  }

  // 2. Get all active sales with "grape"
  console.log('\n2. Active sales containing "grape":');
  const { data: sales, error: salesError } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('is_active', true)
    .ilike('description', '%grape%');

  if (salesError) {
    console.error('Error:', salesError);
  } else {
    console.log(`Found ${sales?.length || 0} sales with "grape":`);
    if (sales) {
      sales.forEach(sale => {
        console.log(`  - "${sale.title}" (${sale.id})`);
        console.log(`    Description: ${sale.description}`);
        console.log(`    Created: ${sale.created_at}`);
      });
    }
  }

  // 3. Check for matches
  console.log('\n3. Matches for wishlist item:', wishlistItemId);
  const { data: matches, error: matchError } = await supabase
    .from('wishlist_matches')
    .select('*')
    .eq('wishlist_item_id', wishlistItemId);

  if (matchError) {
    console.error('Error:', matchError);
  } else {
    console.log(`Found ${matches?.length || 0} matches`);
    if (matches && matches.length > 0) {
      console.log('Matches:', JSON.stringify(matches, null, 2));
    }
  }

  // 4. Check all matches for user
  console.log('\n4. All matches for user:', correctUserId);
  const { data: allMatches, error: allMatchError } = await supabase
    .from('wishlist_matches')
    .select('*')
    .eq('user_id', correctUserId);

  if (allMatchError) {
    console.error('Error:', allMatchError);
  } else {
    console.log(`Found ${allMatches?.length || 0} total matches for user`);
    if (allMatches && allMatches.length > 0) {
      console.log('All matches:', JSON.stringify(allMatches, null, 2));
    }
  }

  console.log('\n=== END CHECK ===\n');
}

checkCorrectUser().catch(console.error);
