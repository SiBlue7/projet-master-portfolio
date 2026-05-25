import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import {
  adminLoginRateLimitErrorCode,
  adminSessionMaxAgeSeconds,
  adminSessionUpdateAgeSeconds,
} from "./auth-security";
import {
  authOptions,
  authorizeAdminCredentials,
  resetAdminLoginRateLimit,
  verifyAdminCredentials,
} from "./auth";

const mocks = vi.hoisted(() => ({
  tryWriteAuditLog: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  tryWriteAuditLog: mocks.tryWriteAuditLog,
}));

const adminUser = {
  id: "admin-user-id",
  email: "admin@example.com",
  pseudo: "Admin",
  passwordHash: "hashed-password",
  role: UserRole.ADMIN,
};

describe("verifyAdminCredentials", () => {
  beforeEach(() => {
    resetAdminLoginRateLimit();
    mocks.tryWriteAuditLog.mockResolvedValue(undefined);
    vi.useRealTimers();
  });

  it("returns the authenticated admin with email and password", async () => {
    const findUserByLogin = vi.fn().mockResolvedValue(adminUser);
    const comparePassword = vi.fn().mockResolvedValue(true);

    const result = await verifyAdminCredentials(
      {
        email: "ADMIN@example.com",
        password: "plain-password",
      },
      {
        findUserByLogin,
        comparePassword,
      },
    );

    expect(findUserByLogin).toHaveBeenCalledWith("admin@example.com");
    expect(comparePassword).toHaveBeenCalledWith(
      "plain-password",
      "hashed-password",
    );
    expect(result).toEqual({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.pseudo,
      pseudo: adminUser.pseudo,
      role: adminUser.role,
    });
  });

  it("returns the authenticated admin with pseudo and password", async () => {
    const findUserByLogin = vi.fn().mockResolvedValue(adminUser);
    const comparePassword = vi.fn().mockResolvedValue(true);

    const result = await verifyAdminCredentials(
      {
        pseudo: "admin",
        password: "plain-password",
      },
      {
        findUserByLogin,
        comparePassword,
      },
    );

    expect(findUserByLogin).toHaveBeenCalledWith("admin");
    expect(comparePassword).toHaveBeenCalledWith(
      "plain-password",
      "hashed-password",
    );
    expect(result?.id).toBe(adminUser.id);
  });

  it("returns the authenticated admin with a generic identifier and password", async () => {
    const findUserByLogin = vi.fn().mockResolvedValue(adminUser);

    const result = await verifyAdminCredentials(
      {
        identifier: "Admin",
        password: "plain-password",
      },
      {
        findUserByLogin,
        comparePassword: vi.fn().mockResolvedValue(true),
      },
    );

    expect(findUserByLogin).toHaveBeenCalledWith("Admin");
    expect(result?.pseudo).toBe(adminUser.pseudo);
  });

  it("rejects invalid payloads", async () => {
    const result = await verifyAdminCredentials({
      pseudo: "",
      password: "",
    });

    expect(result).toBeNull();
  });

  it("rejects unknown users", async () => {
    const result = await verifyAdminCredentials(
      {
        pseudo: "admin",
        email: "admin@example.com",
        password: "plain-password",
      },
      {
        findUserByLogin: vi.fn().mockResolvedValue(null),
        comparePassword: vi.fn(),
      },
    );

    expect(result).toBeNull();
  });

  it("rejects invalid passwords", async () => {
    const result = await verifyAdminCredentials(
      {
        pseudo: "admin",
        email: "admin@example.com",
        password: "plain-password",
      },
      {
        findUserByLogin: vi.fn().mockResolvedValue(adminUser),
        comparePassword: vi.fn().mockResolvedValue(false),
      },
    );

    expect(result).toBeNull();
  });

  it("limits repeated failed admin login attempts", async () => {
    const dependencies = {
      comparePassword: vi.fn().mockResolvedValue(false),
      findUserByLogin: vi.fn().mockResolvedValue(adminUser),
    };
    const request = {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    };

    await expect(
      authorizeAdminCredentials(
        {
          identifier: "admin@example.com",
          password: "wrong-password",
        },
        request,
        dependencies,
      ),
    ).resolves.toBeNull();
    await expect(
      authorizeAdminCredentials(
        {
          identifier: "admin@example.com",
          password: "wrong-password",
        },
        request,
        dependencies,
      ),
    ).resolves.toBeNull();
    await expect(
      authorizeAdminCredentials(
        {
          identifier: "admin@example.com",
          password: "wrong-password",
        },
        request,
        dependencies,
      ),
    ).resolves.toBeNull();
    await expect(
      authorizeAdminCredentials(
        {
          identifier: "admin@example.com",
          password: "wrong-password",
        },
        request,
        dependencies,
      ),
    ).resolves.toBeNull();
    await expect(
      authorizeAdminCredentials(
        {
          identifier: "admin@example.com",
          password: "wrong-password",
        },
        request,
        dependencies,
      ),
    ).rejects.toThrow(adminLoginRateLimitErrorCode);

    await expect(
      authorizeAdminCredentials(
        {
          identifier: "admin@example.com",
          password: "plain-password",
        },
        request,
        {
          comparePassword: vi.fn().mockResolvedValue(true),
          findUserByLogin: vi.fn().mockResolvedValue(adminUser),
        },
      ),
    ).rejects.toThrow(adminLoginRateLimitErrorCode);
  });

  it("clears failed login attempts after a successful authentication", async () => {
    const request = {
      headers: {
        "x-forwarded-for": "203.0.113.20",
      },
    };

    await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "wrong-password",
      },
      request,
      {
        comparePassword: vi.fn().mockResolvedValue(false),
        findUserByLogin: vi.fn().mockResolvedValue(adminUser),
      },
    );

    const result = await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "plain-password",
      },
      request,
      {
        comparePassword: vi.fn().mockResolvedValue(true),
        findUserByLogin: vi.fn().mockResolvedValue(adminUser),
      },
    );

    expect(result?.id).toBe(adminUser.id);
  });

  it("writes audit logs for failed and successful authentications", async () => {
    const request = {
      headers: {
        "user-agent": "Vitest",
        "x-forwarded-for": "203.0.113.30",
      },
    };

    await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "wrong-password",
      },
      request,
      {
        comparePassword: vi.fn().mockResolvedValue(false),
        findUserByLogin: vi.fn().mockResolvedValue(adminUser),
      },
    );

    expect(mocks.tryWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "LOGIN_FAILURE",
        entityType: "auth",
        ipAddress: "203.0.113.30",
        metadata: {
          identifier: "admin@example.com",
          reason: "invalid_credentials",
        },
        status: "FAILURE",
        userAgent: "Vitest",
      }),
    );

    mocks.tryWriteAuditLog.mockClear();

    await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "plain-password",
      },
      request,
      {
        comparePassword: vi.fn().mockResolvedValue(true),
        findUserByLogin: vi.fn().mockResolvedValue(adminUser),
      },
    );

    expect(mocks.tryWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "LOGIN_SUCCESS",
        actor: {
          email: adminUser.email,
          id: adminUser.id,
          pseudo: adminUser.pseudo,
        },
        entityId: adminUser.id,
        entityType: "auth",
        ipAddress: "203.0.113.30",
        metadata: {
          identifier: "admin@example.com",
        },
        userAgent: "Vitest",
      }),
    );
  });

  it("configures short-lived JWT sessions and secure cookie options", () => {
    expect(authOptions.session).toMatchObject({
      maxAge: adminSessionMaxAgeSeconds,
      strategy: "jwt",
      updateAge: adminSessionUpdateAgeSeconds,
    });
    expect(authOptions.jwt).toMatchObject({
      maxAge: adminSessionMaxAgeSeconds,
    });
    expect(authOptions.cookies?.sessionToken?.options).toMatchObject({
      httpOnly: true,
      maxAge: adminSessionMaxAgeSeconds,
      path: "/",
      sameSite: "lax",
    });
  });
});
