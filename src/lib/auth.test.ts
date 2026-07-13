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
  comparePassword: vi.fn(),
  findFirstUser: vi.fn(),
  tryWriteAuditLog: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  tryWriteAuditLog: mocks.tryWriteAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: mocks.findFirstUser,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mocks.comparePassword,
  },
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
    mocks.comparePassword.mockReset();
    mocks.findFirstUser.mockReset();
    mocks.tryWriteAuditLog.mockReset();
    mocks.tryWriteAuditLog.mockResolvedValue(undefined);
    vi.useRealTimers();
  });

  it("returns the authenticated admin with an email identifier", async () => {
    mocks.findFirstUser.mockResolvedValue(adminUser);
    mocks.comparePassword.mockResolvedValue(true);

    const result = await verifyAdminCredentials({
      identifier: "ADMIN@example.com",
      password: "plain-password",
    });

    expect(mocks.findFirstUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: {
            equals: "admin@example.com",
            mode: "insensitive",
          },
        },
      }),
    );
    expect(mocks.comparePassword).toHaveBeenCalledWith(
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

  it("returns the authenticated admin with a pseudo identifier", async () => {
    mocks.findFirstUser.mockResolvedValue(adminUser);
    mocks.comparePassword.mockResolvedValue(true);

    const result = await verifyAdminCredentials({
      identifier: "Admin",
      password: "plain-password",
    });

    expect(mocks.findFirstUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          pseudo: {
            equals: "Admin",
            mode: "insensitive",
          },
        },
      }),
    );
    expect(result?.pseudo).toBe(adminUser.pseudo);
  });

  it("falls back to an email lookup when the pseudo is unknown", async () => {
    mocks.findFirstUser
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(adminUser);
    mocks.comparePassword.mockResolvedValue(true);

    const result = await verifyAdminCredentials({
      identifier: "Admin",
      password: "plain-password",
    });

    expect(mocks.findFirstUser).toHaveBeenCalledTimes(2);
    expect(result?.id).toBe(adminUser.id);
  });

  it("rejects invalid payloads", async () => {
    const result = await verifyAdminCredentials({
      identifier: "",
      password: "",
    });

    expect(result).toBeNull();
    expect(mocks.findFirstUser).not.toHaveBeenCalled();
  });

  it("rejects unknown users", async () => {
    mocks.findFirstUser.mockResolvedValue(null);

    const result = await verifyAdminCredentials({
      identifier: "admin@example.com",
      password: "plain-password",
    });

    expect(result).toBeNull();
    expect(mocks.comparePassword).not.toHaveBeenCalled();
  });

  it("rejects invalid passwords", async () => {
    mocks.findFirstUser.mockResolvedValue(adminUser);
    mocks.comparePassword.mockResolvedValue(false);

    const result = await verifyAdminCredentials({
      identifier: "admin@example.com",
      password: "plain-password",
    });

    expect(result).toBeNull();
  });

  it("limits repeated failed admin login attempts", async () => {
    mocks.findFirstUser.mockResolvedValue(adminUser);
    mocks.comparePassword.mockResolvedValue(false);

    const request = {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    };
    const credentials = {
      identifier: "admin@example.com",
      password: "wrong-password",
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(
        authorizeAdminCredentials(credentials, request),
      ).resolves.toBeNull();
    }

    await expect(
      authorizeAdminCredentials(credentials, request),
    ).rejects.toThrow(adminLoginRateLimitErrorCode);

    mocks.comparePassword.mockResolvedValue(true);

    await expect(
      authorizeAdminCredentials(
        {
          identifier: "admin@example.com",
          password: "plain-password",
        },
        request,
      ),
    ).rejects.toThrow(adminLoginRateLimitErrorCode);
  });

  it("clears failed login attempts after a successful authentication", async () => {
    mocks.findFirstUser.mockResolvedValue(adminUser);

    const request = {
      headers: {
        "x-forwarded-for": "203.0.113.20",
      },
    };

    mocks.comparePassword.mockResolvedValue(false);
    await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "wrong-password",
      },
      request,
    );

    mocks.comparePassword.mockResolvedValue(true);
    const result = await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "plain-password",
      },
      request,
    );

    expect(result?.id).toBe(adminUser.id);
  });

  it("writes audit logs for failed and successful authentications", async () => {
    mocks.findFirstUser.mockResolvedValue(adminUser);

    const request = {
      headers: {
        "user-agent": "Vitest",
        "x-forwarded-for": "203.0.113.30",
      },
    };

    mocks.comparePassword.mockResolvedValue(false);
    await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "wrong-password",
      },
      request,
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

    mocks.comparePassword.mockResolvedValue(true);
    await authorizeAdminCredentials(
      {
        identifier: "admin@example.com",
        password: "plain-password",
      },
      request,
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
