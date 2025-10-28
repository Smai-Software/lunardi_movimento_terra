"use client";

import { Building2, Forklift, HardHat, Home, Users } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

interface NavigationItemProps {
  href: string & Route;
  iconName: "home" | "building2" | "hardhat" | "forklift" | "users";
  children: React.ReactNode;
  className?: string;
}

const iconMap = {
  home: Home,
  building2: Building2,
  hardhat: HardHat,
  forklift: Forklift,
  users: Users,
};

export default function NavigationItem({
  href,
  iconName,
  children,
  className = "",
}: NavigationItemProps) {
  const pathname = usePathname();
  const isActive =
    href === "/admin" ? pathname === href : pathname.startsWith(href);
  const Icon = iconMap[iconName];

  return (
    <li>
      <Link
        href={href}
        className={`hover:bg-base-300 rounded-md flex items-center gap-2 ${
          isActive ? "bg-base-300 text-primary-content" : ""
        } ${className}`}
      >
        <Icon className="size-6" />
        {children}
      </Link>
    </li>
  );
}
