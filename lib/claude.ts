// Claude API Key - loaded from environment
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
const CLAUDE_API_URL = process.env.EXPO_PUBLIC_CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';

// Analyze video frames to extract garage sale information
export async function analyzeGarageSaleVideo(base64Images: string[]): Promise<{
  title: string;
  description: string;
  categories: string[];
}> {
  if (!CLAUDE_API_KEY) {
    throw new Error('EXPO_PUBLIC_CLAUDE_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              ...base64Images.slice(0, 3).map((base64) => ({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64,
                },
              })),
              {
                type: 'text',
                text: `Analyze these images from a garage sale video and identify the items visible.

Please provide a JSON response with:
1. "title": A catchy, short title for this garage sale (max 60 characters)
2. "description": A comma-separated list of specific items visible (e.g., "playing cards, Uno card game, maps, food containers, coffee mug, miscellaneous items")
3. "categories": An array of categories that apply from this list: furniture, clothing, electronics, toys, books, tools, kitchen, sports, other

Example response format:
{
  "title": "Multi-Family Garage Sale",
  "description": "couch, coffee table, dining chairs, children's toys, kitchen utensils, board games, books",
  "categories": ["furniture", "toys", "kitchen"]
}

IMPORTANT: For "description", list specific items as tags separated by commas. Do NOT write sentences or paragraphs.

Respond ONLY with the JSON object, no other text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract text from Claude's response
    const textContent = data.content.find((block: any) => block.type === 'text');
    if (!textContent) {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      title: result.title || 'Garage Sale',
      description: result.description || 'Various items for sale',
      categories: result.categories || ['other'],
    };
  } catch (error) {
    console.error('Error analyzing video with Claude:', error);
    throw error;
  }
}
