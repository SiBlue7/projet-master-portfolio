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

  it("renders a human-readable health page for browser requests", async () => {
    vi.stubEnv("APP_ENV", "preprod");

    const response = await GET(
      new Request("http://localhost:3000/api/health", {
        headers: {
          accept: "text/html",
        },
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Application disponible");
    expect(body).toContain("preprod");
    expect(body).toContain('localStorage.getItem("portfolio-theme")');
    expect(body).toContain(':root[data-theme="dark"]');
  });

  it("keeps JSON available through the format query parameter", async () => {
    vi.stubEnv("APP_ENV", "prod");

    const response = await GET(
      new Request("http://localhost:3000/api/health?format=json", {
        headers: {
          accept: "text/html",
        },
      }),
    );
    const body = await response.json();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body).toMatchObject({
      environment: "prod",
      status: "ok",
    });
  });
});
