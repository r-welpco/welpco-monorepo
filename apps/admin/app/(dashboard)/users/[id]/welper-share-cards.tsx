import { Button, Card, Flex, Grid, Text } from "@welpco/ui";
import {
  buildShareCardUrl,
  shareCardFilename,
  type ShareCardFormat,
  type ShareCardLang,
} from "@/lib/web-app-url";

const CARD_FORMATS: Array<{ format: ShareCardFormat; label: string; width: number; height: number }> = [
  { format: "story", label: "Story", width: 1080, height: 1920 },
  { format: "square", label: "Square", width: 1080, height: 1080 },
  { format: "landscape", label: "Landscape", width: 1200, height: 630 },
];

const CARD_LANGS: Array<{ lang: ShareCardLang; label: string }> = [
  { lang: "en", label: "EN" },
  { lang: "fr", label: "FR" },
];

interface WelperShareCardsProps {
  welperId: string;
  personalized: boolean;
}

export function WelperShareCards({ welperId, personalized }: WelperShareCardsProps) {
  const slug = welperId;

  return (
    <Card size="2" title="Share cards">
      <Flex direction="column" gap="3">
        <Text size="2" color="gray">
          Same promo cards and QR the welper can share. Download a PNG for print or
          social.
        </Text>
        {personalized ? null : (
          <Text size="2" color="gray">
            This welper is not marketplace-public, so the download will be the
            branded fallback card rather than a personalized one.
          </Text>
        )}
        <Grid columns={{ initial: "1", sm: "3" }} gap="3">
          {CARD_FORMATS.map(({ format, label, width, height }) => (
            <Card key={format} size="2">
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium">
                  {label}
                </Text>
                <Text size="1" color="gray">
                  {width}×{height}
                </Text>
                <Flex gap="2" wrap="wrap">
                  {CARD_LANGS.map(({ lang, label: langLabel }) => (
                    <Button key={lang} size="2" variant="soft" asChild>
                      <a
                        href={buildShareCardUrl(welperId, format, lang)}
                        download={shareCardFilename(slug, format, lang)}
                        aria-label={`Download ${label} card in ${langLabel}`}
                      >
                        {langLabel}
                      </a>
                    </Button>
                  ))}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Flex>
    </Card>
  );
}
