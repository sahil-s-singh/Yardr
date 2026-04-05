import { matchWishlistAgainstSale } from "@/lib/wishlistMatcher";

// Mock the Claude API call
jest.mock("@/lib/claude", () => ({
  analyzeWishlistMatch: jest.fn(),
}));

import { analyzeWishlistMatch } from "@/lib/claude";
const mockAnalyze = analyzeWishlistMatch as jest.MockedFunction<typeof analyzeWishlistMatch>;

describe("wishlistMatcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Phase 1: Keyword Matching ────────────────────────────────────

  describe("Phase 1 - Keyword matching", () => {
    it("returns high confidence when 2+ keywords match", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "vintage wooden rocking chair",
        description: "looking for a rocking chair made of wood",
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Vintage Furniture Sale",
        description: "wooden dining table, rocking chair, bookshelf",
        categories: ["furniture"],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe("high");
      expect(result.reason).toContain("Keyword match");
      // Should NOT call AI since keyword match was sufficient
      expect(mockAnalyze).not.toHaveBeenCalled();
    });

    it("returns high confidence when a long keyword (>6 chars) matches", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "kitchenaid mixer",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Kitchen Appliances",
        description: "KitchenAid stand mixer, blender, toaster",
        categories: ["kitchen"],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe("high");
    });

    it("does not match short common words", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "a set of items",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Random Sale",
        description: "various items for sale",
        categories: [],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      // "a", "set", "of", "items" are all common words filtered out
      expect(result.isMatch).toBe(false);
    });
  });

  // ─── Phase 2: Category + Keyword + AI Verification ────────────────

  describe("Phase 2 - Category matching with AI verification", () => {
    it("calls AI when category matches and 1 short keyword found", async () => {
      mockAnalyze.mockResolvedValue({ isMatch: true, reason: "Cups match" });

      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "cups",
        description: null,
        category: "kitchen",
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Kitchen Clearance",
        description: "plates, cups, pots and pans",
        categories: ["kitchen"],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      // "cups" (4 chars, <=6) is 1 keyword match + category match → AI called
      expect(mockAnalyze).toHaveBeenCalledTimes(1);
      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe("verified");
      expect(result.reason).toContain("AI verified");
    });

    it("falls back to category match if AI fails", async () => {
      mockAnalyze.mockRejectedValue(new Error("API timeout"));

      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "cups",
        description: null,
        category: "kitchen",
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Kitchen Sale",
        description: "cups, plates, bowls",
        categories: ["kitchen"],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe("medium");
      expect(result.reason).toContain("Category match");
    });

    it("does not match when category matches but no keywords", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "blender",
        description: null,
        category: "kitchen",
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Furniture & Decor",
        description: "tables, lamps, curtains",
        categories: ["kitchen", "furniture"],
      };

      // No keyword "blender" in sale text, and AI is only called if exactMatches >= 1
      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(false);
    });
  });

  // ─── Phase 3: Single Keyword + AI Verification ────────────────────

  describe("Phase 3 - Single keyword with AI verification", () => {
    it("calls AI to verify single short keyword match (no category)", async () => {
      mockAnalyze.mockResolvedValue({ isMatch: true, reason: "Lamp matches" });

      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "desk lamp",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Office Supplies",
        description: "desk, chair, pens, stapler",
        categories: ["office"],
      };

      // "desk" (4 chars <=6) is 1 keyword match, no category → Phase 3 AI called
      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(mockAnalyze).toHaveBeenCalled();
      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe("verified");
    });

    it("returns no match if AI says no on single keyword", async () => {
      mockAnalyze.mockResolvedValue({ isMatch: false, reason: "Not relevant" });

      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "red vase",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Art Supplies",
        description: "red paint, brushes, canvas",
        categories: [],
      };

      // "red" (3 chars > 2) matches, but AI says no
      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(false);
    });

    it("returns no match if AI call fails on single keyword", async () => {
      mockAnalyze.mockRejectedValue(new Error("Network error"));

      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "drum kit",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Music Gear",
        description: "drum sticks, sheet music, stand",
        categories: [],
      };

      // "drum" (4 chars <=6) is 1 keyword, AI fails → no confident match
      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(false);
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("handles empty wishlist description", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "couch",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Moving Sale",
        description: "Everything must go! Dishes, books, clothes.",
        categories: [],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(false);
    });

    it("handles case-insensitive matching", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "NINTENDO Switch",
        description: "Nintendo Switch console",
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Video Games",
        description: "nintendo switch, PS5 games, controllers",
        categories: ["electronics"],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe("high");
    });

    it("handles sale with empty description", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "bookshelf",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "",
        description: "",
        categories: [],
      };

      const result = await matchWishlistAgainstSale(wishlistItem, sale);

      expect(result.isMatch).toBe(false);
    });

    it("handles special characters in wishlist item", async () => {
      const wishlistItem = {
        id: "w1",
        user_id: "u1",
        item_name: "kid's bike (20-inch)",
        description: null,
        category: null,
        is_active: true,
        created_at: "",
      };
      const sale = {
        id: "s1",
        title: "Kids Outdoor Sale",
        description: "20-inch bike, helmet, skateboard",
        categories: ["sports"],
      };

      // Should not throw
      const result = await matchWishlistAgainstSale(wishlistItem, sale);
      expect(result).toBeDefined();
    });
  });
});
