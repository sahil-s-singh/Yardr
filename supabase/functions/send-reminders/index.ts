import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Find all unsent reminders that are due (reminder_time <= now)
    const { data: dueReminders, error: fetchError } = await supabase
      .from("user_reminders")
      .select(`
        *,
        garage_sales (id, title)
      `)
      .eq("notification_sent", false)
      .lte("reminder_time", new Date().toISOString())
      .not("expo_push_token", "is", null);

    if (fetchError) {
      console.error("Error fetching due reminders:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch reminders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No reminders due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of dueReminders) {
      const saleTitle = reminder.garage_sales?.title || "a garage sale";
      const message = {
        to: reminder.expo_push_token,
        sound: "default",
        title: "Garage Sale Reminder",
        body: `${saleTitle} is happening soon!`,
        data: {
          type: "reminder",
          garageSaleId: reminder.garage_sale_id,
        },
      };

      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        const result = await response.json();

        // Check for invalid token
        if (result?.data?.status === "error") {
          const detail = result.data.details?.error;
          if (detail === "DeviceNotRegistered" || detail === "InvalidCredentials") {
            // Clear invalid token
            await supabase
              .from("user_profiles")
              .update({ expo_push_token: null })
              .eq("id", reminder.user_id);
            failedCount++;
            continue;
          }
        }

        if (response.ok) {
          // Mark reminder as sent
          await supabase
            .from("user_reminders")
            .update({ notification_sent: true })
            .eq("id", reminder.id);
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (pushError) {
        console.error("Error sending push for reminder:", reminder.id, pushError);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        sent: sentCount,
        failed: failedCount,
        total: dueReminders.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-reminders:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
