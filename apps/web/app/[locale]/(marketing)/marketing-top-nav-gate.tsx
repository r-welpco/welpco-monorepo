"use client";

import { usePathname } from "@/i18n/navigation";
import { isMarketingHome } from "@/i18n/path-utils";
import { TopNav } from "@/components/features/marketing/shared/top-nav";

/**
 * Homepage uses `HeroImmersive` floating pill nav only — the sticky marketing bar
 * is not mounted on `/` or `/fr` so it never competes with the hero.
 */
export function MarketingTopNavGate() {
  const pathname = usePathname() ?? "/";
  if (isMarketingHome(pathname)) return null;
  return <TopNav />;
}
