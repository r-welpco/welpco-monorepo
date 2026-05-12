"use client";

import { useState } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  AddressInput,
  type AddressValues,
} from "../../profile-management/address-input";
import { ProfilePhotoUpload } from "../../profile-management/profile-photo-upload";
import type { SignupStateLite, SelectedRole } from "./types";

/**
 * Day 15 — Phase 2 Dispatch B. Both-roles final step.
 *
 * Photo (skippable, both roles) + address (skippable, customers only — welpers
 * already gave a service area in step 4). Composes the existing platform
 * primitives `<ProfilePhotoUpload>` and `<AddressInput>` with the wizard's
 * voice + skip affordance.
 *
 * The photo upload is wired through `onUploadPhoto` so the wizard host can
 * route the file through its existing presigned-S3 upload service and feed
 * the resulting URL back via `defaultPhotoUrl` (or via a controlled prop the
 * caller manages). On submit we ship `{ photoUrl, address }` to the BFF.
 */

export interface OptionalProfileStepValues {
  photoUrl?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface OptionalProfileStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  /** When a customer, the address fields are shown; welpers skip address. */
  role: SelectedRole;
  /** Current photo URL (after a successful upload). */
  defaultPhotoUrl?: string | null;
  /** Whether a photo upload is currently in flight. */
  uploadingPhoto?: boolean;
  /**
   * Called when the user picks a file. The host uploads via its presigned-S3
   * service and feeds the resulting URL back via `defaultPhotoUrl` (or a
   * controlled equivalent the caller wires).
   */
  onUploadPhoto?: (file: File) => void | Promise<void>;
  onRemovePhoto?: () => void | Promise<void>;
  onSubmit: (values: OptionalProfileStepValues) => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  onBack?: () => void;
}

export function OptionalProfileStep({
  state,
  loading,
  error,
  role,
  defaultPhotoUrl,
  uploadingPhoto,
  onUploadPhoto,
  onRemovePhoto,
  onSubmit,
  onSkip,
  onBack,
}: OptionalProfileStepProps) {
  const filled = state.filledData.optionalProfile as
    | OptionalProfileStepValues
    | undefined;

  const [address, setAddress] = useState<AddressValues>({
    streetAddress: filled?.address?.streetAddress ?? "",
    city: filled?.address?.city ?? "",
    stateProvince: filled?.address?.state ?? "",
    zipPostalCode: filled?.address?.zipCode ?? "",
    country: filled?.address?.country ?? "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: OptionalProfileStepValues = {};
    if (defaultPhotoUrl) payload.photoUrl = defaultPhotoUrl;
    if (role === "customer") {
      const anyAddress =
        address.streetAddress.trim() ||
        address.city.trim() ||
        address.stateProvince.trim() ||
        address.zipPostalCode.trim() ||
        (address.country?.trim() ?? "");
      if (anyAddress) {
        payload.address = {
          streetAddress: address.streetAddress.trim() || undefined,
          city: address.city.trim() || undefined,
          state: address.stateProvince.trim() || undefined,
          zipCode: address.zipPostalCode.trim() || undefined,
          country: address.country?.trim() || undefined,
        };
      }
    }
    await onSubmit(payload);
  };

  const handleSkip = async () => {
    if (onSkip) await onSkip();
    else await onSubmit({});
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Finish your profile
          </Heading>
          <Text size="2" color="gray">
            A photo and a few extra details help customers and Welpers know
            who they&apos;re working with. Both are optional — you can skip
            and add them later.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Box mb={FORM_SPACING.fieldGap}>
            <ProfilePhotoUpload
              currentPhotoUrl={defaultPhotoUrl ?? undefined}
              loading={uploadingPhoto}
              description="A clear, friendly photo of you. JPEG, PNG, or WebP up to 5 MB."
              onUpload={onUploadPhoto}
              onRemove={onRemovePhoto}
            />
          </Box>

          {role === "customer" && (
            <Box mb={FORM_SPACING.fieldGap}>
              <Card variant="surface" size="3">
                <Flex direction="column" gap="3">
                  <Box>
                    <Heading as="h3" size="4" trim="start" mb="1">
                      Where do you live?
                    </Heading>
                    <Text size="2" color="gray">
                      We use this to find Welpers near you. Optional — you can
                      enter it later from your profile.
                    </Text>
                  </Box>
                  <AddressInput
                    values={address}
                    onChange={setAddress}
                    loading={loading}
                    required={false}
                  />
                </Flex>
              </Card>
            </Box>
          )}

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Saving..." : "Finish signup"}
            </Button>
            <Button
              type="button"
              size="3"
              variant="soft"
              color="gray"
              disabled={loading}
              onClick={handleSkip}
              style={{ width: "100%" }}
            >
              Skip for now
            </Button>
            {onBack && (
              <Button
                type="button"
                size="3"
                variant="ghost"
                color="gray"
                disabled={loading}
                onClick={onBack}
                style={{ width: "100%" }}
              >
                Back
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
