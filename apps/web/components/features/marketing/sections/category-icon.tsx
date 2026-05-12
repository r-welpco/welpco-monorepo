/**
 * CategoryIcon — 8 inline SVGs (heart / paw / book / home / leaf / apple /
 * star / plug). Ported byte-for-byte from
 * `.design-reference/project/components/sections.jsx` `CategoryIcon`.
 */

export type CategoryIconName =
  | "heart"
  | "paw"
  | "book"
  | "home"
  | "leaf"
  | "apple"
  | "star"
  | "plug";

interface CategoryIconProps {
  name: CategoryIconName;
  color?: string;
}

export function CategoryIcon({ name, color = "currentColor" }: CategoryIconProps) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 22 22",
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "heart":
      return (
        <svg {...common}>
          <path d="M11 18s-6-4-6-9a3.5 3.5 0 0 1 6-2.5A3.5 3.5 0 0 1 17 9c0 5-6 9-6 9z" />
        </svg>
      );
    case "paw":
      return (
        <svg {...common}>
          <circle cx="6" cy="9" r="1.6" />
          <circle cx="11" cy="6" r="1.6" />
          <circle cx="16" cy="9" r="1.6" />
          <path d="M7.5 14.5C7.5 12.6 9 11 11 11s3.5 1.6 3.5 3.5S13 18 11 18s-3.5-1.6-3.5-3.5z" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5c2 0 4 .5 7 2 3-1.5 5-2 7-2v12c-2 0-4 .5-7 2-3-1.5-5-2-7-2V5zM11 7v12" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10l7-6 7 6v8H4v-8z" />
          <path d="M9 18v-5h4v5" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 17C5 9 11 4 18 4c0 7-5 13-13 13zM5 17c2-3 4-5 7-7" />
        </svg>
      );
    case "apple":
      return (
        <svg {...common}>
          <path d="M11 7c-1-3 1-5 4-4-2 1-3 2-3 4M6 11c0-3 2.5-4.5 5-4 2.5-.5 5 1 5 4 0 4-2 7-5 7s-5-3-5-7z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M11 3l2.5 5L19 9l-4 4 1 5.5-5-2.5L6 18.5 7 13 3 9l5.5-1z" />
        </svg>
      );
    case "plug":
      return (
        <svg {...common}>
          <path d="M8 3v4M14 3v4M6 7h10v4a5 5 0 0 1-10 0V7zM11 16v3" />
        </svg>
      );
    default:
      return null;
  }
}
