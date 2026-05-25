import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      pseudo: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    pseudo: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    pseudo: string;
    role: UserRole;
  }
}
