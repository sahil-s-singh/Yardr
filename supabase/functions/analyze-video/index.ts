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
    const { base64Images } = await req.json();

    if (!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) {
      return new Response(
        JSON.stringify({ error: "base64Images array is required" }),
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
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              ...base64Images.slice(0, 3).map((base64: string) => ({
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64,
                },
              })),
              {
                type: "text",
                text: `You are analyzing frames from a short garage sale video. Look carefully at every item visible and identify them as specifically as possible.

Return a JSON object with these fields:

1. "title": A short, descriptive title for this sale based on what you see (max 60 chars). Be specific — e.g. "Vintage Furniture & Kitchen Sale" not "Garage Sale".

2. "description": A comma-separated list of every specific item you can identify. Be precise — say "wooden rocking chair" not "chair", say "KitchenAid stand mixer" not "appliance", say "Nike running shoes" not "shoes". List at least 5 items if visible.

3. "categories": An array of specific, relevant tags for the items you see. Use descriptive tags like "Vintage Furniture", "Power Tools", "Baby Clothes", "Board Games", "Small Appliances". Generate 3-6 tags that accurately describe what's for sale. Do NOT use generic single-word tags.

Respond ONLY with the JSON object.`,
              },
            ],
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
        JSON.stringify({ error: "No text response from Claude" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not parse Claude response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        title: result.title || "Garage Sale",
        description: result.description || "Various items for sale",
        categories: result.categories || ["Other"],
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
