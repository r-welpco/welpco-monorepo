"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "./section-header";
import { CategoryIcon, type CategoryIconName } from "./category-icon";

/**
 * CategoriesGrid — category cards with expandable sub-service lists.
 */

type Tone = "spring" | "yellow" | "mint" | "pink" | "lilac";

type CategoryKey =
  | "care"
  | "pet"
  | "learning"
  | "exterior"
  | "health"
  | "events"
  | "cleaning"
  | "homeHelp";

interface CategoryMeta {
  key: CategoryKey;
  tone: Tone;
  icon: CategoryIconName;
}

const CATEGORY_META: CategoryMeta[] = [
  { key: "care", tone: "spring", icon: "heart" },
  { key: "pet", tone: "yellow", icon: "paw" },
  { key: "learning", tone: "mint", icon: "book" },
  { key: "exterior", tone: "lilac", icon: "leaf" },
  { key: "health", tone: "spring", icon: "apple" },
  { key: "events", tone: "yellow", icon: "star" },
  { key: "cleaning", tone: "pink", icon: "home" },
  { key: "homeHelp", tone: "mint", icon: "plug" },
];

const TONE_BG: Record<Tone, string> = {
  spring: "var(--spring-soft)",
  yellow: "var(--pastel-yellow)",
  mint: "var(--mint)",
  pink: "var(--bubblegum)",
  lilac: "var(--lilac)",
};

export function CategoriesGrid() {
  const t = useTranslations("marketing.home.categories");

  const categories = CATEGORY_META.map((meta) => {
    const item = t.raw(`items.${meta.key}`) as { name: string; services: string[] };
    return { ...meta, name: item.name, services: item.services };
  });

  return (
    <section className="section" id="categories">
      <div className="container">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={
            <>
              {t("titleLine1")}
              <br />
              <span className="display-italic">{t("titleLine2")}</span>
            </>
          }
          subtitle={t("subtitle")}
        />
        <div
          data-grid="categories-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
            marginTop: 56,
          }}
        >
          {categories.map((cat) => (
            <CategoryCard key={cat.key} cat={cat} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  cat,
  t,
}: {
  cat: CategoryMeta & { name: string; services: string[] };
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const headingId = `category-${cat.key}-title`;
  const listId = `category-${cat.key}-services`;

  return (
    <article
      aria-labelledby={headingId}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        color: "var(--fg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: TONE_BG[cat.tone],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CategoryIcon name={cat.icon} color="var(--evergreen)" />
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={listId}
          aria-label={
            expanded
              ? t("hideServices", { name: cat.name })
              : t("showServices", { count: cat.services.length, name: cat.name })
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid var(--line)",
            background: expanded ? "var(--evergreen)" : "var(--bg-soft)",
            color: expanded ? "var(--cream)" : "var(--evergreen)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background 160ms ease, color 160ms ease",
          }}
        >
          {expanded ? (
            <Minus aria-hidden width={18} height={18} strokeWidth={2} />
          ) : (
            <Plus aria-hidden width={18} height={18} strokeWidth={2} />
          )}
        </button>
      </div>

      <div>
        <h3 id={headingId} style={{ fontSize: 28, margin: 0 }}>
          {cat.name}
        </h3>
      </div>

      {expanded ? (
        <ul
          id={listId}
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 8,
          }}
        >
          {cat.services.map((s) => (
            <li
              key={s}
              style={{
                fontSize: 14,
                color: "var(--fg-muted)",
                lineHeight: 1.45,
                paddingLeft: 14,
                position: "relative",
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: "0.55em",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  opacity: 0.85,
                }}
              />
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
