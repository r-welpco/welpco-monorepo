import { getTranslations } from "next-intl/server";
import { Container } from "@welpco/ui/container";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import styles from "@/app/(marketing)/legal/legal.module.css";

type PrivacySection = {
  numeral: string;
  id?: string;
  title: string;
  intro?: string;
  list?: string[];
  paragraphs?: string[];
  contactEmail?: boolean;
  companyLine?: string;
};

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className={styles.sectionList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SectionBody({ section }: { section: PrivacySection }) {
  return (
    <>
      {section.intro ? <p>{section.intro}</p> : null}
      {section.list && section.list.length > 0 ? <LegalList items={section.list} /> : null}
      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
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

export async function PrivacyPageContent() {
  const t = await getTranslations("marketing.legal.privacy");
  const sections = t.raw("sections") as PrivacySection[];

  return (
    <main>
      <Container size="2" px={{ initial: "4", sm: "6" }} py={{ initial: "8", md: "9" }}>
        <Heading
          as="h1"
          size={{ initial: "7", md: "8" }}
          weight="regular"
          className={styles.heroHeadline}
        >
          {t("hero.title")}
        </Heading>
        <Box style={{ maxWidth: "60ch" }} mt="3" mb="7">
          <Text as="p" size="3" color="gray" highContrast>
            {t("hero.subtitle")}
          </Text>
        </Box>

        <Box className={styles.sections}>
          {sections.map((section) => (
            <Box key={section.numeral} id={section.id} className={styles.section}>
              <span className={styles.sectionNumeral}>{section.numeral}</span>
              <Heading as="h2" size="5" weight="medium" mt="2" className={styles.sectionTitle}>
                {section.title}
              </Heading>
              <Box mt="2" className={styles.sectionBody} style={{ maxWidth: "65ch" }}>
                <SectionBody section={section} />
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </main>
  );
}
