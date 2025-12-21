const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testNotificationFlow() {
  console.log('\n=== TEST NOTIFICATION FLOW ===\n');

  // Check all matches and their notification status
  console.log('Checking all wishlist matches...\n');

  const { data: matches, error } = await supabase
    .from('wishlist_matches')
    .select(`
      *,
      user_wishlists (item_name),
      garage_sales (title)
    `)
    .order('matched_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!matches || matches.length === 0) {
    console.log('❌ No matches found in database');
    return;
  }

  console.log(`Found ${matches.length} recent matches:\n`);

  matches.forEach((match, idx) => {
    console.log(`${idx + 1}. Match ID: ${match.id}`);
    console.log(`   Wishlist: "${match.user_wishlists.item_name}"`);
    console.log(`   Sale: "${match.garage_sales.title}"`);
    console.log(`   Matched at: ${match.matched_at}`);
    console.log(`   Notification sent: ${match.notification_sent ? '✅ YES' : '❌ NO'}`);
    if (match.notification_sent) {
      console.log(`   Sent at: ${match.notification_sent_at}`);
    }
    console.log('');
  });

  const notSent = matches.filter(m => !m.notification_sent);
  const sent = matches.filter(m => m.notification_sent);

  console.log(`Summary:`);
  console.log(`  Notifications sent: ${sent.length}`);
  console.log(`  Notifications NOT sent: ${notSent.length}`);

  if (notSent.length > 0) {
    console.log(`\n⚠️  WARNING: ${notSent.length} matches have NOT had notifications sent!`);
    console.log(`This means the notification code is NOT being triggered.`);
  }

  console.log('\n=== END TEST ===\n');
}

testNotificationFlow().catch(console.error);
