import { SectionHeader } from "./section-header";
import { CategoryIcon, type CategoryIconName } from "./category-icon";

/**
 * CategoriesGrid — 8 cards in a 4-col grid.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx`
 * `CATEGORIES` + `CategoriesGrid` + `CategoryCard`. The 8 categories with
 * their service lists are the bundle's verbatim arrays.
 *
 * Cards are informational only (no navigation).
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
  { key: "care", name: "Care", tone: "spring", services: ["Babysitter", "Child care", "Elderly care", "Special needs"], icon: "heart" },
  { key: "pet", name: "Pet care", tone: "yellow", services: ["Dog walks", "Pet grooming", "Aquarium care", "Dog training"], icon: "paw" },
  { key: "edu", name: "Education", tone: "mint", services: ["Tutoring", "Music lessons"], icon: "book" },
  { key: "home", name: "In-home", tone: "pink", services: ["Housekeeping", "Painting", "Organizing", "Moving", "Furniture assembly", "Smart-TV setup"], icon: "home" },
  { key: "ext", name: "Exterior", tone: "lilac", services: ["Lawn-mowing", "Gardening", "Snow removal", "Window cleaning", "Gutter cleaning"], icon: "leaf" },
  { key: "health", name: "Health & wellness", tone: "spring", services: ["Meal prep", "Personal trainer", "Dietician", "Nutritionist"], icon: "apple" },
  { key: "fun", name: "Entertainment", tone: "yellow", services: ["Catering", "Party-planning", "Magician", "Bartender", "Server"], icon: "star" },
  { key: "tech", name: "Tech help", tone: "mint", services: ["Smart home setup", "TV mounting", "Installations"], icon: "plug" },
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
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.key} cat={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const headingId = `category-${cat.key}-title`;
  return (
    <article
      aria-labelledby={headingId}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 24,
        minHeight: 280,
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--fg-faint)",
            textTransform: "uppercase",
          }}
        >
          0{index + 1}
        </div>
        <h3 id={headingId} style={{ fontSize: 28, marginTop: 6, marginBottom: 0 }}>
          {cat.name}
        </h3>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "14px 0 0",
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
      </div>
    </article>
  );
}
