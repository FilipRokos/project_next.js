"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Načítám session...</p>;
  }

  if (!session) {
    return (
        <button onClick={() => signIn("google")}>
          Sign in with Google
        </button>
    );
  }

  return (
      <>
        <p>Přihlášen jako {session.user?.email}</p>
        <button onClick={() => signOut()}>Odhlásit</button>
      </>
  );
}
