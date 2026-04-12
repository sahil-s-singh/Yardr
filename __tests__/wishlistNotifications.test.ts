// Mock supabase before importing the module
const mockFrom = jest.fn();
const mockUpdate = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockSingle = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { sendWishlistMatchNotification } from "@/lib/wishlistNotifications";

describe("wishlistNotifications", () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock chain for supabase queries
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });
    mockSelect.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockEq.mockReturnThis();

    // Chain .eq after .select or .update
    mockSelect.mockReturnValue({ eq: mockEq });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  function setupMatchQuery(matchData: any, profileData: any) {
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "wishlist_matches" && callCount === 0) {
        callCount++;
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: matchData, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: profileData, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      // For the final update after sending
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: matchData, error: null }),
          }),
        }),
      };
    });
  }

  // ─── Successful Send ──────────────────────────────────────────────

  describe("successful notification send", () => {
    it("sends notification and marks as sent", async () => {
      const matchData = {
        id: "match-1",
        garage_sale_id: "sale-1",
        wishlist_item_id: "wish-1",
        notification_sent: false,
        garage_sales: { title: "Big Garage Sale" },
        user_wishlists: { item_name: "Vintage Lamp" },
      };
      const profileData = { expo_push_token: "ExponentPushToken[abc123]" };

      setupMatchQuery(matchData, profileData);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: "ok" } }),
      } as Response);

      await sendWishlistMatchNotification("user-1", "match-1");

      // Verify Expo Push API was called
      expect(mockFetch).toHaveBeenCalledWith(
        "https://exp.host/--/api/v2/push/send",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("ExponentPushToken[abc123]"),
        })
      );
    });

    it("includes correct notification payload", async () => {
      const matchData = {
        id: "match-1",
        garage_sale_id: "sale-1",
        wishlist_item_id: "wish-1",
        notification_sent: false,
        garage_sales: { title: "Kitchen Clearout" },
        user_wishlists: { item_name: "Wine Glasses" },
      };
      const profileData = { expo_push_token: "ExponentPushToken[xyz]" };

      setupMatchQuery(matchData, profileData);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: "ok" } }),
      } as Response);

      await sendWishlistMatchNotification("user-1", "match-1");

      const fetchBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      // Copy is randomized, so check item name + sale title appear somewhere
      // in the combined title/body payload.
      const combined = `${fetchBody.title} ${fetchBody.body}`;
      expect(combined).toContain("Wine Glasses");
      expect(combined).toContain("Kitchen Clearout");
      expect(fetchBody.data.type).toBe("wishlist_match");
      expect(fetchBody.data.garageSaleId).toBe("sale-1");
    });
  });

  // ─── Already Sent ─────────────────────────────────────────────────

  describe("skip already-sent notifications", () => {
    it("does not resend if notification_sent is true", async () => {
      const matchData = {
        id: "match-1",
        notification_sent: true, // Already sent
        garage_sales: { title: "Sale" },
        user_wishlists: { item_name: "Item" },
      };

      setupMatchQuery(matchData, {});

      await sendWishlistMatchNotification("user-1", "match-1");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ─── No Push Token ────────────────────────────────────────────────

  describe("missing push token", () => {
    it("does NOT mark as sent when no token available", async () => {
      const matchData = {
        id: "match-1",
        notification_sent: false,
        garage_sales: { title: "Sale" },
        user_wishlists: { item_name: "Item" },
      };

      setupMatchQuery(matchData, { expo_push_token: null });

      await sendWishlistMatchNotification("user-1", "match-1");

      expect(mockFetch).not.toHaveBeenCalled();
      // Should NOT have updated notification_sent since user may add token later
    });
  });

  // ─── Retry Logic ──────────────────────────────────────────────────

  describe("retry logic", () => {
    it("retries on server error (5xx)", async () => {
      const matchData = {
        id: "match-1",
        notification_sent: false,
        garage_sales: { title: "Sale" },
        user_wishlists: { item_name: "Item" },
        garage_sale_id: "sale-1",
        wishlist_item_id: "wish-1",
      };
      const profileData = { expo_push_token: "ExponentPushToken[token]" };

      setupMatchQuery(matchData, profileData);

      // First 2 attempts fail with 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { status: "ok" } }) } as Response);

      await sendWishlistMatchNotification("user-1", "match-1");

      // Should have called fetch 3 times (2 retries + 1 success)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("retries on network error", async () => {
      const matchData = {
        id: "match-1",
        notification_sent: false,
        garage_sales: { title: "Sale" },
        user_wishlists: { item_name: "Item" },
        garage_sale_id: "sale-1",
        wishlist_item_id: "wish-1",
      };
      const profileData = { expo_push_token: "ExponentPushToken[token]" };

      setupMatchQuery(matchData, profileData);

      // First attempt throws, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { status: "ok" } }) } as Response);

      await sendWishlistMatchNotification("user-1", "match-1");

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("does not retry on 4xx client errors", async () => {
      const matchData = {
        id: "match-1",
        notification_sent: false,
        garage_sales: { title: "Sale" },
        user_wishlists: { item_name: "Item" },
        garage_sale_id: "sale-1",
        wishlist_item_id: "wish-1",
      };
      const profileData = { expo_push_token: "ExponentPushToken[token]" };

      setupMatchQuery(matchData, profileData);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Bad request" }),
      } as Response);

      await sendWishlistMatchNotification("user-1", "match-1");

      // Should NOT retry on 400
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Invalid Token Handling ───────────────────────────────────────

  describe("invalid token handling", () => {
    it("clears token from DB on DeviceNotRegistered error", async () => {
      const matchData = {
        id: "match-1",
        notification_sent: false,
        garage_sales: { title: "Sale" },
        user_wishlists: { item_name: "Item" },
        garage_sale_id: "sale-1",
        wishlist_item_id: "wish-1",
      };
      const profileData = { expo_push_token: "ExponentPushToken[expired]" };

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === "wishlist_matches") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: matchData, error: null }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === "user_profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: profileData, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
        return { update: updateMock, select: jest.fn().mockReturnThis() };
      });

      // Expo returns DeviceNotRegistered
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { status: "error", details: { error: "DeviceNotRegistered" } },
        }),
      } as Response);

      await sendWishlistMatchNotification("user-1", "match-1");

      // Should have called update on user_profiles to clear the token
      expect(updateMock).toHaveBeenCalledWith({ expo_push_token: null });
    });
  });
});
