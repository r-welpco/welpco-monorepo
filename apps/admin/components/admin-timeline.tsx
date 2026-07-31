import { Box, Flex, Text } from "@welpco/ui";
import { AdminDateTime } from "@/components/admin-date-time";

export type AdminTimelineTone = "default" | "danger" | "success";

export interface AdminTimelineEvent {
  id: string;
  label: string;
  timestamp: string | null;
  tone?: AdminTimelineTone;
}

function dotColor(tone: AdminTimelineTone): string {
  if (tone === "danger") return "var(--red-9)";
  if (tone === "success") return "var(--green-9)";
  return "var(--accent-9)";
}

export function AdminTimeline({ events }: { events: AdminTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <Text size="2" color="gray">
        No lifecycle events recorded yet.
      </Text>
    );
  }

  return (
    <Flex direction="column" gap="0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const tone = event.tone ?? "default";
        return (
          <Flex key={event.id} gap="3" align="stretch">
            <Flex direction="column" align="center" style={{ width: 14, flexShrink: 0 }}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: dotColor(tone),
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              {!isLast ? (
                <Box
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 28,
                    background: "var(--gray-a6)",
                    marginTop: 4,
                  }}
                />
              ) : null}
            </Flex>
            <Flex direction="column" gap="1" pb={isLast ? "0" : "4"} style={{ minWidth: 0, flex: 1 }}>
              <Text size="2" weight="medium">
                {event.label}
              </Text>
              <Text size="1" color="gray">
                <AdminDateTime value={event.timestamp} />
              </Text>
            </Flex>
          </Flex>
        );
      })}
    </Flex>
  );
}
