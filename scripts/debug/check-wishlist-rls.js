const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1OTc1ODgsImV4cCI6MjA0OTE3MzU4OH0.tNw0G_sk_L5QvVyhFUfSQJ4I4OJuUwIcl3F8nEh3XDo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('🔍 Testing wishlist INSERT permissions...\n');

  const testUserId = 'ee26ee35-b35c-4376-9b7c-eba6264ba3bd';

  // Try to insert a test wishlist item
  console.log('Attempting to insert wishlist item...');
  const { data, error } = await supabase
    .from('user_wishlists')
    .insert([{
      user_id: testUserId,
      item_name: 'TEST ITEM - DELETE ME',
      description: 'This is a test',
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ INSERT FAILED:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
  } else {
    console.log('✅ INSERT SUCCEEDED!');
    console.log('Inserted item:', data);
    
    // Clean up
    const { error: deleteError } = await supabase
      .from('user_wishlists')
      .delete()
      .eq('id', data.id);
    
    if (!deleteError) {
      console.log('✅ Test item cleaned up');
    }
  }
}

checkRLS().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
