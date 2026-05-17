import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import { verifyAdminCredentials } from "./auth";

const adminUser = {
  id: "admin-user-id",
  email: "admin@example.com",
  pseudo: "Admin",
  passwordHash: "hashed-password",
  role: UserRole.ADMIN,
};

describe("verifyAdminCredentials", () => {
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
});
