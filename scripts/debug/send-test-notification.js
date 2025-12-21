const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkqmaupmuhxavkfyjbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sendTestNotification(userId, title, body) {
  console.log('\n=== SENDING TEST NOTIFICATION ===\n');
  console.log('User ID:', userId);

  try {
    // Step 1: Get user's push token from database
    console.log('\n1. Getting push token from database...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('expo_push_token')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    if (!profile?.expo_push_token) {
      console.error('❌ No push token found for this user!');
      console.log('\nTo fix this:');
      console.log('1. Open the app');
      console.log('2. Go to /test-notification screen');
      console.log('3. Click "Request Notification Permissions"');
      console.log('4. Click "Save Push Token to Database"');
      return;
    }

    const pushToken = profile.expo_push_token;
    console.log('✅ Found push token:', pushToken.substring(0, 30) + '...');

    // Step 2: Send push notification via Expo Push API
    console.log('\n2. Sending push notification...');

    const message = {
      to: pushToken,
      sound: 'default',
      title: title || 'Test Notification 🔔',
      body: body || 'This is a test notification from Yardr!',
      data: {
        type: 'test',
        userId: userId,
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to send notification');
      console.error('Response:', result);
      return;
    }

    console.log('✅ Notification sent successfully!');
    console.log('Response:', JSON.stringify(result, null, 2));

    // Check if there were any errors in the response
    if (result.data && result.data[0]) {
      const ticket = result.data[0];
      if (ticket.status === 'error') {
        console.error('\n⚠️  Expo returned an error:', ticket.message);
        console.error('Details:', ticket.details);
      } else if (ticket.status === 'ok') {
        console.log('\n✅ Notification queued successfully!');
        console.log('Ticket ID:', ticket.id);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }

  console.log('\n=== END ===\n');
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node send-test-notification.js <userId> [title] [body]');
  console.log('\nExample:');
  console.log('  node send-test-notification.js e65ae9c5-303f-4d61-88d3-da54f26f52ef');
  console.log('  node send-test-notification.js e65ae9c5-303f-4d61-88d3-da54f26f52ef "Hello!" "This is a test"');
  process.exit(1);
}

const userId = args[0];
const title = args[1];
const body = args[2];

sendTestNotification(userId, title, body).catch(console.error);
