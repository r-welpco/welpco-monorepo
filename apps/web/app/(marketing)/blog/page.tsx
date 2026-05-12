import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@welpco/ui/container";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Grid } from "@welpco/ui/grid";
import { getAllPosts } from "@/lib/blog";
import styles from "./blog.module.css";

/**
 * /blog — Direction D, warm community.
 *
 * Server component; reads the filesystem at build time. Cards are full-bleed
 * `<Link>`s with warm cream fill, warm soft-shadow chrome, and a sage
 * category pill. The post body is not loaded here — only the typed metadata.
 */

export const metadata: Metadata = {
  title: "Welpco — Blog",
  description: "Notes from the team at Welpco — product, trust, and how we got here.",
  openGraph: {
    title: "Welpco — Blog",
    description: "Notes from the team at Welpco.",
    type: "website",
  },
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <main>
      {/* Hero strip */}
      <section className={styles.hero}>
        <Container size="3" px={{ initial: "4", sm: "6" }} py={{ initial: "9", md: "9" }}>
          <Heading
            as="h1"
            size={{ initial: "7", md: "8" }}
            weight="regular"
            className={styles.heroHeadline}
          >
            Notes from the team.
          </Heading>
          <Box style={{ maxWidth: "60ch" }} mt="4">
            <Text as="p" size={{ initial: "3", md: "4" }} color="gray" highContrast>
              Why we&rsquo;re building Welpco, what trust means in practice, and
              what we&rsquo;ve decided to do differently.
            </Text>
          </Box>
        </Container>
      </section>

      {/* Post grid */}
      <section className={styles.list} aria-labelledby="blog-list-heading">
        <Container size="3" px={{ initial: "4", sm: "6" }} py={{ initial: "8", md: "9" }}>
          <span id="blog-list-heading" className={styles.srOnly}>
            Posts
          </span>
          {posts.length === 0 ? (
            <Box>
              <Text as="p" size="3" color="gray" highContrast>
                No posts yet. Check back soon.
              </Text>
            </Box>
          ) : (
            <Grid columns={{ initial: "1", md: "2" }} gap={{ initial: "4", md: "6" }}>
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={styles.card}
                >
                  <article>
                    <span className={styles.categoryPill}>{post.category}</span>
                    <Heading
                      as="h2"
                      size="5"
                      weight="medium"
                      mt="3"
                      className={styles.cardTitle}
                    >
                      {post.title}
                    </Heading>
                    <Box mt="2">
                      <Text size="3" color="gray" highContrast>
                        {post.excerpt}
                      </Text>
                    </Box>
                    <Box mt="4">
                      <Text size="1" color="gray" highContrast>
                        {post.author.name} · {formatDate(post.publishedAt)} · {post.readingTimeMinutes}m read
                      </Text>
                    </Box>
                  </article>
                </Link>
              ))}
            </Grid>
          )}
        </Container>
      </section>
    </main>
  );
}
