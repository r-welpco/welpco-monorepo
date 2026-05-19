import { Link } from "@/i18n/navigation";
import { SectionHeader } from "./section-header";
import { WelperCard } from "./welper-card";
import { ArrowDown } from "../shared/arrow-down";

/**
 * CommunitySpotlight — featured Welpers grid.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `CommunitySpotlight`.
 */

const WELPERS = [
  {
    name: "Maya R.",
    role: "Babysitter & tutor",
    imageSrc: "/marketing/welper-maya-r.jpg",
    tags: ["CPR-certified", "Speaks Spanish"],
    rating: 4.9,
    jobs: 142,
    area: "Greenpoint, BK",
  },
  {
    name: "Diego A.",
    role: "Lawn care · Snow removal",
    imageSrc: "/marketing/welper-diego-a.jpg",
    tags: ["Same-day", "Reliable"],
    rating: 5.0,
    jobs: 89,
    area: "Astoria, QNS",
  },
  {
    name: "Ines K.",
    role: "Meal prep · Catering",
    imageSrc: "/marketing/welper-ines-k.jpg",
    tags: ["Vegan options", "Big-batch"],
    rating: 4.8,
    jobs: 67,
    area: "Park Slope, BK",
  },
  {
    name: "Marcus T.",
    role: "Tech setup · TV mounting",
    imageSrc: "/marketing/welper-marcus-t.jpg",
    tags: ["Same-day", "Smart-home"],
    rating: 4.9,
    jobs: 113,
    area: "Long Island City",
  },
];

export function CommunitySpotlight() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader
          eyebrow="Featured Welpers"
          title={
            <>
              Service providers <span className="display-italic">in your area.</span>
            </>
          }
          subtitle="Vetted, rated, and ready to help — a sample of who’s active this week."
          cta={
            <Link href="/search" className="btn btn-ghost">
              Browse all Welpers <ArrowDown size={12} />
            </Link>
          }
        />
        <div
          data-grid="welper-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginTop: 56,
          }}
        >
          {WELPERS.map((w) => (
            <WelperCard key={w.name} {...w} />
          ))}
        </div>
      </div>
    </section>
  );
}
