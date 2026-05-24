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
import { prisma } from "@/lib/prisma";

const adminLoginRateLimit = {
  blockDurationMs: 15 * 60 * 1000,
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000,
} as const;

const optionalCredential = z.string().trim().optional();

const adminCredentialsSchema = z
  .object({
    identifier: optionalCredential,
    pseudo: optionalCredential,
    email: optionalCredential,
    password: z.string().min(1),
  })
  .transform(({ email, identifier, password, pseudo }) => {
    const login = identifier || email || pseudo || "";

    return {
      login: login.includes("@") ? login.toLowerCase() : login,
      password,
    };
  })
  .refine(({ login }) => login.length > 0, {
    message: "Pseudo or email is required.",
    path: ["identifier"],
  });

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

type AuthDependencies = {
  findUserByLogin: (login: string) => Promise<AuthUserRecord | null>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;
};

type AuthRequestLike = {
  headers?: Headers | Record<string, string | string[] | undefined>;
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

const defaultAuthDependencies: AuthDependencies = {
  async findUserByLogin(login) {
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
  },
  comparePassword: (password, hash) => bcrypt.compare(password, hash),
};

function isHeadersInstance(
  headers: AuthRequestLike["headers"],
): headers is Headers {
  return typeof Headers !== "undefined" && headers instanceof Headers;
}

function getRequestHeader(request: AuthRequestLike | undefined, name: string) {
  const headers = request?.headers;

  if (!headers) {
    return null;
  }

  if (isHeadersInstance(headers)) {
    return headers.get(name);
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

function getLoginIdentifier(credentials: unknown) {
  if (!credentials || typeof credentials !== "object") {
    return "unknown";
  }

  const credentialRecord = credentials as Record<string, unknown>;
  const rawIdentifier =
    credentialRecord.identifier ??
    credentialRecord.email ??
    credentialRecord.pseudo ??
    "unknown";

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
  dependencies: AuthDependencies = defaultAuthDependencies,
): Promise<AuthenticatedAdmin | null> {
  const parsedCredentials = adminCredentialsSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    return null;
  }

  const { login, password } = parsedCredentials.data;
  const user = await dependencies.findUserByLogin(login);

  if (!user) {
    return null;
  }

  const isValidPassword = await dependencies.comparePassword(
    password,
    user.passwordHash,
  );

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
  dependencies: AuthDependencies = defaultAuthDependencies,
) {
  const rateLimitKey = getRateLimitKey(credentials, request);

  if (isLoginRateLimited(rateLimitKey)) {
    throw new Error(adminLoginRateLimitErrorCode);
  }

  const user = await verifyAdminCredentials(credentials, dependencies);

  if (!user) {
    const isBlocked = registerFailedLoginAttempt(rateLimitKey);

    if (isBlocked) {
      throw new Error(adminLoginRateLimitErrorCode);
    }

    return null;
  }

  clearLoginAttempts(rateLimitKey);

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
