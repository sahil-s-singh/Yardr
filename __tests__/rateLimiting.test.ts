// Test the rate limiting utility used in wishlist matching

// We need to test the rateLimitedMatchLoop function from wishlistService
// Since it's not exported directly, we test it through the public API

jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn() },
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

import { supabase } from "@/lib/supabase";
import { matchWishlistAgainstSale } from "@/lib/wishlistMatcher";
import { checkNewSaleAgainstWishlists } from "@/services/wishlistService";

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;
const mockMatch = matchWishlistAgainstSale as jest.MockedFunction<typeof matchWishlistAgainstSale>;

describe("Rate limiting in wishlist matching", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processes all items even with large counts", async () => {
    const wishlists = Array.from({ length: 20 }, (_, i) => ({
      id: `w${i}`,
      user_id: `u${i}`,
      item_name: `item-${i}`,
      is_active: true,
    }));

    const sale = { id: "s1", title: "Sale", description: "stuff" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "garage_sales") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: sale, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "user_wishlists") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: wishlists, error: null }),
          }),
        } as any;
      }
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: "m1" }, error: null }),
          }),
        }),
      } as any;
    });

    // No matches - just verifying all get processed
    mockMatch.mockResolvedValue({ isMatch: false, confidence: "medium", reason: "no match" });

    await checkNewSaleAgainstWishlists("s1");

    // All 20 wishlists should have been checked
    expect(mockMatch).toHaveBeenCalledTimes(20);
  });

  it("continues processing if one match throws", async () => {
    const wishlists = Array.from({ length: 6 }, (_, i) => ({
      id: `w${i}`,
      user_id: `u${i}`,
      item_name: `item-${i}`,
      is_active: true,
    }));

    const sale = { id: "s1", title: "Sale", description: "stuff" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "garage_sales") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: sale, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "user_wishlists") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: wishlists, error: null }),
          }),
        } as any;
      }
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: "m1" }, error: null }),
          }),
        }),
      } as any;
    });

    // First call throws, rest succeed
    mockMatch
      .mockRejectedValueOnce(new Error("API down"))
      .mockResolvedValue({ isMatch: false, confidence: "medium", reason: "no match" });

    // Should not throw even though one item failed
    await expect(checkNewSaleAgainstWishlists("s1")).resolves.not.toThrow();
  });

  it("creates match records only for matching items", async () => {
    const wishlists = [
      { id: "w1", user_id: "u1", item_name: "laptop", is_active: true },
      { id: "w2", user_id: "u2", item_name: "guitar", is_active: true },
      { id: "w3", user_id: "u3", item_name: "chair", is_active: true },
    ];

    const sale = { id: "s1", title: "Electronics Sale", description: "laptops, phones" };

    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: "m1" }, error: null }),
      }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "garage_sales") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: sale, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "user_wishlists") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: wishlists, error: null }),
          }),
        } as any;
      }
      return { insert: insertMock } as any;
    });

    // Only first item matches
    mockMatch
      .mockResolvedValueOnce({ isMatch: true, confidence: "high", reason: "keyword" })
      .mockResolvedValueOnce({ isMatch: false, confidence: "medium", reason: "no match" })
      .mockResolvedValueOnce({ isMatch: false, confidence: "medium", reason: "no match" });

    await checkNewSaleAgainstWishlists("s1");

    // Only 1 insert should have been called (for the matching item)
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
