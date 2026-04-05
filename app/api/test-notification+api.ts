import { supabase } from '@/lib/supabase';

/**
 * API endpoint to send test push notifications (dev only)
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
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return new Response(
      JSON.stringify({ error: 'Not available in production' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify the request comes from an authenticated user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // Users can only send test notifications to themselves
    if (!userId || userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only send test notifications to yourself' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let token = pushToken;

    // If no token provided, fetch from database
    if (!token) {
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
