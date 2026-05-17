import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns application health information", async () => {
    vi.stubEnv("APP_ENV", "test");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      environment: "test",
    });
    expect(body.timestamp).toEqual(expect.any(String));
    expect(body.uptime).toEqual(expect.any(Number));
  });
});
