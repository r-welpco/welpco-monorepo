"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Heading } from "@welpco/ui/heading";
import { Link } from "@welpco/ui/link";
import { Separator } from "@welpco/ui/separator";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Lightbulb,
  Mail,
} from "lucide-react";
import type { GuideBlock, GuideDocument, GuideSection } from "@/lib/guides/types";

/**
 * Offset used for scroll-spy + smooth-scroll anchoring. The dashboard shell has
 * a sticky header (56–60px) plus the desktop tab strip, so a section must clear
 * ~120px before it counts as "current".
 */
const SCROLL_OFFSET_PX = 128;
const SUPPORT_ANCHOR_ID = "support";

/**
 * Overview block — the marketing guide redesign moves the intro + table of
 * contents from `hero` into `overview`. Read it structurally so this page keeps
 * working against both the old (`hero.intro` / `hero.contents`) and the new
 * shape without a hard compile-time dependency on either.
 */
type GuideOverview = {
  intro: string[];
  tocLead: string;
  items: { label: string; sectionId: string }[];
};

function resolveOverview(document: GuideDocument): GuideOverview {
  const withOverview = document as unknown as { overview?: GuideOverview };
  if (withOverview.overview) return withOverview.overview;

  const legacyHero = document.hero as unknown as {
    intro?: string[];
    contentsLead?: string;
    contents?: string[];
  };
  const contents = legacyHero.contents ?? [];
  return {
    intro: legacyHero.intro ?? [],
    tocLead: legacyHero.contentsLead ?? "",
    items: contents.map((label, index) => ({
      label,
      sectionId: document.sections[index]?.id ?? document.sections[0]?.id ?? "",
    })),
  };
}

function resolveHeroSubtitle(document: GuideDocument): string | undefined {
  return (document.hero as unknown as { subtitle?: string }).subtitle;
}

/**
 * Guide CTAs are authored once for both surfaces. Marketing hrefs that have an
 * in-platform equivalent are remapped so an in-app CTA never bounces the user
 * out of the dashboard shell.
 */
const IN_APP_HREF: Record<string, string> = {
  "/search": "/dashboard/search",
  "/marketplace": "/dashboard/marketplace",
  "/bookings": "/dashboard/bookings",
  "/messages": "/dashboard/messages",
  "/profile": "/dashboard/profile",
  "/settings": "/dashboard/settings",
};

