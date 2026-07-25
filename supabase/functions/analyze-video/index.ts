import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");

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
      JSON.stringify({ error: "Claude API key not configured" }),
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
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
                text: `You are looking at frames from a garage sale video. Identify ONLY the items you can clearly and confidently recognize.

STRICT RULES — read carefully:
- Only list an item if you are confident about what it actually is. If an object is ambiguous, blurry, partially hidden, or you're just guessing at its shape/color, LEAVE IT OUT entirely rather than naming it vaguely.
- Never invent a category label for something you can't identify (e.g. a plain white/blank object is NOT automatically "paper", "organizer", "box", etc. — only say what it is if it's actually recognizable as that thing).
- If you can read a brand name, logo, or label clearly, use it (e.g. "Lacoste perfume", "Uno card game", "KitchenAid mixer") — this precision is valuable and should be prioritized.
- Prefer fewer, precise items over a long list padded with uncertain guesses.
- Do not use filler/vague terms like "miscellaneous items", "household items", "various items", "assorted goods" — every listed item must be a specific, real thing you actually see.

Please provide a JSON response with:
1. "title": A specific, descriptive title for this garage sale based on what's actually visible (max 60 characters). Avoid generic titles like "Multi-Family Garage Sale" or "Garage Sale" — reference the standout, clearly identifiable items or brands instead (e.g. "Lacoste Perfume & Vintage Furniture Sale").
2. "description": A comma-separated list of the specific, clearly-identified items only (e.g., "Lacoste perfume, Uno card game, wooden dining chairs, ceramic coffee mugs"). Do NOT write sentences or paragraphs, and do NOT pad the list with uncertain or vague items.
3. "categories": An array of categories that apply from this list: furniture, clothing, electronics, toys, books, tools, kitchen, sports, other — only include a category if at least one confidently-identified item supports it.

Respond ONLY with the JSON object, no other text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Claude API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const textContent = data.content.find((block: any) => block.type === "text");

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
        categories: result.categories || ["other"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
