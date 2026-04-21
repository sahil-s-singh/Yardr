const mockFrom = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockRange = jest.fn();
const mockSingle = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

jest.mock("@/lib/wishlistMatcher", () => ({
  matchWishlistAgainstSale: jest.fn(),
}));

jest.mock("@/lib/wishlistNotifications", () => ({
  sendWishlistMatchNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/mappers", () => ({
  mapGarageSaleRow: jest.fn((row: any) => row),
}));

import { wishlistService, checkNewSaleAgainstWishlists } from "@/services/wishlistService";
import { matchWishlistAgainstSale } from "@/lib/wishlistMatcher";
import { sendWishlistMatchNotification } from "@/lib/wishlistNotifications";

const mockMatch = matchWishlistAgainstSale as jest.MockedFunction<typeof matchWishlistAgainstSale>;
const mockNotify = sendWishlistMatchNotification as jest.MockedFunction<typeof sendWishlistMatchNotification>;

describe("wishlistService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── CRUD Operations ──────────────────────────────────────────────

  describe("addWishlistItem", () => {
    it("inserts item with correct fields", async () => {
      const insertedItem = {
        id: "w1",
        user_id: "u1",
        item_name: "Vintage Lamp",
        description: "Art deco style",
        category: "furniture",
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: insertedItem, error: null }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: insertedItem, error: null }),
          }),
        }),
      });

      const result = await wishlistService.addWishlistItem("u1", "Vintage Lamp", "Art deco style", "furniture");

      expect(result.item_name).toBe("Vintage Lamp");
      expect(result.category).toBe("furniture");
    });

    it("passes null for optional fields", async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: { id: "w1", user_id: "u1", item_name: "Chair", description: null, category: null },
        error: null,
      });
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: singleMock }),
      });

      mockFrom.mockReturnValue({
        insert: insertMock,
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      await wishlistService.addWishlistItem("u1", "Chair");

      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          description: null,
          category: null,
        }),
      ]);
    });
  });

  describe("getUserWishlistItems", () => {
    it("queries with correct filters and default pagination", async () => {
      const rangeMock = jest.fn().mockResolvedValue({ data: [{ id: "w1" }], error: null });
      const orderMock = jest.fn().mockReturnValue({ range: rangeMock });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        }),
      });

      const result = await wishlistService.getUserWishlistItems("u1");

      expect(result).toEqual([{ id: "w1" }]);
      // Default limit=50, offset=0 → range(0, 49)
      expect(rangeMock).toHaveBeenCalledWith(0, 49);
    });

    it("respects custom limit and offset", async () => {
      const rangeMock = jest.fn().mockResolvedValue({ data: [], error: null });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({ range: rangeMock }),
            }),
          }),
        }),
      });

      await wishlistService.getUserWishlistItems("u1", 10, 20);

      // limit=10, offset=20 → range(20, 29)
      expect(rangeMock).toHaveBeenCalledWith(20, 29);
    });
  });

  describe("deleteWishlistItem", () => {
    it("soft-deletes by setting is_active to false", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockReturnValue({ update: updateMock });

      await wishlistService.deleteWishlistItem("w1");

      expect(updateMock).toHaveBeenCalledWith({ is_active: false });
    });
  });

  // ─── Pagination ───────────────────────────────────────────────────

  describe("getAllMatchesForUser pagination", () => {
    it("uses default limit of 50", async () => {
      const rangeMock = jest.fn().mockResolvedValue({ data: [], error: null });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({ range: rangeMock }),
          }),
        }),
      });

      await wishlistService.getAllMatchesForUser("u1");

      expect(rangeMock).toHaveBeenCalledWith(0, 49);
    });

    it("supports custom pagination params", async () => {
      const rangeMock = jest.fn().mockResolvedValue({ data: [], error: null });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({ range: rangeMock }),
          }),
        }),
      });

      await wishlistService.getAllMatchesForUser("u1", 25, 50);

      expect(rangeMock).toHaveBeenCalledWith(50, 74);
    });
  });

  // ─── Rate-Limited Matching ────────────────────────────────────────

  describe("checkNewSaleAgainstWishlists", () => {
    it("processes matches in rate-limited batches", async () => {
      const wishlists = Array.from({ length: 12 }, (_, i) => ({
        id: `w${i}`,
        user_id: `u${i}`,
        item_name: `item-${i}`,
        is_active: true,
      }));

      // Mock sale fetch
      const saleMock = { id: "s1", title: "Sale", description: "stuff", categories: [] };

      mockFrom.mockImplementation((table: string) => {
        if (table === "garage_sales") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: saleMock, error: null }),
              }),
            }),
          };
        }
        if (table === "user_wishlists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: wishlists, error: null }),
            }),
          };
        }
        // wishlist_matches insert
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "m1" },
                error: null,
              }),
            }),
          }),
        };
      });

      // All matches return true
      mockMatch.mockResolvedValue({ isMatch: true, confidence: "high", reason: "keyword" });

      await checkNewSaleAgainstWishlists("s1");

      // Should have been called for all 12 wishlist items
      expect(mockMatch).toHaveBeenCalledTimes(12);
    });

    it("handles empty wishlists gracefully", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "garage_sales") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: "s1" }, error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      // Should not throw
      await checkNewSaleAgainstWishlists("s1");

      expect(mockMatch).not.toHaveBeenCalled();
    });

    it("handles sale not found", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
          }),
        }),
      });

      // Should not throw
      await checkNewSaleAgainstWishlists("nonexistent");

      expect(mockMatch).not.toHaveBeenCalled();
    });
  });
});