function toInAppHref(href: string): string {
  const [path, query] = href.split("?");
  const mapped = IN_APP_HREF[path ?? href];
  if (!mapped) return href;
  return query ? `${mapped}?${query}` : mapped;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface GuideReaderLabels {
  onThisPage: string;
  contents: string;
  backToTop: string;
}

export function GuideReader({
  document: guide,
  labels,
}: {
  document: GuideDocument;
  labels: GuideReaderLabels;
}) {
  const overview = useMemo(() => resolveOverview(guide), [guide]);
  const heroSubtitle = resolveHeroSubtitle(guide);
  const sections = guide.sections;

  const navItems = useMemo(
    () => [
      ...sections.map((section) => ({
        id: section.id,
        numeral: section.numeral,
        title: section.title,
      })),
      { id: SUPPORT_ANCHOR_ID, numeral: null, title: guide.support.title },
    ],
    [sections, guide.support.title],
  );

  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const visibleIds = useRef<Set<string>>(new Set());

  // Scroll-spy: track which anchored blocks are inside the reading band and
  // highlight the first one in document order.
  useEffect(() => {
    const ids = navItems.map((item) => item.id);
    visibleIds.current = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleIds.current.add(entry.target.id);
          else visibleIds.current.delete(entry.target.id);
        }
        const current = ids.find((id) => visibleIds.current.has(id));
        if (current) setActiveId(current);
      },
      { rootMargin: `-${SCROLL_OFFSET_PX}px 0px -55% 0px`, threshold: 0 },
    );

    for (const id of ids) {
      const el = window.document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [navItems]);

  const jumpTo = useCallback((event: React.MouseEvent, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const el = window.document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    el.focus({ preventScroll: true });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }, []);

  return (
    <Grid
      columns={{ initial: "1", lg: "240px minmax(0, 1fr)" }}
      gap={{ initial: "4", lg: "7" }}
      align="start"
      width="100%"
    >
      {/* Desktop: sticky section nav */}
      <Box
        display={{ initial: "none", lg: "block" }}
        position="sticky"
        style={{ top: `${SCROLL_OFFSET_PX}px`, minWidth: 0 }}
      >
        <Text
          as="p"
          size="1"
          color="gray"
          highContrast
          weight="medium"
          mb="3"
          style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          {labels.onThisPage}
        </Text>
        <Flex asChild direction="column" gap="1">
          <nav aria-label={labels.onThisPage}>
            {navItems.map((item) => {
              const isActive = activeId === item.id;
              return (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  size="2"
                  underline="hover"
                  weight={isActive ? "medium" : "regular"}
                  color={isActive ? SEMANTIC_COLOR.primary : "gray"}
                  highContrast={isActive}
                  onClick={(event) => jumpTo(event, item.id)}
                  aria-current={isActive ? "true" : undefined}
                  style={{
                    display: "block",
                    padding: "var(--space-1) var(--space-2)",
                    borderLeft: `2px solid ${
                      isActive ? "var(--accent-9)" : "var(--gray-5)"
                    }`,
                  }}
                >
                  <Flex align="baseline" gap="2">
                    {item.numeral ? (
                      <Text size="1" color="gray">
                        {item.numeral}
                      </Text>
                    ) : null}
                    <Text size="2">{item.title}</Text>
                  </Flex>
                </Link>
              );
            })}
          </nav>
        </Flex>
      </Box>

      {/* Mobile: collapsed "Contents" disclosure above the content */}
      <Box display={{ initial: "block", lg: "none" }} width="100%">
        <Card size="2" variant="surface">
          <details>
            <summary style={{ cursor: "pointer", listStyle: "none" }}>
              <Flex align="center" justify="between" gap="2">
                <Text size="2" weight="medium">
                  {labels.contents}
                </Text>
                <ChevronDown size={16} aria-hidden="true" />
              </Flex>
            </summary>
            <Box mt="3">
              <Flex asChild direction="column" gap="2">
                <nav aria-label={labels.contents}>
                  {navItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      size="2"
                      color="gray"
                      highContrast
                      underline="hover"
                      onClick={(event) => jumpTo(event, item.id)}
                    >
                      <Flex align="baseline" gap="2">
                        {item.numeral ? (
                          <Text size="1" color="gray">
                            {item.numeral}
                          </Text>
                        ) : null}
                        <Text size="2">{item.title}</Text>
                      </Flex>
                    </Link>
                  ))}
                </nav>
              </Flex>
            </Box>
          </details>
        </Card>
      </Box>

      {/* Content column — readable measure */}
      <Box width="100%" style={{ minWidth: 0 }}>
        <Flex direction="column" gap="6" style={{ maxWidth: "70ch" }}>
          <Box>
            <Badge color={SEMANTIC_COLOR.primary} variant="soft" size="1" highContrast>
              {guide.hero.eyebrow}
            </Badge>
            <Heading as="h2" size="6" mt="3" mb="2" trim="start">
              {guide.hero.title}
            </Heading>
            {heroSubtitle ? (
              <Text as="p" size="3" color="gray" highContrast>
                {heroSubtitle}
              </Text>
            ) : null}
          </Box>

          <GuideOverviewCard overview={overview} sections={sections} onJump={jumpTo} />

          {sections.map((section) => (
            <GuideSectionBlock key={section.id} section={section} />
          ))}

          <Separator size="4" />

          <Box
            id={SUPPORT_ANCHOR_ID}
            tabIndex={-1}
            style={{ scrollMarginTop: `${SCROLL_OFFSET_PX}px`, outline: "none" }}
          >
            <Card size="3" variant="surface">
              <Flex direction="column" gap="3">
                <Heading as="h2" size="5" trim="start">
                  {guide.support.title}
                </Heading>
                <Text as="p" size="3" color="gray" highContrast>
                  {guide.support.text}
                </Text>
                <Flex align="center" gap="2">
                  <Mail size={16} aria-hidden="true" />
                  <Link
                    href={`mailto:${guide.support.email}`}
                    size="3"
                    weight="medium"
                    color={SEMANTIC_COLOR.primary}
                    highContrast
                  >
                    {guide.support.email}
                  </Link>
                </Flex>
                {guide.support.closing.map((line) => (
                  <Text key={line} as="p" size="3" color="gray" highContrast>
                    {line}
                  </Text>
                ))}
                <Text as="p" size="3" weight="medium">
                  {guide.support.signature}
                </Text>
              </Flex>
            </Card>
          </Box>

          <Box>
            <Link
              href="#top"
              size="2"
              color="gray"
              highContrast
              underline="hover"
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                window.scrollTo({
                  top: 0,
                  behavior: prefersReducedMotion() ? "auto" : "smooth",
                });
              }}
            >
              <Flex align="center" gap="2">
                <ArrowUp size={14} aria-hidden="true" />
                <Text size="2">{labels.backToTop}</Text>
              </Flex>
            </Link>
          </Box>
        </Flex>
      </Box>
    </Grid>
  );
}

