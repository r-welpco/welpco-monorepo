import { stripLocale } from "./locale-routes";

/** Whether the pathname is the localized marketing homepage. */
export function isMarketingHome(pathname: string): boolean {
  const path = stripLocale(pathname);
  return path === "/" || path === "";
}

/** Active state for marketing nav links (locale-stripped). */
export function isMarketingNavActive(pathname: string, href: string): boolean {
  const path = stripLocale(pathname);
  if (href === "/") return path === "/" || path === "";
  return path === href || path.startsWith(`${href}/`);
}
