jest.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

import { analyzeGarageSaleVideo, analyzeWishlistMatch } from "@/lib/claude";
import { supabase } from "@/lib/supabase";

const mockInvoke = supabase.functions.invoke as jest.MockedFunction<typeof supabase.functions.invoke>;

describe("Claude API integration (lib/claude.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── analyzeGarageSaleVideo ───────────────────────────────────────

  describe("analyzeGarageSaleVideo", () => {
    it("sends base64 images to analyze-video edge function", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          title: "Vintage Furniture Sale",
          description: "wooden chairs, table, bookshelf",
          categories: ["Furniture", "Vintage"],
        },
        error: null,
      });

      const result = await analyzeGarageSaleVideo(["base64img1", "base64img2"]);

      expect(mockInvoke).toHaveBeenCalledWith("analyze-video", {
        body: { base64Images: ["base64img1", "base64img2"] },
      });
      expect(result.title).toBe("Vintage Furniture Sale");
      expect(result.categories).toEqual(["Furniture", "Vintage"]);
    });

    it("returns defaults when API returns empty fields", async () => {
      mockInvoke.mockResolvedValue({
        data: { title: null, description: null, categories: null },
        error: null,
      });

      const result = await analyzeGarageSaleVideo(["img"]);

      expect(result.title).toBe("Garage Sale");
      expect(result.description).toBe("Various items for sale");
      expect(result.categories).toEqual(["Other"]);
    });

    it("throws on edge function error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "Function timeout" },
      });

      await expect(analyzeGarageSaleVideo(["img"])).rejects.toThrow("Video analysis failed");
    });

    it("throws on data-level error", async () => {
      mockInvoke.mockResolvedValue({
        data: { error: "CLAUDE_API_KEY not configured" },
        error: null,
      });

      await expect(analyzeGarageSaleVideo(["img"])).rejects.toThrow("CLAUDE_API_KEY not configured");
    });
  });

  // ─── analyzeWishlistMatch ─────────────────────────────────────────

  describe("analyzeWishlistMatch", () => {
    it("sends wishlist item and sale to match-wishlist edge function", async () => {
      const wishlistItem = { item_name: "Wine Glasses", description: "crystal set", category: "kitchen" };
      const sale = { title: "Kitchen Sale", description: "glassware, plates", categories: ["kitchen"] };

      mockInvoke.mockResolvedValue({
        data: { isMatch: true, reason: "Glassware matches wine glasses" },
        error: null,
      });

      const result = await analyzeWishlistMatch(wishlistItem, sale);

      expect(mockInvoke).toHaveBeenCalledWith("match-wishlist", {
        body: { wishlistItem, garageSale: sale },
      });
      expect(result.isMatch).toBe(true);
      expect(result.reason).toContain("Glassware");
    });

    it("returns false match when AI says no", async () => {
      mockInvoke.mockResolvedValue({
        data: { isMatch: false, reason: "Items don't match" },
        error: null,
      });

      const result = await analyzeWishlistMatch(
        { item_name: "Guitar", description: null, category: null },
        { title: "Book Sale", description: "novels, textbooks" }
      );

      expect(result.isMatch).toBe(false);
    });

    it("returns defaults on empty response", async () => {
      mockInvoke.mockResolvedValue({
        data: { isMatch: null, reason: null },
        error: null,
      });

      const result = await analyzeWishlistMatch(
        { item_name: "test", description: null, category: null },
        { title: "test", description: "test" }
      );

      expect(result.isMatch).toBe(false);
      expect(result.reason).toBe("Unknown");
    });

    it("throws on edge function error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "Service unavailable" },
      });

      await expect(
        analyzeWishlistMatch(
          { item_name: "test", description: null, category: null },
          { title: "test", description: "test" }
        )
      ).rejects.toThrow("Wishlist matching failed");
    });
  });
});
