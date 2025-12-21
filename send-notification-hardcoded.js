// Hardcoded push token for testing
// Replace this with your actual token from the app console logs
const HARDCODED_PUSH_TOKEN = 'ExponentPushToken[REPLACE_WITH_YOUR_TOKEN]';

async function sendNotification(title, body) {
  console.log('\n=== SENDING NOTIFICATION ===\n');
  console.log('To:', HARDCODED_PUSH_TOKEN.substring(0, 30) + '...');
  console.log('Title:', title);
  console.log('Body:', body);

  try {
    const message = {
      to: HARDCODED_PUSH_TOKEN,
      sound: 'default',
      title: title || 'Test Notification 🔔',
      body: body || 'This is a test notification from Yardr!',
      data: {
        type: 'test',
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
  console.log('Usage: node send-notification-hardcoded.js [title] [body]');
  console.log('\nExample:');
  console.log('  node send-notification-hardcoded.js "Hello!" "This is a test"');
  console.log('\nIMPORTANT: Edit this file and replace HARDCODED_PUSH_TOKEN with your actual token first!');
  process.exit(1);
}

const title = args[0];
const body = args[1];

sendNotification(title, body).catch(console.error);
