import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const sessionExpiredError = {
  status: "error",
  message: "Votre session a expiré. Reconnectez-vous pour continuer.",
} as const;

export function getAdminSession() {
  return getServerSession(authOptions);
}
