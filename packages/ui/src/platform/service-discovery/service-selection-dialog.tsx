"use client";

import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Button } from "@welpco/ui/button";
import { Avatar } from "@welpco/ui/avatar";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Skeleton } from "@welpco/ui/skeleton";
import { Card } from "@welpco/ui/card";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { WelperProfileDialogOffering, WelperProfileDialogProfile } from "./welper-profile-dialog";

export interface ServiceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: WelperProfileDialogProfile | null;
  loading?: boolean;
  /** Called when user selects a service; parent should navigate to booking page and close. */
  onSelect: (offering: WelperProfileDialogOffering) => void;
}

export function ServiceSelectionDialog({
  open,
  onOpenChange,
  profile,
  loading = false,
  onSelect,
}: ServiceSelectionDialogProps) {
  const displayName =
    profile && [profile.firstName, profile.lastName].filter(Boolean).length > 0
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : "Welper";

  const offerings = profile?.serviceOfferings ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={loading ? "Loading…" : "Book a service"}
        description={loading ? undefined : `Choose a service to book with ${displayName}`}
      >
        <Flex direction="column" gap="6" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {loading ? (
            <>
              <Flex gap="5" align="center">
                <Skeleton width="48px" height="48px" />
                <Skeleton width="140px" height="24px" />
              </Flex>
              <Flex direction="column" gap="5">
                <Skeleton width="100%" height="120px" />
                <Skeleton width="100%" height="120px" />
              </Flex>
            </>
          ) : null}

          {!loading && profile ? (
            <>
              <Flex gap="5" align="center">
                <Avatar
                  size="3"
                  src={profile.profilePhotoUrl ?? undefined}
                  fallback={displayName.slice(0, 2).toUpperCase()}
                />
                <Box>
                  <Text size="3" weight="bold">
                    {displayName}
                  </Text>
                  <Text size="1" color="gray" highContrast>
                    {offerings.length} service{offerings.length !== 1 ? "s" : ""} available
                  </Text>
                </Box>
              </Flex>

              <Flex direction="column" gap="5">
                {offerings.length === 0 ? (
                  <Text size="2" color="gray" highContrast>
                    No services available to book.
                  </Text>
                ) : (
                  offerings.map((offering) => (
                    <Card
                      key={offering.id}
                      size="4"
                      variant="surface"
                      style={{ width: "100%", minWidth: 0, cursor: "pointer" }}
                    >
                      <Box
                        onClick={() => onSelect(offering)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelect(offering);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        style={{ outline: "none" }}
                      >
                        <Flex
                          direction="column"
                          gap="5"
                          align="stretch"
                        >
                          <Flex justify="between" align="start" gap="4" wrap="wrap">
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              {offering.parentCategoryName && (
                                <Text size="1" color="gray" highContrast mb="1" as="div">
                                  {offering.parentCategoryName}
                                </Text>
                              )}
                              <Heading size="4" mb="1">
                                {offering.categoryName}
                              </Heading>
                              {offering.serviceDescription && (
                                <Text
                                  size="2"
                                  color="gray"
                                  highContrast
                                  trim="end"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {offering.serviceDescription}
                                </Text>
                              )}
                            </Box>
                            <Flex direction="column" align="end" gap="1" style={{ flexShrink: 0 }}>
                              <Text size="3" weight="bold">
                                ${offering.hourlyRate}
                                <Text size="1" color="gray" highContrast weight="regular">
                                  /hr
                                </Text>
                              </Text>
                              {offering.experienceYears != null && offering.experienceYears > 0 && (
                                <Text size="1" color="gray" highContrast>
                                  {offering.experienceYears} yr exp.
                                </Text>
                              )}
                            </Flex>
                          </Flex>
                          <Flex gap="2" justify="end" wrap="wrap">
                            <Button
                              size="2"
                              variant="solid"
                              color={SEMANTIC_COLOR.primary}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(offering);
                              }}
                            >
                              Book this service
                            </Button>
                          </Flex>
                        </Flex>
                      </Box>
                    </Card>
                  ))
                )}
              </Flex>
            </>
          ) : null}

          {!loading && !profile ? (
            <Text size="2" color="gray" highContrast>
              Could not load profile.
            </Text>
          ) : null}
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
