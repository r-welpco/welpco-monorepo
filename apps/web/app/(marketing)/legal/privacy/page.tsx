import type { Metadata } from "next";
import { Container } from "@welpco/ui/container";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Callout } from "@radix-ui/themes";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import styles from "../legal.module.css";

/**
 * /legal/privacy — placeholder privacy policy skeleton.
 *
 * 8 sections (Data we collect, How we use it, Sharing, Cookies, Data
 * retention, Your rights, Children's privacy, Contact). The amber Callout at
 * the top makes the placeholder status honest. The /legal/privacy#cookies
 * anchor is referenced from the marketing footer.
 */

export const metadata: Metadata = {
  title: "Welpco — Privacy Policy",
  description: "Welpco privacy policy.",
};

interface Section {
  numeral: string;
  id?: string;
  title: string;
  body: React.ReactNode;
}

const sections: Section[] = [
  {
    numeral: "01",
    title: "Data we collect",
    body: (
      <>
        We collect the information you give us when you create an account
        (name, email, phone, address), the information needed to verify your
        identity (a government-issued ID for Welpers), and the data generated
        when you use Welpco (bookings, messages, reports). We also log basic
        device and browser information for security and debugging.
      </>
    ),
  },
  {
    numeral: "02",
    title: "How we use it",
    body: (
      <>
        We use the data to run the service: matching you with neighbors,
        processing payments, verifying identity, and replying to support
        requests. We don&rsquo;t sell your personal data to advertisers, and we
        don&rsquo;t use your messages or reports for advertising at all.
      </>
    ),
  },
  {
    numeral: "03",
    title: "Sharing",
    body: (
      <>
        Some data has to leave Welpco for the service to work &mdash; payment
        information goes to our payment processor, identity documents to our
        verification provider, transactional emails through our email provider.
        We use a small set of trusted vendors and require them to handle your
        data securely.
      </>
    ),
  },
  {
    numeral: "04",
    id: "cookies",
    title: "Cookies",
    body: (
      <>
        We use a minimal set of cookies: a session cookie so you stay signed
        in, a CSRF cookie for security, and (optionally) a preference cookie
        that remembers settings like dark mode. We don&rsquo;t use third-party
        advertising cookies. The cookie disclosure on first visit lets you
        accept or decline non-essential cookies.
      </>
    ),
  },
  {
    numeral: "05",
    title: "Data retention",
    body: (
      <>
        We keep account data while your account is active and for a reasonable
        period after closure to satisfy legal and accounting obligations.
        Booking and payment records are retained as required by tax law.
        Verification documents are deleted on account closure unless we need
        them for a pending dispute.
      </>
    ),
  },
  {
    numeral: "06",
    title: "Your rights",
    body: (
      <>
        You can access, correct, export, or delete your account data from your
        account settings or by emailing us. Where applicable law gives you
        additional rights (e.g. GDPR or PIPEDA), we honor them.
      </>
    ),
  },
  {
    numeral: "07",
    title: "Children&rsquo;s privacy",
    body: (
      <>
        Welpco is intended for adults. We don&rsquo;t knowingly collect data
        from children under the legal age of consent in your jurisdiction. If
        we learn we have, we delete it.
      </>
    ),
  },
  {
    numeral: "08",
    title: "Contact",
    body: (
      <>
        Questions about privacy? Email{" "}
        <a href="mailto:hello@welpco.com" className={styles.inlineLink}>
          hello@welpco.com
        </a>
        .
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main>
      <Container size="2" px={{ initial: "4", sm: "6" }} py={{ initial: "8", md: "9" }}>
        <Box mb="6">
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
            <Callout.Text>
              [REPLACE WITH LEGAL-REVIEWED COPY] &mdash; this is a placeholder
              privacy policy; the final version will be reviewed by counsel
              before launch.
            </Callout.Text>
          </Callout.Root>
        </Box>

        <Heading
          as="h1"
          size={{ initial: "7", md: "8" }}
          weight="regular"
          className={styles.heroHeadline}
        >
          Privacy policy.
        </Heading>
        <Box style={{ maxWidth: "60ch" }} mt="3" mb="7">
          <Text as="p" size="3" color="gray" highContrast>
            What we collect, why, and what you control. Plain words.
          </Text>
        </Box>

        <Box className={styles.sections}>
          {sections.map((section) => (
            <Box
              key={section.numeral}
              id={section.id}
              className={styles.section}
            >
              <span className={styles.sectionNumeral}>{section.numeral}</span>
              <Heading
                as="h2"
                size="5"
                weight="medium"
                mt="2"
                className={styles.sectionTitle}
              >
                {section.title}
              </Heading>
              <Box mt="2" style={{ maxWidth: "65ch" }}>
                <Text as="p" size="3" color="gray" highContrast>
                  {section.body}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </main>
  );
}
