/**
 * Расширение типов Auth.js: роль и данные профиля в JWT и сессии.
 */
import type { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      username: string | null;
      premiumUntil: string | null;
      totpEnabled: boolean;
      minecraftUsername: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    username?: string | null;
    premiumUntil?: string | null;
    totpEnabled?: boolean;
    minecraftUsername?: string | null;
    roleFetchedAt?: number;
  }
}
