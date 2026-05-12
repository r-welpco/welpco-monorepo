import type { Metadata } from "next";
import { Container } from "@welpco/ui/container";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Callout } from "@radix-ui/themes";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import styles from "../legal.module.css";

/**
 * /legal/terms — placeholder TOS skeleton.
 *
 * The structure is real (10 sections — Acceptance, Account, Listing,
 * Payment, Cancellations, Conduct, IP, Liability, Changes, Contact). The
 * copy is honest placeholder copy; the amber Callout at the top of the page
 * makes the legal status explicit. Final terms will be reviewed by counsel
 * before launch — see Day 6 Phase 2 follow-ups in AUDIT-LOG.md.
 */

export const metadata: Metadata = {
  title: "Welpco — Terms of Service",
  description: "Welpco terms of service.",
};

interface Section {
  numeral: string;
  title: string;
  body: React.ReactNode;
}

const sections: Section[] = [
  {
    numeral: "01",
    title: "Acceptance of these terms",
    body: (
      <>
        By using Welpco, you agree to these terms. If you don&rsquo;t agree, please
        don&rsquo;t use the service. Continued use of Welpco after changes to
        these terms means you accept the updated version.
      </>
    ),
  },
  {
    numeral: "02",
    title: "Account registration",
    body: (
      <>
        To use most features of Welpco, you need an account. You agree to
        provide accurate information about yourself and to keep that information
        up to date. You&rsquo;re responsible for the activity that happens on
        your account.
      </>
    ),
  },
  {
    numeral: "03",
    title: "Listing services (Welpers)",
    body: (
      <>
        If you&rsquo;re a Welper, you choose what services you offer, where, and
        what you charge. You&rsquo;re responsible for the accuracy of your
        listing. Welpco reviews listings before they go live and may decline or
        remove a listing that violates these terms or the platform guidelines.
      </>
    ),
  },
  {
    numeral: "04",
    title: "Payment terms",
    body: (
      <>
        Customers pay through Welpco. Welpco authorizes payment when a booking
        is made and captures it after the work is marked done. Welpco takes a
        flat fee per booking; the current fee is published on the
        &ldquo;For Welpers&rdquo; page.
      </>
    ),
  },
  {
    numeral: "05",
    title: "Cancellations and refunds",
    body: (
      <>
        Either party may cancel a booking before the work begins; the payment
        hold is released if the booking is cancelled before capture. After
        capture, refunds are handled through the report-a-problem flow on the
        booking page.
      </>
    ),
  },
  {
    numeral: "06",
    title: "User conduct",
    body: (
      <>
        Don&rsquo;t use Welpco to harass others, post misleading information,
        or do anything illegal. Welpco may suspend or terminate accounts that
        violate these terms or the community guidelines.
      </>
    ),
  },
  {
    numeral: "07",
    title: "Intellectual property",
    body: (
      <>
        The Welpco brand, software, and content are owned by Welpco. You retain
        ownership of the content you post; by posting it on Welpco, you grant
        Welpco a license to display and distribute it as part of the service.
      </>
    ),
  },
  {
    numeral: "08",
    title: "Liability",
    body: (
      <>
        Welpco facilitates introductions and payment between customers and
        Welpers. Welpco is not a party to the work performed and disclaims
        liability for the conduct of either party to the fullest extent
        permitted by law.
      </>
    ),
  },
  {
    numeral: "09",
    title: "Changes to these terms",
    body: (
      <>
        Welpco may update these terms from time to time. Material changes will
        be announced before they take effect. Continued use of Welpco after a
        change means you accept the updated terms.
      </>
    ),
  },
  {
    numeral: "10",
    title: "Contact",
    body: (
      <>
        Questions about these terms? Email{" "}
        <a href="mailto:hello@welpco.com" className={styles.inlineLink}>
          hello@welpco.com
        </a>
        .
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <main>
      <Container size="2" px={{ initial: "4", sm: "6" }} py={{ initial: "8", md: "9" }}>
        <Box mb="6">
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
            <Callout.Text>
              [REPLACE WITH LEGAL-REVIEWED COPY] &mdash; these are placeholder
              terms; final terms will be reviewed by counsel before launch.
            </Callout.Text>
          </Callout.Root>
        </Box>

        <Heading
          as="h1"
          size={{ initial: "7", md: "8" }}
          weight="regular"
          className={styles.heroHeadline}
        >
          Terms of service.
        </Heading>
        <Box style={{ maxWidth: "60ch" }} mt="3" mb="7">
          <Text as="p" size="3" color="gray" highContrast>
            These terms govern your use of Welpco. They&rsquo;re written in
            plain language; if anything is unclear, write to us.
          </Text>
        </Box>

        <Box className={styles.sections}>
          {sections.map((section) => (
            <Box key={section.numeral} className={styles.section}>
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