function GuideOverviewCard({
  overview,
  sections,
  onJump,
}: {
  overview: GuideOverview;
  sections: GuideSection[];
  onJump: (event: React.MouseEvent, id: string) => void;
}) {
  const numeralBySectionId = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of sections) map.set(section.id, section.numeral);
    return map;
  }, [sections]);

  if (
    overview.intro.length === 0 &&
    overview.items.length === 0 &&
    !overview.tocLead
  ) {
    return null;
  }

  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="3">
        {overview.intro.map((paragraph) => (
          <Text key={paragraph} as="p" size="3" color="gray" highContrast>
            {paragraph}
          </Text>
        ))}
        {overview.tocLead ? (
          <Text as="p" size="3" weight="medium">
            {overview.tocLead}
          </Text>
        ) : null}
        {overview.items.length > 0 ? (
          <Flex direction="column" gap="2" mt="1">
            {overview.items.map((item) => (
              <Card key={`${item.sectionId}-${item.label}`} asChild size="1" variant="surface">
                <a
                  href={`#${item.sectionId}`}
                  onClick={(event) => onJump(event, item.sectionId)}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Flex align="center" justify="between" gap="3">
                    <Flex align="baseline" gap="3" style={{ minWidth: 0 }}>
                      <Text size="1" color="gray" weight="medium">
                        {numeralBySectionId.get(item.sectionId) ?? "—"}
                      </Text>
                      <Text size="2" weight="medium">
                        {item.label}
                      </Text>
                    </Flex>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      style={{ flexShrink: 0, color: "var(--accent-11)" }}
                    />
                  </Flex>
                </a>
              </Card>
            ))}
          </Flex>
        ) : null}
      </Flex>
    </Card>
  );
}

function GuideSectionBlock({ section }: { section: GuideSection }) {
  return (
    <Box
      id={section.id}
      tabIndex={-1}
      style={{ scrollMarginTop: `${SCROLL_OFFSET_PX}px`, outline: "none" }}
    >
      <Flex direction="column" gap="3">
        <Flex align="baseline" gap="3">
          <Text size="2" weight="bold" color={SEMANTIC_COLOR.primary}>
            {section.numeral}
          </Text>
          <Heading as="h2" size="5" trim="start">
            {section.title}
          </Heading>
        </Flex>
        {section.blocks.map((block, index) => (
          <GuideBlockView key={`${section.id}-${index}`} block={block} />
        ))}
      </Flex>
    </Box>
  );
}

function GuideBlockView({ block }: { block: GuideBlock }) {
  if (block.type === "paragraph") {
    return (
      <Text as="p" size="3" color="gray" highContrast>
        {block.text}
      </Text>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <Box asChild pl="5" m="0">
        <ListTag style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {block.items.map((item) => (
            <li key={item}>
              <Text size="3" color="gray" highContrast>
                {item}
              </Text>
            </li>
          ))}
        </ListTag>
      </Box>
    );
  }

  if (block.type === "callout") {
    // §17 semantics: a tip is helpful guidance (soft primary), an "important"
    // note is a consequence the user must not miss (warning/amber).
    const isTip = block.variant === "tip";
    return (
      <Callout.Root
        variant="soft"
        color={isTip ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.warning}
      >
        <Callout.Icon>
          {isTip ? (
            <Lightbulb size={16} aria-hidden="true" />
          ) : (
            <AlertTriangle size={16} aria-hidden="true" />
          )}
        </Callout.Icon>
        <Callout.Text>{block.text}</Callout.Text>
      </Callout.Root>
    );
  }

  const href = toInAppHref(block.href);
  const isExternal = /^(https?:|mailto:|tel:)/.test(href);

  return (
    <Box mt="1">
      <Button asChild size="3" color={SEMANTIC_COLOR.primary} highContrast>
        {isExternal ? (
          <a href={href}>{block.label}</a>
        ) : (
          <NextLink href={href}>{block.label}</NextLink>
        )}
      </Button>
    </Box>
  );
}
