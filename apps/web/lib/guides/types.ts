/**
 * Guide content model — bilingual onboarding guides (customer + welper),
 * mirrored from the official Welpco PDF guides. Content lives in
 * `content/guides/*.json`; section `id`s are stable across locales so
 * anchor deep-links work in both EN and FR.
 *
 * Shape notes:
 * - `hero` is deliberately compact (eyebrow + title + one subtitle line).
 *   The PDF's intro prose and its "Inside, you will find…" list live in
 *   `overview`, which renders as the first block of the content column and
 *   doubles as a visual table of contents.
 * - Every `overview.items[].sectionId` MUST match a `sections[].id` in the
 *   same document — the overview rows are in-page anchor links, and the
 *   renderer reads the target section's numeral to label each row.
 */

export type GuideCalloutVariant = "tip" | "important";

export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "callout"; variant: GuideCalloutVariant; text: string }
  | { type: "cta"; label: string; href: string };

export type GuideSection = {
  numeral: string;
  id: string;
  title: string;
  blocks: GuideBlock[];
};

export type GuideHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

/** One row of the overview / table of contents. `sectionId` is a section anchor. */
export type GuideOverviewItem = {
  label: string;
  sectionId: string;
};

export type GuideOverview = {
  /** Intro paragraphs, moved out of the hero. */
  intro: string[];
  /** Lead-in line above the linked items ("Inside, you will find…"). */
  tocLead: string;
  items: GuideOverviewItem[];
};

export type GuideSupport = {
  title: string;
  text: string;
  email: string;
  closing: string[];
  signature: string;
};

export type GuideDocument = {
  meta: { title: string; description: string };
  hero: GuideHero;
  overview: GuideOverview;
  sections: GuideSection[];
  support: GuideSupport;
};

export type GuideKind = "customer" | "welper";

/** Nav/TOC row derived from a document's sections — shared by the sidebar and the overview. */
export type GuideNavItem = {
  id: string;
  numeral: string;
  label: string;
};

/** Sidebar items: one row per section, labelled with the section title. */
export function toSectionNavItems(doc: GuideDocument): GuideNavItem[] {
  return doc.sections.map((section) => ({
    id: section.id,
    numeral: section.numeral,
    label: section.title,
  }));
}

/**
 * Overview items: the PDF's "Inside, you will find…" bullets, each resolved to
 * the numeral of the section it links to. Items pointing at an unknown section
 * id are dropped rather than rendered as dead anchors.
 *
 * Ordered by section position, NOT by the source bullet order: the numerals are
 * shown beside each row, and following the PDF's arbitrary bullet order made them
 * read 01 · 02 · 03 · 05 · 08 · 07 — which looks like a rendering bug. Ascending
 * numerals (with honest gaps for sections the bullets don't cover) scan correctly.
 * Duplicate bullets pointing at the same section collapse to one row.
 */
export function toOverviewNavItems(doc: GuideDocument): GuideNavItem[] {
  const orderById = new Map(doc.sections.map((s, index) => [s.id, index]));
  const numeralById = new Map(doc.sections.map((s) => [s.id, s.numeral]));
  const seen = new Set<string>();

  return doc.overview.items
    .flatMap((item) => {
      const numeral = numeralById.get(item.sectionId);
      if (!numeral || seen.has(item.sectionId)) return [];
      seen.add(item.sectionId);
      return [{ id: item.sectionId, numeral, label: item.label }];
    })
    .sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
}
