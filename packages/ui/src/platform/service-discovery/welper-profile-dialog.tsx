"use client";

import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Button } from "@welpco/ui/button";
import { Avatar } from "@welpco/ui/avatar";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Skeleton } from "@welpco/ui/skeleton";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { customerWelperDisplayName } from "./customer-welper-display-name";

/** Minimal offering shape for the dialog (no dependency on app types). */
export interface WelperProfileDialogOffering {
  id: string;
  serviceCategoryId: string;
  subcategoryIds?: string[];
  subcategories?: Array<{ id: string; name: string }>;
  categoryName: string;
  parentCategoryName?: string;
  serviceDescription: string;
  hourlyRate: number;
  experienceYears?: number;
}

/** Minimal profile shape for the dialog. */
export interface WelperProfileDialogProfile {
  welperId: string;
  displayName?: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  serviceOfferings: WelperProfileDialogOffering[];
}

export interface WelperProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When null and !loading, show error or empty state. */
  profile: WelperProfileDialogProfile | null;
  loading?: boolean;
  /** Called when user clicks "Book now" (no specific offering) or "Book this service" (offering passed). */
  onBook?: (offering?: WelperProfileDialogOffering) => void;
}

/**
 * Pre-booking welper detail dialog. Trust signals first (photo + name),
 * services listed as canonical sub-cards, book CTA always reachable.
 */
export function WelperProfileDialog({
  open,
  onOpenChange,
  profile,
  loading = false,
  onBook,
}: WelperProfileDialogProps) {
  const displayName = customerWelperDisplayName(profile);

  const hasOfferings =
    !!profile?.serviceOfferings && profile.serviceOfferings.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={loading ? "Loading…" : displayName}
        description={loading ? undefined : "Welper profile and services"}
      >
        <Flex direction="column" gap="4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {loading && (
            <>
              <Flex gap="4" align="start">
                <Skeleton width="72px" height="72px" />
                <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 0 }}>
                  <Skeleton width="60%" height="24px" />
                  <Skeleton width="40%" height="18px" />
                </Flex>
              </Flex>
              <Separator size="4" />
              <Skeleton width="100%" height="80px" />
              <Separator size="4" />
              <Skeleton width="100%" height="120px" />
            </>
          )}

          {!loading && profile && (
            <>
              {/* Identity block — photo + bio */}
              <Flex gap="4" align="start" wrap="wrap">
                <Avatar
                  src={profile.profilePhotoUrl ?? undefined}
                  fallback={displayName.charAt(0).toUpperCase()}
                  alt={displayName}
                  size="7"
                  radius="full"
                  style={{ flexShrink: 0 }}
                />
                <Box flexGrow="1" style={{ minWidth: 0 }}>
                  <Heading size="5" mb="1" trim="start">
                    {displayName}
                  </Heading>
                  <Text size="2" color="gray" highContrast>
                    {profile.bio || "No bio provided."}
                  </Text>
                </Box>
              </Flex>

              {hasOfferings && (
                <>
                  <Separator size="4" />
                  <Box>
                    <Heading as="h3" size="3" mb="3">
                      Services
                    </Heading>
                    <Flex direction="column" gap="3">
                      {profile.serviceOfferings.map((offering) => (
                        <Card
                          key={offering.id}
                          size="2"
                          variant="surface"
                          style={{ width: "100%", minWidth: 0 }}
                        >
                          <Flex direction="column" gap="3">
                            <Flex justify="between" align="start" gap="3" wrap="wrap">
                              <Box flexGrow="1" style={{ minWidth: 0 }}>
                                <Heading size="4" mb="1" trim="start">
                                  {offering.categoryName}
                                </Heading>
                                {offering.parentCategoryName && (
                                  <Text size="2" color="gray" highContrast>
                                    {offering.parentCategoryName}
                                  </Text>
                                )}
                              </Box>
                              <Flex direction="column" align="end" flexShrink="0">
                                <Flex align="baseline" gap="1">
                                  <Text
                                    size="3"
                                    weight="bold"
                                    color={SEMANTIC_COLOR.primary}
                                  >
                                    ${offering.hourlyRate}
                                  </Text>
                                  <Text size="1" color="gray" highContrast>
                                    /hr
                                  </Text>
                                </Flex>
                                {offering.experienceYears != null && (
                                  <Text size="1" color="gray" highContrast>
                                    {offering.experienceYears}+ yrs exp
                                  </Text>
                                )}
                              </Flex>
                            </Flex>

                            {offering.serviceDescription && (
                              <Text size="2">{offering.serviceDescription}</Text>
                            )}

                            {onBook && (
                              <Flex justify="end">
                                <Button
                                  size="2"
                                  color={SEMANTIC_COLOR.primary}
                                  onClick={() => onBook(offering)}
                                >
                                  Book this service
                                </Button>
                              </Flex>
                            )}
                          </Flex>
                        </Card>
                      ))}
                    </Flex>
                  </Box>
                </>
              )}

              {!hasOfferings && (
                <>
                  <Separator size="4" />
                  <Text size="2" color="gray" highContrast>
                    No services listed.
                  </Text>
                </>
              )}

              <Separator size="4" />

              <Flex gap="2" justify="end" wrap="wrap">
                <Button
                  variant="soft"
                  color="gray"
                  size="2"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                {onBook && hasOfferings && (
                  <Button
                    size="2"
                    color={SEMANTIC_COLOR.primary}
                    onClick={() => onBook()}
                  >
                    Book now
                  </Button>
                )}
              </Flex>
            </>
          )}

          {!loading && !profile && (
            <Flex direction="column" gap="3">
              <Text size="2" color="gray" highContrast>
                Could not load profile.
              </Text>
              <Flex justify="end">
                <Button
                  variant="soft"
                  color="gray"
                  size="2"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </Flex>
            </Flex>
          )}
        </Flex>
      </DialogContent>
    </Dialog>
  );
}

WelperProfileDialog.displayName = "WelperProfileDialog";
