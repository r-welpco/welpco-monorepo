"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { SectionHeader } from "./section-header";
import { CategoryIcon, type CategoryIconName } from "./category-icon";

/**
 * CategoriesGrid — category cards with expandable sub-service lists.
 */

type Tone = "spring" | "yellow" | "mint" | "pink" | "lilac";

interface Category {
  key: string;
  name: string;
  tone: Tone;
  services: string[];
  icon: CategoryIconName;
}

const CATEGORIES: Category[] = [
  {
    key: "care",
    name: "Care",
    tone: "spring",
    icon: "heart",
    services: ["Babysitter", "Child care", "Elderly care", "Special needs"],
  },
  {
    key: "pet",
    name: "Pet care",
    tone: "yellow",
    icon: "paw",
    services: [
      "Dog walks",
      "Pet grooming",
      "Pet sitting",
      "Aquarium and terrarium cleaning/maintenance",
      "Dog training",
    ],
  },
  {
    key: "learning",
    name: "Learning & Lessons",
    tone: "mint",
    icon: "book",
    services: ["Tutoring", "Music lessons", "Cooking lessons", "Swimming lessons"],
  },
  {
    key: "exterior",
    name: "Exterior maintenance",
    tone: "lilac",
    icon: "leaf",
    services: [
      "Lawn-mowing",
      "Tree-planting",
      "Gardening",
      "Car washing",
      "Gutter cleaning",
      "Window cleaning",
      "Exterior property cleaning",
      "Snow removal",
      "Pool opening/closing",
      "Leaf cleanup",
      "Summer/winter preparation",
    ],
  },
  {
    key: "health",
    name: "Health and wellness",
    tone: "spring",
    icon: "apple",
    services: ["Meal preparation", "Personal trainer", "Wellness support", "Nutritionist"],
  },
  {
    key: "events",
    name: "Events & Hospitality",
    tone: "yellow",
    icon: "star",
    services: ["Catering help", "Bartending", "Serving", "Party assistance", "Entertainer"],
  },
  {
    key: "cleaning",
    name: "Home Cleaning",
    tone: "pink",
    icon: "home",
    services: [
      "Housekeeping",
      "Deep cleaning",
      "Organizing",
      "Laundry",
      "Move-in/move-out cleaning",
    ],
  },
  {
    key: "home-help",
    name: "Home Help",
    tone: "mint",
    icon: "plug",
    services: [
      "Furniture assembly",
      "TV & shelf mounting",
      "Smart home setup",
      "Small repairs",
      "Appliance installation",
      "Moving help",
      "Heavy lifting",
      "Home organization",
      "Painting touch-ups",
      "Picture hanging",
    ],
  },
];

const TONE_BG: Record<Tone, string> = {
  spring: "var(--spring-soft)",
  yellow: "var(--pastel-yellow)",
  mint: "var(--mint)",
  pink: "var(--bubblegum)",
  lilac: "var(--lilac)",
};

export function CategoriesGrid() {
  return (
    <section className="section" id="categories">
      <div className="container">
        <SectionHeader
          eyebrow="Categories"
          title={
            <>
              Eight categories.
              <br />
              <span className="display-italic">Hundreds of services.</span>
            </>
          }
          subtitle="Examples of services Welpers offer within each category."
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
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.key} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ cat }: { cat: Category }) {
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
              ? `Hide services in ${cat.name}`
              : `Show ${cat.services.length} services in ${cat.name}`
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
