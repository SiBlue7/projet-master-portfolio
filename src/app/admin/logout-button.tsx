"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import styles from "./page.module.css";

const loginRedirectPath = "/admin/login";

export function LogoutButton() {
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
      className={styles.logoutButton}
      type="button"
      disabled={isSigningOut}
      onClick={handleSignOut}
    >
      {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
