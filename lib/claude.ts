import { supabase } from "./supabase";

// Analyze video frames via Supabase Edge Function (Claude API key stays server-side)
export async function analyzeGarageSaleVideo(base64Images: string[]): Promise<{
  title: string;
  description: string;
  categories: string[];
}> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: { base64Images: base64Images.slice(0, 3) },
  });

  if (error) {
    throw new Error(`Video analysis failed: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    title: data.title || "Garage Sale",
    description: data.description || "Various items for sale",
    categories: data.categories || ["other"],
  };
}
