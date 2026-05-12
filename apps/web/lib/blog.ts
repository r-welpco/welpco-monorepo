/**
 * Blog filesystem layer.
 *
 * Posts live in `apps/web/content/blog/*.mdx` as plain MDX files with YAML
 * frontmatter — see `2026-04-25-why-we-started-welpco.mdx` for the canonical
 * shape. This module reads them at build time (or on the server in dev),
 * parses the frontmatter, and exposes typed helpers for the routes.
 *
 * Why MDX-as-files (and not a CMS):
 * - Posts ship via PR review. The same review discipline that protects
 *   product copy applies to marketing copy.
 * - Zero runtime CMS dependency. No Sanity / Contentful auth at request time;
 *   the file exists or it doesn't.
 * - Content lives in the same repo as the code that styles it, so visual
 *   regressions and copy regressions get caught in the same code review.
 *
 * If/when we hit the limits of file-based posts (multi-author workflow,
 * scheduled publishing, asset management at scale), we revisit. Until then,
 * MDX in a folder is the right primitive.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogAuthor {
  name: string;
  /** Avatar URL — null when we don't have one yet (early posts). */
  avatarUrl: string | null;
}

export interface BlogPostMeta {
  title: string;
  slug: string;
  excerpt: string;
  /** ISO date string (YYYY-MM-DD). */
  publishedAt: string;
  author: BlogAuthor;
  category: string;
  /** Cover image URL — null when the post is text-only. */
  coverImage: string | null;
  /** Computed at read time from the post body. */
  readingTimeMinutes: number;
}

export interface BlogPost {
  meta: BlogPostMeta;
  /** Raw MDX body (frontmatter stripped). The route compiles this with `next-mdx-remote`. */
  content: string;
}

interface RawFrontmatter {
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  publishedAt?: unknown;
  author?: { name?: unknown; avatarUrl?: unknown } | unknown;
  category?: unknown;
  coverImage?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseFrontmatter(
  fileName: string,
  raw: RawFrontmatter,
  body: string,
): BlogPostMeta {
  if (typeof raw.title !== "string") {
    throw new Error(`[blog] ${fileName}: missing required string \`title\``);
  }
  if (typeof raw.slug !== "string") {
    throw new Error(`[blog] ${fileName}: missing required string \`slug\``);
  }
  if (typeof raw.excerpt !== "string") {
    throw new Error(`[blog] ${fileName}: missing required string \`excerpt\``);
  }
  if (typeof raw.publishedAt !== "string") {
    throw new Error(
      `[blog] ${fileName}: missing required string \`publishedAt\` (YYYY-MM-DD)`,
    );
  }
  if (typeof raw.category !== "string") {
    throw new Error(`[blog] ${fileName}: missing required string \`category\``);
  }
  const authorObj = isObject(raw.author) ? raw.author : null;
  const authorName =
    authorObj && typeof authorObj.name === "string"
      ? authorObj.name
      : "The Welpco team";
  const authorAvatar =
    authorObj && typeof authorObj.avatarUrl === "string"
      ? authorObj.avatarUrl
      : null;
  const coverImage =
    typeof raw.coverImage === "string" ? raw.coverImage : null;

  const stats = readingTime(body);

  return {
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
    author: { name: authorName, avatarUrl: authorAvatar },
    category: raw.category,
    coverImage,
    readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
  };
}

async function readPostFile(fileName: string): Promise<BlogPost> {
  const fullPath = path.join(BLOG_DIR, fileName);
  const raw = await readFile(fullPath, "utf8");
  const parsed = matter(raw);
  const meta = parseFrontmatter(
    fileName,
    parsed.data as RawFrontmatter,
    parsed.content,
  );
  return { meta, content: parsed.content };
}

/** Lists all posts, newest first by `publishedAt`. */
export async function getAllPosts(): Promise<BlogPostMeta[]> {
  let files: string[];
  try {
    files = await readdir(BLOG_DIR);
  } catch {
    return [];
  }
  const mdxFiles = files.filter((f) => f.endsWith(".mdx"));
  const posts = await Promise.all(
    mdxFiles.map(async (f) => (await readPostFile(f)).meta),
  );
  return posts.sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
}

/** Returns the post with the matching slug, or `null` if none exists. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  let files: string[];
  try {
    files = await readdir(BLOG_DIR);
  } catch {
    return null;
  }
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const post = await readPostFile(file);
    if (post.meta.slug === slug) {
      return post;
    }
  }
  return null;
}

/**
 * Returns up to `count` posts related to `currentSlug` — same category if
 * available, otherwise the newest posts excluding the current one.
 */
export async function getRelatedPosts(
  currentSlug: string,
  count = 2,
): Promise<BlogPostMeta[]> {
  const all = await getAllPosts();
  const current = all.find((p) => p.slug === currentSlug);
  const others = all.filter((p) => p.slug !== currentSlug);
  if (!current) return others.slice(0, count);

  const sameCategory = others.filter((p) => p.category === current.category);
  if (sameCategory.length >= count) return sameCategory.slice(0, count);

  // Fill the remainder with the newest posts not already included.
  const remainder = others.filter((p) => p.category !== current.category);
  return [...sameCategory, ...remainder].slice(0, count);
}
