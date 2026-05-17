import bcrypt from "bcryptjs";
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

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

export const authOptions: NextAuthOptions = {
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
      authorize: (credentials) => verifyAdminCredentials(credentials),
    }),
  ],
  session: {
    strategy: "jwt",
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
