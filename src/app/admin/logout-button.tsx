"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import styles from "./page.module.css";

const loginRedirectPath = "/admin/login";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut({
        callbackUrl: loginRedirectPath,
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      className={className ?? styles.logoutButton}
      type="button"
      disabled={isSigningOut}
      onClick={handleSignOut}
    >
      {isSigningOut ? "exit…" : "exit"}
    </button>
  );
}
