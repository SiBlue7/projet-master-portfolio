import bcrypt from "bcryptjs";
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import type { UserRole } from "@/generated/prisma/client";
import {
  adminLoginRateLimitErrorCode,
  adminSessionMaxAgeSeconds,
  adminSessionUpdateAgeSeconds,
} from "@/lib/auth-security";
import { tryWriteAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const adminLoginRateLimit = {
  blockDurationMs: 15 * 60 * 1000,
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000,
} as const;

const adminCredentialsSchema = z
  .object({
    identifier: z.string().trim().min(1),
    password: z.string().min(1),
  })
  .transform(({ identifier, password }) => ({
    login: identifier.includes("@") ? identifier.toLowerCase() : identifier,
    password,
  }));

type AuthUserRecord = {
  id: string;
  email: string;
  pseudo: string;
  passwordHash: string;
  role: UserRole;
};

export type AuthenticatedAdmin = User & {
  id: string;
  email: string;
  pseudo: string;
  role: UserRole;
};

type AuthRequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
};

type LoginAttemptRecord = {
  attempts: number[];
  blockedUntil: number | null;
};

const loginAttempts = new Map<string, LoginAttemptRecord>();

const authUserSelect = {
  id: true,
  email: true,
  pseudo: true,
  passwordHash: true,
  role: true,
} as const;

async function findUserByLogin(login: string): Promise<AuthUserRecord | null> {
  const findByEmail = () =>
    prisma.user.findFirst({
      where: {
        email: {
          equals: login,
          mode: "insensitive",
        },
      },
      select: authUserSelect,
    });

  const findByPseudo = () =>
    prisma.user.findFirst({
      where: {
        pseudo: {
          equals: login,
          mode: "insensitive",
        },
      },
      select: authUserSelect,
    });

  return login.includes("@")
    ? ((await findByEmail()) ?? findByPseudo())
    : ((await findByPseudo()) ?? findByEmail());
}

function getRequestHeader(request: AuthRequestLike | undefined, name: string) {
  const headers = request?.headers;

  if (!headers) {
    return null;
  }

  const value = headers[name.toLowerCase()] ?? headers[name];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getRequestIp(request: AuthRequestLike | undefined) {
  const forwardedFor = getRequestHeader(request, "x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    getRequestHeader(request, "cf-connecting-ip") ??
    getRequestHeader(request, "x-real-ip") ??
    request?.socket?.remoteAddress ??
    "unknown"
  );
}

function getRequestUserAgent(request: AuthRequestLike | undefined) {
  return getRequestHeader(request, "user-agent");
}

function getLoginIdentifier(credentials: unknown) {
  if (!credentials || typeof credentials !== "object") {
    return "unknown";
  }

  const credentialRecord = credentials as Record<string, unknown>;
  const rawIdentifier = credentialRecord.identifier ?? "unknown";

  return String(rawIdentifier).trim().toLowerCase() || "unknown";
}

function getRateLimitKey(
  credentials: unknown,
  request: AuthRequestLike | undefined,
) {
  return `${getRequestIp(request)}:${getLoginIdentifier(credentials)}`;
}

function getFreshAttemptRecord(key: string, now: number) {
  const record = loginAttempts.get(key) ?? {
    attempts: [],
    blockedUntil: null,
  };
  const attempts = record.attempts.filter(
    (attemptedAt) => now - attemptedAt < adminLoginRateLimit.windowMs,
  );
  const blockedUntil =
    record.blockedUntil && record.blockedUntil > now
      ? record.blockedUntil
      : null;

  return {
    attempts,
    blockedUntil,
  };
}

function isLoginRateLimited(key: string) {
  const now = Date.now();
  const record = getFreshAttemptRecord(key, now);

  if (record.blockedUntil) {
    loginAttempts.set(key, record);
    return true;
  }

  if (record.attempts.length === 0) {
    loginAttempts.delete(key);
  } else {
    loginAttempts.set(key, record);
  }

  return false;
}

function registerFailedLoginAttempt(key: string) {
  const now = Date.now();
  const record = getFreshAttemptRecord(key, now);
  const attempts = [...record.attempts, now];
  const blockedUntil =
    attempts.length >= adminLoginRateLimit.maxAttempts
      ? now + adminLoginRateLimit.blockDurationMs
      : record.blockedUntil;

  loginAttempts.set(key, {
    attempts,
    blockedUntil,
  });

  return Boolean(blockedUntil && blockedUntil > now);
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

export function resetAdminLoginRateLimit() {
  loginAttempts.clear();
}

export async function verifyAdminCredentials(
  credentials: unknown,
): Promise<AuthenticatedAdmin | null> {
  const parsedCredentials = adminCredentialsSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    return null;
  }

  const { login, password } = parsedCredentials.data;
  const user = await findUserByLogin(login);

  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.pseudo,
    pseudo: user.pseudo,
    role: user.role,
  };
}

export async function authorizeAdminCredentials(
  credentials: unknown,
  request?: AuthRequestLike,
) {
  const rateLimitKey = getRateLimitKey(credentials, request);
  const identifier = getLoginIdentifier(credentials);
  const ipAddress = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  if (isLoginRateLimited(rateLimitKey)) {
    await tryWriteAuditLog({
      action: "LOGIN_FAILURE",
      entityType: "auth",
      ipAddress,
      metadata: {
        identifier,
        reason: "rate_limited",
      },
      status: "FAILURE",
      summary: "Tentative de connexion administrateur bloquée.",
      userAgent,
    });

    throw new Error(adminLoginRateLimitErrorCode);
  }

  const user = await verifyAdminCredentials(credentials);

  if (!user) {
    const isBlocked = registerFailedLoginAttempt(rateLimitKey);

    await tryWriteAuditLog({
      action: "LOGIN_FAILURE",
      entityType: "auth",
      ipAddress,
      metadata: {
        identifier,
        reason: isBlocked ? "rate_limit_started" : "invalid_credentials",
      },
      status: "FAILURE",
      summary: "Tentative de connexion administrateur échouée.",
      userAgent,
    });

    if (isBlocked) {
      throw new Error(adminLoginRateLimitErrorCode);
    }

    return null;
  }

  clearLoginAttempts(rateLimitKey);

  await tryWriteAuditLog({
    action: "LOGIN_SUCCESS",
    actor: {
      email: user.email,
      id: user.id,
      pseudo: user.pseudo,
    },
    entityId: user.id,
    entityType: "auth",
    ipAddress,
    metadata: {
      identifier,
    },
    summary: "Connexion administrateur réussie.",
    userAgent,
  });

  return user;
}

const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") ||
  process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        maxAge: adminSessionMaxAgeSeconds,
        path: "/",
        sameSite: "lax",
        secure: Boolean(useSecureCookies),
      },
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Identifiants administrateur",
      credentials: {
        identifier: { label: "Pseudo ou adresse e-mail", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: (credentials, request) =>
        authorizeAdminCredentials(credentials, request),
    }),
  ],
  jwt: {
    maxAge: adminSessionMaxAgeSeconds,
  },
  session: {
    maxAge: adminSessionMaxAgeSeconds,
    strategy: "jwt",
    updateAge: adminSessionUpdateAgeSeconds,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.pseudo = user.pseudo;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.pseudo = token.pseudo;
        session.user.role = token.role;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
