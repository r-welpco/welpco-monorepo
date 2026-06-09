import { Container } from "@welpco/ui/container";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import styles from "@/app/(marketing)/legal/legal.module.css";
import type { LegalBlock, LegalPrivacySection, LegalTermsSection } from "@/lib/legal/types";

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className={styles.sectionList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function renderBlocks(blocks: LegalBlock[]) {
  return blocks.map((block, index) => {
    if (block.type === "paragraph") {
      return <p key={`p-${index}`}>{block.text}</p>;
    }
    if (block.type === "list") {
      return <LegalList key={`l-${index}`} items={block.items} />;
    }
    return (
      <Box key={block.id} className={styles.subsection} mt="4">
        <Heading as="h3" size="1" weight="medium" className={styles.subsectionTitle}>
          {block.title}
        </Heading>
        <Box mt="2" className={styles.sectionBody}>
          {renderBlocks(block.blocks)}
        </Box>
      </Box>
    );
  });
}

function PrivacySectionBody({ section }: { section: LegalPrivacySection }) {
  return (
    <>
      {section.intro ? <p>{section.intro}</p> : null}
      {section.list && section.list.length > 0 ? <LegalList items={section.list} /> : null}
      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 48)}>{p}</p>
      ))}
      {section.companyLine ? <p>{section.companyLine}</p> : null}
      {section.contactEmail ? (
        <p>
          <a href="mailto:support@welpco.com" className={styles.inlineLink}>
            support@welpco.com
          </a>
        </p>
      ) : null}
    </>
  );
}

export function LegalPrivacyDocumentView({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: LegalPrivacySection[];
}) {
  return (
    <main className={styles.legalPage}>
      <Container size="2" px={{ initial: "4", sm: "6" }} py={{ initial: "5", md: "6" }}>
        <header className={styles.pageHeader}>
          <Heading as="h1" size="3" weight="medium" className={styles.pageTitle}>
            {title}
          </Heading>
          <Text as="p" size="2" color="gray" className={styles.pageLead}>
            {subtitle}
          </Text>
        </header>

        <Box className={styles.sections}>
          {sections.map((section) => (
            <Box key={section.numeral} id={section.id} className={styles.section}>
              <span className={styles.sectionNumeral}>{section.numeral}</span>
              <Heading as="h2" size="2" weight="medium" mt="2" className={styles.sectionTitle}>
                {section.title}
              </Heading>
              <Box mt="2" className={styles.sectionBody}>
                <PrivacySectionBody section={section} />
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </main>
  );
}

export function LegalPolicyDocumentView({
  title,
  subtitle,
  paragraphs,
}: {
  title: string;
  subtitle?: string;
  paragraphs: string[];
}) {
  return (
    <main className={styles.legalPage}>
      <Container size="2" px={{ initial: "4", sm: "6" }} py={{ initial: "5", md: "6" }}>
        <header className={styles.pageHeader}>
          <Heading as="h1" size="3" weight="medium" className={styles.pageTitle}>
            {title}
          </Heading>
          {subtitle ? (
            <Text as="p" size="2" color="gray" className={styles.pageLead}>
              {subtitle}
            </Text>
          ) : null}
        </header>

        <Box className={styles.sectionBody}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </Box>
      </Container>
    </main>
  );
}

export function LegalTermsDocumentView({
  title,
  lastUpdated,
  notice,
  intro,
  sections,
}: {
  title: string;
  lastUpdated?: string;
  notice?: string;
  intro?: string;
  sections: LegalTermsSection[];
}) {
  return (
    <main className={styles.legalPage}>
      <Container size="2" px={{ initial: "4", sm: "6" }} py={{ initial: "5", md: "6" }}>
        <header className={styles.pageHeader}>
          <Heading as="h1" size="3" weight="medium" className={styles.pageTitle}>
            {title}
          </Heading>
          {lastUpdated ? (
            <Text as="p" size="1" color="gray" className={styles.lastUpdated}>
              {lastUpdated}
            </Text>
          ) : null}
          {intro ? (
            <Text as="p" size="2" color="gray" className={styles.pageLead}>
              {intro}
            </Text>
          ) : null}
          {notice ? (
            <Box className={styles.noticeBox} mt="3">
              <Text as="p" size="2" className={styles.noticeText}>
                {notice}
              </Text>
            </Box>
          ) : null}
        </header>

        <Box className={styles.sections}>
          {sections.map((section) => (
            <Box key={section.id} id={section.id} className={styles.section}>
              <span className={styles.sectionNumeral}>{section.numeral}</span>
              <Heading as="h2" size="2" weight="medium" mt="2" className={styles.sectionTitle}>
                {section.title}
              </Heading>
              <Box mt="2" className={styles.sectionBody}>
                {renderBlocks(section.blocks)}
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </main>
  );
}
