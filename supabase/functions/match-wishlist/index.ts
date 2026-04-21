import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!CLAUDE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "CLAUDE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { wishlistItem, garageSale } = await req.json();

    if (!wishlistItem || !garageSale) {
      return new Response(
        JSON.stringify({ error: "wishlistItem and garageSale are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Determine if a garage sale listing matches a user's wishlist item.

WISHLIST ITEM:
Name: ${wishlistItem.item_name}
Description: ${wishlistItem.description || "N/A"}
Category: ${wishlistItem.category || "N/A"}

GARAGE SALE:
Title: ${garageSale.title}
Description: ${garageSale.description}
Categories: ${garageSale.categories?.join(", ") || "N/A"}

Does this garage sale likely have the item the user is looking for? Consider semantic meaning, not just exact keyword matches.
For example, "wine glasses" matches "glassware set" or "kitchen glasses".

Respond ONLY with JSON:
{
  "isMatch": true/false,
  "reason": "Brief explanation of why it matches or doesn't match (max 50 chars)"
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Claude API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const textContent = data.content?.find(
      (block: { type: string }) => block.type === "text"
    );

    if (!textContent) {
      return new Response(
        JSON.stringify({ isMatch: false, reason: "Analysis unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ isMatch: false, reason: "Analysis unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        isMatch: result.isMatch || false,
        reason: result.reason || "Unknown",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
