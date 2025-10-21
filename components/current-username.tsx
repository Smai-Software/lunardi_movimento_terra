"use client";

import { createAuthClient } from "better-auth/react";

const { useSession } = createAuthClient();

export default function CurrentUsername() {
  const { data: session, isPending, error } = useSession();

  if (isPending || !session || !session.user || error) {
    return <div className="skeleton w-24 h-8"></div>;
  }
  return <div className="text-lg font-semibold ml-4">{session.user.name}</div>;
}
