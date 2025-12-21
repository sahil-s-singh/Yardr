// Monitor wishlist activity in real-time
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let lastWishlistCount = 0;
let lastMatchCount = 0;

async function checkActivity() {
  // Check wishlists
  const { data: wishlists } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('is_active', true);

  const wishlistCount = wishlists?.length || 0;

  // Check matches for the apple sale
  const { data: matches } = await supabase
    .from('wishlist_matches')
    .select('*')
    .eq('garage_sale_id', 'e1ed3398-f6f1-4d5c-a4ec-50fd74f307e5');

  const matchCount = matches?.length || 0;

  const timestamp = new Date().toLocaleTimeString();

  // Only log if something changed
  if (wishlistCount !== lastWishlistCount || matchCount !== lastMatchCount) {
    console.log(`\n[${timestamp}] 🔄 CHANGE DETECTED!`);
    console.log('='.repeat(60));

    if (wishlistCount > lastWishlistCount) {
      console.log(`\n✅ NEW WISHLIST ITEM ADDED!`);
      const newItem = wishlists[wishlists.length - 1];
      console.log(`   Item: "${newItem.item_name}"`);
      console.log(`   Description: "${newItem.description || 'none'}"`);
      console.log(`   User: ${newItem.user_id}`);
      console.log(`   Created: ${newItem.created_at}`);
    }

    if (matchCount > lastMatchCount) {
      console.log(`\n🎯 NEW MATCH CREATED!`);
      const newMatch = matches[matches.length - 1];
      console.log(`   Match ID: ${newMatch.id}`);
      console.log(`   Confidence: ${newMatch.match_confidence}`);
      console.log(`   Reason: ${newMatch.match_reason}`);
      console.log(`   Notification sent: ${newMatch.notification_sent ? '✅ Yes' : '⏳ Pending'}`);
      if (newMatch.notification_sent_at) {
        console.log(`   Sent at: ${newMatch.notification_sent_at}`);
      }
      console.log(`\n   📬 User should have received notification:`);
      console.log(`   "Found: [item]! 🎉"`);
      console.log(`   "Colorful Fruit Harvest may have what you're looking for!"`);
    }

    lastWishlistCount = wishlistCount;
    lastMatchCount = matchCount;

    console.log(`\n📊 Current Status:`);
    console.log(`   Active wishlist items: ${wishlistCount}`);
    console.log(`   Matches for apple sale: ${matchCount}`);
  } else {
    // Just show a heartbeat
    process.stdout.write(`\r[${timestamp}] 👀 Watching... (Wishlists: ${wishlistCount}, Matches: ${matchCount})`);
  }
}

console.log('🔍 WISHLIST ACTIVITY MONITOR');
console.log('='.repeat(60));
console.log('Watching for new wishlist items and matches...');
console.log('Press Ctrl+C to stop\n');

// Initial check
checkActivity();

// Check every 2 seconds
setInterval(checkActivity, 2000);
