/**
 * API endpoint to send test push notifications
 *
 * POST /api/test-notification
 * Body: {
 *   userId: string,
 *   pushToken: string (optional - will fetch from DB if not provided),
 *   title?: string,
 *   body?: string
 * }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { userId, pushToken, title, body: notificationBody } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let token = pushToken;

    // If no token provided, fetch from database
    if (!token) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://gfkqmaupmuhxavkfyjbb.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma3FtYXVwbXVoeGF2a2Z5amJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTA5ODksImV4cCI6MjA4MDg4Njk4OX0.f_4aHwLdkZdaFoJwZO34TEWh664FpcmaDV1RkM-Vkuk'
      );

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('expo_push_token')
        .eq('id', userId)
        .single();

      if (error || !profile?.expo_push_token) {
        return new Response(
          JSON.stringify({ error: 'No push token found for user. Please save push token first.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      token = profile.expo_push_token;
    }

    // Send push notification using Expo Push API
    const message = {
      to: token,
      sound: 'default',
      title: title || 'Test Notification 🔔',
      body: notificationBody || 'This is a test notification from Yardr API!',
      data: {
        type: 'test',
        userId,
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
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        pushToken: token,
        result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in test-notification API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
