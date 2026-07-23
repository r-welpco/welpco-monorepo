import {
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  LifeBuoy,
  MessagesSquare,
  Receipt,
  Search,
  Shield,
  Star,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * JSON `icon` keys (from `messages/*.json` → `auth.register.eduPanel.sets.*`)
 * mapped to lucide components. Unknown keys fall back to the shield so a
 * missing translation entry never crashes the panel.
 */
export const EDU_SLIDE_ICONS: Record<string, LucideIcon> = {
  "badge-check": BadgeCheck,
  "calendar-check": CalendarCheck,
  "credit-card": CreditCard,
  "life-buoy": LifeBuoy,
  messages: MessagesSquare,
  receipt: Receipt,
  search: Search,
  shield: Shield,
  star: Star,
  store: Store,
  wallet: Wallet,
};

export const EDU_SLIDE_FALLBACK_ICON: LucideIcon = Shield;
