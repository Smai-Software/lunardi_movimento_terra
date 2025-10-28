"use client";

import { ListIcon, PlusIcon } from "lucide-react";
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
        className={`tab px-2 ${currentTab === "insert" ? "tab-active" : ""}`}
        href="/dashboard?tab=insert"
      >
        <PlusIcon className="size-4 mr-1" /> Inserisci Attività
      </Link>
      <Link
        role="tab"
        type="button"
        className={`tab px-2 ${currentTab === "list" ? "tab-active" : ""}`}
        href="/dashboard?tab=list"
      >
        <ListIcon className="size-4 mr-1" /> Le mie attività
      </Link>
    </div>
  );
}
