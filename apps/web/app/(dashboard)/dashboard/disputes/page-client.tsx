"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { Card } from "@welpco/ui/card";
import { Separator } from "@welpco/ui/separator";
import { Skeleton } from "@welpco/ui/skeleton";
import { Callout } from "@welpco/ui/callout";
import { DisputeStatusBadge } from "@welpco/ui";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useDisputes } from "@/lib/hooks/use-disputes";
import { useDisputeLabels } from "@/lib/i18n/use-dashboard-labels";
import { useDisputeCategoryLabel } from "@/lib/i18n/dispute-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { ArrowLeft, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

export default function DisputesPageClient() {
  const labels = useDisputeLabels();
  const formatCategory = useDisputeCategoryLabel();
  const dateLocale = useDateFnsLocale();
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, error } = useDisputes({ page, limit });

  const disputes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6">
        <Box>
          <Button variant="ghost" color="gray" size="2" asChild>
            <Link href="/dashboard/bookings">
              <ArrowLeft size={16} aria-hidden="true" />
              {labels.backToBookings}
            </Link>
          </Button>
        </Box>

        <Box>
          <Heading as="h1" size="7" mb="2" trim="start">
            {labels.title}
          </Heading>
          <Text size="2" color="gray" highContrast as="p">
            {labels.description}
          </Text>
        </Box>

        {isError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>
              {error instanceof Error ? error.message : labels.loadListFailed}
            </Callout.Text>
          </Callout.Root>
        )}

        {isLoading ? (
          <Card size="3" variant="surface">
            <Flex direction="column" gap="3" aria-busy="true" aria-live="polite">
              <Skeleton width="100%" height="56px" />
              <Skeleton width="100%" height="56px" />
              <Skeleton width="100%" height="56px" />
            </Flex>
          </Card>
        ) : disputes.length === 0 ? (
          <Card size="3" variant="surface">
            <Flex direction="column" align="center" gap="3" py="6" px="3">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "9999px",
                  backgroundColor: "var(--gray-3)",
                  color: "var(--gray-11)",
                }}
              >
                <AlertCircle size={24} aria-hidden="true" />
              </Flex>
              <Box>
                <Heading size="4" align="center" mb="1" trim="start">
                  {labels.emptyTitle}
                </Heading>
                <Text size="2" color="gray" highContrast align="center" as="p">
                  {labels.emptyDescription}
                </Text>
              </Box>
              <Button size="2" variant="soft" color="gray" asChild>
                <Link href="/dashboard/bookings">{labels.viewBookings}</Link>
              </Button>
            </Flex>
          </Card>
        ) : (
          <>
            <Card size="3" variant="surface">
              <Flex direction="column" asChild>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {disputes.map((d, idx) => (
                    <Box key={d.id} asChild>
                      <li>
                        {idx > 0 && <Separator mb="3" />}
                        <Flex
                          justify="between"
                          align="center"
                          wrap="wrap"
                          gap="3"
                          mb={idx < disputes.length - 1 ? "3" : "0"}
                        >
                          <Flex
                            direction="column"
                            gap="1"
                            flexGrow="1"
                            style={{ minWidth: 0 }}
                          >
                            <Text size="2" weight="medium" trim="end">
                              {d.subject}
                            </Text>
                            <Flex align="center" gap="2" wrap="wrap">
                              <DisputeStatusBadge status={d.status} />
                              <Text size="1" color="gray" highContrast>
                                {formatCategory(d.category)} &middot;{" "}
                                {format(new Date(d.createdAt), "PPp", { locale: dateLocale })}
                              </Text>
                            </Flex>
                          </Flex>
                          <Flex gap="2" wrap="wrap">
                            <Button size="2" variant="soft" color="gray" asChild>
                              <Link href={`/dashboard/disputes/${d.id}`}>
                                {labels.viewReport}
                              </Link>
                            </Button>
                            <Button size="2" variant="ghost" color="gray" asChild>
                              <Link href={`/dashboard/bookings/${d.bookingId}`}>
                                {labels.openBooking}
                              </Link>
                            </Button>
                          </Flex>
                        </Flex>
                      </li>
                    </Box>
                  ))}
                </ul>
              </Flex>
            </Card>

            {totalPages > 1 && (
              <Flex
                justify="center"
                gap="3"
                align="center"
                role="navigation"
                aria-label={labels.paginationAria}
              >
                <IconButton
                  size="2"
                  variant="soft"
                  color="gray"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label={labels.prevPageAria}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </IconButton>
                <Text size="2" color="gray" highContrast>
                  {labels.pageOf(page, totalPages, total)}
                </Text>
                <IconButton
                  size="2"
                  variant="soft"
                  color="gray"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label={labels.nextPageAria}
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </IconButton>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Container>
  );
}
