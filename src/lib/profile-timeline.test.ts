import { describe, expect, it } from "vitest";
import {
  dateToMonthValue,
  formatTimelinePeriod,
  parseProfileTimelineItemFormData,
} from "./profile-timeline";

function createTimelineFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    type: "FORMATION",
    title: "Master 2 Cybersécurité",
    organization: "Université",
    location: "Lyon",
    description: "Sécurité applicative et infrastructure.",
    startMonth: "2025-09",
    endMonth: "2026-09",
    sortOrder: "1",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("profile timeline helpers", () => {
  it("parses a timeline item form payload", () => {
    const result = parseProfileTimelineItemFormData(createTimelineFormData());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toMatchObject({
        type: "FORMATION",
        title: "Master 2 Cybersécurité",
        organization: "Université",
        location: "Lyon",
        description: "Sécurité applicative et infrastructure.",
        isCurrent: false,
        sortOrder: 1,
      });
      expect(result.data.startDate?.toISOString()).toBe(
        "2025-09-01T00:00:00.000Z",
      );
      expect(result.data.endDate?.toISOString()).toBe(
        "2026-09-01T00:00:00.000Z",
      );
    }
  });

  it("clears the end date for current items", () => {
    const formData = createTimelineFormData({
      isCurrent: "on",
      endMonth: "",
    });
    const result = parseProfileTimelineItemFormData(formData);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.isCurrent).toBe(true);
      expect(result.data.endDate).toBeNull();
    }
  });

  it("rejects invalid date ordering", () => {
    const result = parseProfileTimelineItemFormData(
      createTimelineFormData({
        startMonth: "2026-09",
        endMonth: "2025-09",
      }),
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;

      expect(errors.endMonth?.[0]).toBe(
        "La date de fin doit être postérieure à la date de début.",
      );
    }
  });

  it("formats dates for form inputs and display", () => {
    expect(dateToMonthValue(new Date(Date.UTC(2026, 8, 1)))).toBe("2026-09");
    expect(
      formatTimelinePeriod({
        startMonth: "2025-09",
        endMonth: "",
        isCurrent: true,
      }),
    ).toBe("2025-09 - Aujourd'hui");
  });
});
