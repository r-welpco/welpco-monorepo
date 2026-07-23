import { Button, Card, Flex, Text } from "@welpco/ui";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Reports"
        description="Operational reports for marketplace health, support work, and supply planning."
      />

      <Card size="3">
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">
            Web Analytics
          </Text>
          <Text color="gray">
            Marketing traffic from Vercel Web Analytics: visitors, pageviews,
            daily trend, top pages, referrers, countries, and devices.
          </Text>
          <Flex>
            <Button asChild>
              <Link href="/reports/web-analytics">Open report</Link>
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Card size="3">
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">
            Sent emails (Resend)
          </Text>
          <Text color="gray">
            Review transactional emails sent through Resend, delivery event
            stats, and HTML previews for support and marketing checks.
          </Text>
          <Flex>
            <Button asChild>
              <Link href="/reports/emails">Open report</Link>
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Card size="3">
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">
            Welper Distribution
          </Text>
          <Text color="gray">
            See where ready and in-progress welpers are distributed by city and
            province. The map uses aggregate area buckets only, not individual
            welper pins.
          </Text>
          <Flex>
            <Button asChild>
              <Link href="/reports/welper-distribution">Open report</Link>
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
