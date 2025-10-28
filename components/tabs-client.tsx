"use client";

import Link from "next/link";
import { useQueryState, parseAsStringLiteral } from "nuqs";

export function TabsClient({ tab: initialTab }: { tab: string }) {
  const [activeTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["insert", "list"]).withDefault("insert"),
  );

  const currentTab = activeTab || initialTab || "insert";

  return (
    <div role="tablist" className="tabs tabs-box">
      <Link
        role="tab"
        type="button"
        className={`tab ${currentTab === "insert" ? "tab-active" : ""}`}
        href="/dashboard?tab=insert"
      >
        Inserisci Attività
      </Link>
      <Link
        role="tab"
        type="button"
        className={`tab ${currentTab === "list" ? "tab-active" : ""}`}
        href="/dashboard?tab=list"
      >
        Attività Inserite
      </Link>
    </div>
  );
}
