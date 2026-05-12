import type { ComponentProps, ReactNode } from "react";
import NextLink from "next/link";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Link } from "@welpco/ui/link";
import { Code } from "@welpco/ui/code";
import { Callout } from "@radix-ui/themes";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import styles from "./mdx-components.module.css";

/**
 * Typed MDX component map for `<MDXRemote components={...}>`.
 *
 * Direction D — warm community. Headings render in Fraunces serif via the
 * `.serifHeading` utility class colocated in the CSS module; body copy stays
 * in Geist sans through the Radix `<Text>` primitive.
 *
 * Mapping decisions:
 *   - `# h1` in body → demoted to `<Heading as="h2" size="7">` (Fraunces 400)
 *     so the page keeps a single h1 (the post title rendered by the route).
 *   - `## h2` → `<Heading as="h2" size="6">` (Fraunces 500).
 *   - `### h3` → `<Heading as="h3" size="5">` (Fraunces 500).
 *   - Body text uses Radix primitives — no inline `lineHeight`.
 *   - `<a>` is wrapped in `next/link` for internal hrefs to keep client-side
 *     nav working through MDX content.
 */

type AnchorProps = ComponentProps<"a">;
type ParagraphProps = ComponentProps<"p">;
type ListProps = ComponentProps<"ul">;
type OrderedListProps = ComponentProps<"ol">;
type ListItemProps = ComponentProps<"li">;
type BlockquoteProps = ComponentProps<"blockquote">;
type CodeProps = ComponentProps<"code">;
type PreProps = ComponentProps<"pre">;
type HeadingTagProps = ComponentProps<"h1">;

function isInternalHref(href: string | undefined): href is string {
  if (!href) return false;
  return href.startsWith("/") || href.startsWith("#");
}

export const mdxComponents = {
  h1: ({ children, id }: HeadingTagProps) => (
    <Heading
      as="h2"
      size="7"
      weight="regular"
      mt="6"
      mb="3"
      id={id}
      className={styles.serifHeading}
    >
      {children as ReactNode}
    </Heading>
  ),
  h2: ({ children, id }: HeadingTagProps) => (
    <Heading
      as="h2"
      size="6"
      weight="medium"
      mt="6"
      mb="3"
      id={id}
      className={styles.serifHeading}
    >
      {children as ReactNode}
    </Heading>
  ),
  h3: ({ children, id }: HeadingTagProps) => (
    <Heading
      as="h3"
      size="5"
      weight="medium"
      mt="5"
      mb="2"
      id={id}
      className={styles.serifHeading}
    >
      {children as ReactNode}
    </Heading>
  ),
  p: ({ children }: ParagraphProps) => (
    <Text as="p" size="3" mb="3" color="gray" highContrast>
      {children as ReactNode}
    </Text>
  ),
  a: ({ href, children }: AnchorProps) => {
    if (isInternalHref(href)) {
      return (
        <Link asChild color={SEMANTIC_COLOR.primary} underline="hover">
          <NextLink href={href}>{children as ReactNode}</NextLink>
        </Link>
      );
    }
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        color={SEMANTIC_COLOR.primary}
        underline="hover"
      >
        {children as ReactNode}
      </Link>
    );
  },
  ul: ({ children }: ListProps) => (
    <ul className={styles.list}>{children as ReactNode}</ul>
  ),
  ol: ({ children }: OrderedListProps) => (
    <ol className={styles.list}>{children as ReactNode}</ol>
  ),
  li: ({ children }: ListItemProps) => (
    <li className={styles.listItem}>
      <Text as="span" size="3" color="gray" highContrast>
        {children as ReactNode}
      </Text>
    </li>
  ),
  blockquote: ({ children }: BlockquoteProps) => (
    <Callout.Root color={SEMANTIC_COLOR.info} variant="surface" my="4">
      <Callout.Text>{children as ReactNode}</Callout.Text>
    </Callout.Root>
  ),
  code: ({ children }: CodeProps) => (
    <Code variant="soft">{children as ReactNode}</Code>
  ),
  pre: ({ children }: PreProps) => (
    <pre className={styles.pre}>{children as ReactNode}</pre>
  ),
};
