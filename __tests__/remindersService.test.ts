import * as Notifications from "expo-notifications";

const mockFrom = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

import { remindersService } from "@/services/remindersService";

const mockSchedule = Notifications.scheduleNotificationAsync as jest.MockedFunction<
  typeof Notifications.scheduleNotificationAsync
>;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.MockedFunction<
  typeof Notifications.cancelScheduledNotificationAsync
>;

describe("remindersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── setReminder ──────────────────────────────────────────────────

  describe("setReminder", () => {
    it("inserts reminder and schedules local notification", async () => {
      const reminderData = {
        id: "r1",
        user_id: "u1",
        garage_sale_id: "s1",
        reminder_time: "2026-04-10T09:00:00Z",
      };

      mockFrom.mockImplementation((table: string) => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: reminderData, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }));

      mockSchedule.mockResolvedValue("notif-123");

      const result = await remindersService.setReminder(
        "u1",
        "s1",
        new Date("2026-04-10T09:00:00Z"),
        "Big Sale"
      );

      expect(result.id).toBe("r1");
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Garage Sale Reminder",
            body: "Big Sale is happening soon!",
            data: expect.objectContaining({ type: "reminder", garageSaleId: "s1" }),
          }),
        })
      );
    });

    it("stores local_notification_id after scheduling", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "r1", user_id: "u1" },
              error: null,
            }),
          }),
        }),
        update: updateMock,
      }));

      mockSchedule.mockResolvedValue("notif-456");

      await remindersService.setReminder("u1", "s1", new Date(), "Sale");

      expect(updateMock).toHaveBeenCalledWith({ local_notification_id: "notif-456" });
    });

    it("still returns data if notification scheduling fails", async () => {
      mockFrom.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "r1", user_id: "u1" },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }));

      mockSchedule.mockRejectedValue(new Error("Permission denied"));

      const result = await remindersService.setReminder("u1", "s1", new Date(), "Sale");

      // Should still return the DB record
      expect(result.id).toBe("r1");
    });
  });

  // ─── removeReminder ───────────────────────────────────────────────

  describe("removeReminder", () => {
    it("cancels local notification and deletes from DB", async () => {
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { local_notification_id: "notif-789" },
                error: null,
              }),
            }),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }));

      await remindersService.removeReminder("u1", "s1");

      expect(mockCancel).toHaveBeenCalledWith("notif-789");
    });

    it("deletes even if no notification ID stored", async () => {
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { local_notification_id: null },
                error: null,
              }),
            }),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }));

      await remindersService.removeReminder("u1", "s1");

      expect(mockCancel).not.toHaveBeenCalled();
    });

    it("still deletes if notification cancel fails", async () => {
      const deleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { local_notification_id: "notif-old" },
                error: null,
              }),
            }),
          }),
        }),
        delete: deleteMock,
      }));

      mockCancel.mockRejectedValue(new Error("Already cancelled"));

      await remindersService.removeReminder("u1", "s1");

      // Delete should still be called even though cancel failed
      expect(deleteMock).toHaveBeenCalled();
    });
  });

  // ─── hasReminder ──────────────────────────────────────────────────

  describe("hasReminder", () => {
    it("returns true when reminder exists", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: { id: "r1" }, error: null }),
            }),
          }),
        }),
      });

      const result = await remindersService.hasReminder("u1", "s1");
      expect(result).toBe(true);
    });

    it("returns false when no reminder exists", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      const result = await remindersService.hasReminder("u1", "s1");
      expect(result).toBe(false);
    });

    it("returns false on error", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: "oops" } }),
            }),
          }),
        }),
      });

      const result = await remindersService.hasReminder("u1", "s1");
      expect(result).toBe(false);
    });
  });
});
