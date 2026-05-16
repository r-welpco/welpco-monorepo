"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALES = ["en", "fr"] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("marketing.languageSwitcher");

  return (
    <div
      className={className}
      role="group"
      aria-label="Language"
      style={{
        display: "inline-flex",
        gap: 4,
        alignItems: "center",
        padding: 3,
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "var(--pill-bg)",
      }}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => router.replace(pathname, { locale: code })}
          aria-label={code === "en" ? t("english") : t("french")}
          aria-pressed={locale === code}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: locale === code ? 600 : 400,
            letterSpacing: "0.06em",
            cursor: "pointer",
            background: locale === code ? "var(--fg)" : "transparent",
            color: locale === code ? "var(--bg)" : "var(--fg-muted)",
            transition: "background 160ms ease, color 160ms ease",
          }}
        >
          {code === "en" ? t("en") : t("fr")}
        </button>
      ))}
    </div>
  );
}
