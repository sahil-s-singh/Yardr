// Test singular vs plural matching
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function testSingularPlural() {
  console.log('🧪 TESTING SINGULAR vs PLURAL MATCHING\n');
  console.log('='.repeat(60));

  // Get the sale
  const { data: sale } = await supabase
    .from('garage_sales')
    .select('*')
    .eq('id', 'e1ed3398-f6f1-4d5c-a4ec-50fd74f307e5')
    .single();

  const saleText = `${sale.title} ${sale.description}`.toLowerCase();
  console.log(`\n📦 Sale: "${sale.title}"`);
  console.log(`   Description: "${sale.description}"`);
  console.log(`   Full text: "${saleText}"`);

  // Test cases
  const testCases = [
    { wishlist: 'apple', expectMatch: true },
    { wishlist: 'apples', expectMatch: true },
    { wishlist: 'orange', expectMatch: true },
    { wishlist: 'oranges', expectMatch: true },
  ];

  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST RESULTS:');
  console.log('='.repeat(60));

  testCases.forEach(({ wishlist, expectMatch }) => {
    const keywords = extractKeywords(wishlist);
    const exactMatches = keywords.filter(keyword =>
      saleText.includes(keyword) && keyword.length > 2
    );

    const isMatch = exactMatches.length > 0;

    console.log(`\n🔍 Wishlist: "${wishlist}"`);
    console.log(`   Keywords extracted: [${keywords.join(', ')}]`);
    console.log(`   Checking if "${saleText}" contains "${keywords[0]}"`);
    console.log(`   Result: ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);

    if (expectMatch !== isMatch) {
      console.log(`   ⚠️  PROBLEM: Expected ${expectMatch ? 'MATCH' : 'NO MATCH'} but got ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    }

    if (isMatch) {
      console.log(`   Matched keywords: [${exactMatches.join(', ')}]`);
    }
  });

  // Check actual wishlist items
  console.log(`\n${'='.repeat(60)}`);
  console.log('ACTUAL WISHLIST ITEMS IN DATABASE:');
  console.log('='.repeat(60));

  const { data: wishlists } = await supabase
    .from('user_wishlists')
    .select('*')
    .eq('is_active', true);

  if (wishlists && wishlists.length > 0) {
    wishlists.forEach((item, idx) => {
      const keywords = extractKeywords(`${item.item_name} ${item.description || ''}`);
      const exactMatches = keywords.filter(keyword =>
        saleText.includes(keyword) && keyword.length > 2
      );

      console.log(`\n${idx + 1}. "${item.item_name}"`);
      console.log(`   Keywords: [${keywords.join(', ')}]`);
      console.log(`   Match against sale: ${exactMatches.length > 0 ? '✅ YES' : '❌ NO'}`);
      if (exactMatches.length > 0) {
        console.log(`   Matched keywords: [${exactMatches.join(', ')}]`);
      }
    });
  } else {
    console.log('\n❌ No wishlist items found');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('DIAGNOSIS:');
  console.log('='.repeat(60));
  console.log('\n⚠️  ISSUE IDENTIFIED:');
  console.log('   The current algorithm uses .includes() which checks if the');
  console.log('   keyword is ANYWHERE in the text.');
  console.log('');
  console.log('   ✅ "apple" will match "apples" (apple is IN apples)');
  console.log('   ❌ "apples" will NOT match "apple" (apples is NOT IN apple)');
  console.log('');
  console.log('   Sale has: "apples, oranges, pears, plums, lemons"');
  console.log('   If you added: "apple" → ✅ WILL MATCH');
  console.log('   If you added: "apples" → ✅ WILL MATCH');
  console.log('');
}

testSingularPlural().catch(console.error);
