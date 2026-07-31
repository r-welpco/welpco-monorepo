import { Badge, Button, Card, Flex, Text } from "@welpco/ui";
import Link from "next/link";
import { AdminDateTime } from "@/components/admin-date-time";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  getResendEmailDetail,
  type ResendEmailLastEvent,
} from "@/lib/services/admin-reports-service";
import { EmailHtmlPreview } from "../email-html-preview";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

function eventColor(
  event: ResendEmailLastEvent,
): "green" | "red" | "amber" | "blue" | "gray" {
  if (event === "delivered" || event === "opened" || event === "clicked") {
    return "green";
  }
  if (event === "bounced" || event === "failed" || event === "complained") {
    return "red";
  }
  if (event === "delivery_delayed" || event === "queued" || event === "scheduled") {
    return "amber";
  }
  if (event === "sent") return "blue";
  return "gray";
}

export default async function ResendEmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let err: string | null = null;
  let email = null;
  try {
    email = await getResendEmailDetail(id);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load email";
  }

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title={email?.subject || "Email preview"}
        description="HTML preview is sandboxed (no scripts). Content comes from Resend."
      />

      <Flex>
        <Button asChild variant="soft">
          <Link href="/reports/emails">Back to sent emails</Link>
        </Button>
      </Flex>

      {err ? <AdminErrorCallout message={err} /> : null}

      {email ? (
        <>
          <Card size="3">
            <div className={styles.metaList}>
              <Flex gap="2" align="center" wrap="wrap">
                <Text size="2" color="gray">
                  Status
                </Text>
                <Badge color={eventColor(email.lastEvent)}>
                  {email.lastEvent}
                </Badge>
              </Flex>
              <Text size="2">
                <Text color="gray">To: </Text>
                <span className={styles.mono}>{email.to.join(", ")}</span>
              </Text>
              <Text size="2">
                <Text color="gray">From: </Text>
                {email.from}
              </Text>
              <Text size="2">
                <Text color="gray">Sent: </Text>
                <AdminDateTime value={email.createdAt} />
              </Text>
              <Text size="2">
                <Text color="gray">Resend id: </Text>
                <span className={styles.mono}>{email.id}</span>
              </Text>
              {email.tags.length > 0 ? (
                <Text size="2">
                  <Text color="gray">Tags: </Text>
                  {email.tags.map((tag) => `${tag.name}=${tag.value}`).join(", ")}
                </Text>
              ) : null}
            </div>
          </Card>

          <Card size="3">
            <Flex direction="column" gap="3">
              <Text size="4" weight="bold">
                HTML preview
              </Text>
              {email.html ? (
                <EmailHtmlPreview html={email.html} />
              ) : (
                <Text color="gray">No HTML body available for this email.</Text>
              )}
            </Flex>
          </Card>

          {email.text ? (
            <Card size="3">
              <Flex direction="column" gap="3">
                <Text size="4" weight="bold">
                  Plain text
                </Text>
                <Text
                  size="2"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {email.text}
                </Text>
              </Flex>
            </Card>
          ) : null}
        </>
      ) : null}
    </Flex>
  );
}
