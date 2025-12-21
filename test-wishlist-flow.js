// Test the complete wishlist matching and notification flow
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simulate the keyword matching algorithm
function extractKeywords(text) {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'set', 'item', 'items', 'sale', 'garage', 'various', 'misc', 'etc',
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/g, ''))
    .filter(word => word.length > 2 && !commonWords.has(word));
}

function simulateMatching(wishlistItem, garageSale) {
  const saleText = `${garageSale.title} ${garageSale.description}`.toLowerCase();
  const wishlistText = `${wishlistItem.item_name} ${wishlistItem.description || ''}`.toLowerCase();

  const keywords = extractKeywords(wishlistText);

  console.log(`\n🔍 Matching "${wishlistItem.item_name}" against "${garageSale.title}"`);
  console.log(`   Wishlist keywords: [${keywords.join(', ')}]`);
  console.log(`   Sale text: "${saleText}"`);

  // Phase 1: Direct keyword matching
  const exactMatches = keywords.filter(keyword =>
    saleText.includes(keyword) && keyword.length > 2
  );

  console.log(`   Exact matches: [${exactMatches.join(', ')}]`);

  if (exactMatches.length >= 2 || exactMatches.some(k => k.length > 6)) {
    return {
      isMatch: true,
      confidence: 'high',
      reason: `Keyword match: ${exactMatches.join(', ')}`,
    };
  }

  // Phase 2: Category matching
  if (wishlistItem.category && garageSale.categories?.includes(wishlistItem.category)) {
    if (exactMatches.length >= 1) {
      return {
        isMatch: true,
        confidence: 'medium',
        reason: `Category match: ${wishlistItem.category}, partial keyword: ${exactMatches[0]}`,
      };
    }
  }

  // Phase 3: Single keyword match
  if (exactMatches.length === 1) {
    return {
      isMatch: true,
      confidence: 'medium',
      reason: `Single keyword match: ${exactMatches[0]} (would call AI to verify)`,
    };
  }

  return {
    isMatch: false,
    confidence: 'low',
    reason: 'No match',
  };
}

async function testWishlistFlow() {
  console.log('🧪 TESTING WISHLIST MATCHING FLOW\n');
  console.log('='.repeat(60));

  // Get the apple sale
  const saleId = 'e1ed3398-f6f1-4d5c-a4ec-50fd74f307e5';
  const { data: sale } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('id', saleId)
    .single();

  console.log(`\n📦 Target Sale:`);
  console.log(`   Title: "${sale.title}"`);
  console.log(`   Description: "${sale.description}"`);
  console.log(`   Categories: [${sale.categories?.join(', ') || 'none'}]`);

  // Test different wishlist scenarios
  const testWishlists = [
    {
      item_name: 'apples',
      description: null,
      category: null,
    },
    {
      item_name: 'fruit',
      description: 'looking for fresh fruits',
      category: 'kitchen',
    },
    {
      item_name: 'wine glass set',
      description: 'preferably crystal',
      category: null,
    },
    {
      item_name: 'oranges lemons',
      description: 'citrus fruits',
      category: null,
    },
    {
      item_name: 'furniture',
      description: 'couch or table',
      category: 'furniture',
    },
  ];

  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 TEST SCENARIOS:');
  console.log('='.repeat(60));

  testWishlists.forEach((wishlist, idx) => {
    const result = simulateMatching(wishlist, sale);

    console.log(`\n${idx + 1}. Wishlist Item: "${wishlist.item_name}"`);
    if (wishlist.description) console.log(`   Description: "${wishlist.description}"`);
    if (wishlist.category) console.log(`   Category: "${wishlist.category}"`);

    console.log(`   \n   ${result.isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    console.log(`   Confidence: ${result.confidence.toUpperCase()}`);
    console.log(`   Reason: ${result.reason}`);

    if (result.isMatch) {
      console.log(`   \n   📬 Would send notification:`);
      console.log(`   "Found: ${wishlist.item_name}! 🎉"`);
      console.log(`   "${sale.title}" may have what you're looking for!`);
    }
  });

  // Check actual database state
  console.log(`\n${'='.repeat(60)}`);
  console.log('💾 CURRENT DATABASE STATE:');
  console.log('='.repeat(60));

  const { data: actualWishlists } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('is_active', true);

  console.log(`\n📝 Active wishlist items in DB: ${actualWishlists?.length || 0}`);

  if (actualWishlists && actualWishlists.length > 0) {
    actualWishlists.forEach((item, idx) => {
      console.log(`\n${idx + 1}. "${item.item_name}"`);
      console.log(`   User: ${item.user_id}`);
      console.log(`   Created: ${item.created_at}`);

      // Test this actual wishlist item
      const result = simulateMatching(item, sale);
      console.log(`   Match result: ${result.isMatch ? '✅ MATCH' : '❌ NO MATCH'} (${result.confidence})`);
    });

    // Check for existing matches
    const { data: matches } = await supabase
      .from('wishlist_matches')
      .select('*')
      .eq('garage_sale_id', saleId);

    console.log(`\n🔗 Existing matches in DB: ${matches?.length || 0}`);
    if (matches && matches.length > 0) {
      matches.forEach((match, idx) => {
        console.log(`\n${idx + 1}. Match ID: ${match.id}`);
        console.log(`   Confidence: ${match.match_confidence}`);
        console.log(`   Reason: ${match.match_reason}`);
        console.log(`   Notification sent: ${match.notification_sent ? '✅ Yes' : '❌ No'}`);
      });
    }
  } else {
    console.log('\n⚠️  No wishlist items found!');
    console.log('   To test the feature:');
    console.log('   1. Sign in to the app');
    console.log('   2. Go to Profile → My Wishlist');
    console.log('   3. Add a wishlist item like "apples" or "fruit"');
    console.log('   4. The system will automatically match against the apple sale');
    console.log('   5. You should receive a notification!');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 NEXT STEPS:');
  console.log('='.repeat(60));
  console.log('\nTo verify the notification system works:');
  console.log('1. Open the app and sign in');
  console.log('2. Navigate to Profile → My Wishlist');
  console.log('3. Tap "+ Add Item"');
  console.log('4. Type "apples" or "fruit"');
  console.log('5. Tap "Add to Wishlist"');
  console.log('\n💡 Expected behavior:');
  console.log('   - Match will be created immediately');
  console.log('   - Notification will be sent to your device');
  console.log('   - You can view matches by tapping "View Matches"');
  console.log('');
}

testWishlistFlow().catch(console.error);
