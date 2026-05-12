import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Container } from "@welpco/ui/container";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Grid } from "@welpco/ui/grid";
import { ChevronLeft } from "lucide-react";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { mdxComponents } from "@/components/features/marketing/mdx-components";
import indexStyles from "../blog.module.css";
import styles from "./post.module.css";

/**
 * /blog/[slug] — Direction D, warm community.
 *
 * Server component. Renders the post's MDX body via `<MDXRemote>` with the
 * Fraunces-serif typed component map. `remarkGfm` enables GFM (autolinks,
 * tables, strikethrough). All slugs are pre-rendered at build time via
 * `generateStaticParams`.
 */

interface RouteParams {
  slug: string;
}

interface PageProps {
  params: Promise<RouteParams>;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return { title: "Welpco — Blog" };
  }
  return {
    title: `${post.meta.title} — Welpco`,
    description: post.meta.excerpt,
    openGraph: {
      title: post.meta.title,
      description: post.meta.excerpt,
      type: "article",
      publishedTime: post.meta.publishedAt,
      authors: [post.meta.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(slug, 2);

  return (
    <main>
      <article className={styles.article}>
        <Container size="2" px={{ initial: "4", sm: "6" }} py={{ initial: "8", md: "9" }}>
          {/* Back link */}
          <Box mb="6">
            <Link href="/blog" className={styles.backLink}>
              <ChevronLeft aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
              <span>Blog</span>
            </Link>
          </Box>

          <span className={styles.categoryPill}>{post.meta.category}</span>
          <Heading
            as="h1"
            size={{ initial: "7", md: "8" }}
            weight="regular"
            mt="3"
            className={styles.title}
          >
            {post.meta.title}
          </Heading>

          <Box mt="4">
            <Text size="1" color="gray" highContrast className={styles.byline}>
              {post.meta.author.name} · {formatDate(post.meta.publishedAt)} · {post.meta.readingTimeMinutes}m read
            </Text>
          </Box>

          <Box className={styles.rule} aria-hidden="true" />

          <Box className={styles.content}>
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                },
              }}
            />
          </Box>

          <Box className={styles.rule} aria-hidden="true" />

          {/* More posts */}
          {related.length > 0 && (
            <Box mt="6">
              <span className={styles.morePostsLabel}>More posts</span>
              <Box mt="4">
                <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                  {related.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={indexStyles.card}
                    >
                      <article>
                        <span className={indexStyles.categoryPill}>
                          {post.category}
                        </span>
                        <Heading
                          as="h2"
                          size="4"
                          weight="medium"
                          mt="3"
                          className={indexStyles.cardTitle}
                        >
                          {post.title}
                        </Heading>
                        <Box mt="2">
                          <Text size="2" color="gray" highContrast>
                            {post.excerpt}
                          </Text>
                        </Box>
                      </article>
                    </Link>
                  ))}
                </Grid>
              </Box>
            </Box>
          )}
        </Container>
      </article>
    </main>
  );
}
