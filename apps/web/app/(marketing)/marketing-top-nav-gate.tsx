"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/features/marketing/shared/top-nav";

/**
 * Homepage uses `HeroImmersive` floating pill nav only — the sticky marketing bar
 * is not mounted on `/` so it never appears in the tree or competes with the hero.
 */
export function MarketingTopNavGate() {
  const pathname = usePathname() ?? "/";
  if (pathname === "/" || pathname === "") return null;
  return <TopNav />;
}
