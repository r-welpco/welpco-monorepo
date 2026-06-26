"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Flex } from "@welpco/ui/flex";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import {
  AddressInput,
  CANADIAN_PROVINCE_CODES,
  type AddressValues,
} from "@welpco/ui/platform/profile-management";
import { useCustomerProfileLabels } from "@/lib/i18n/use-dashboard-labels";
import { useCustomerProfile, useUpdateCustomerProfile } from "@/lib/hooks/use-profile";
import { useAuthStore } from "@/stores/authStore";
import type { CustomerProfile } from "@/types";

function createAddressSchema(v: {
  streetRequired: string;
  cityRequired: string;
  provinceRequired: string;
  postalInvalid: string;
}) {
  return z.object({
    streetAddress: z.string().min(5, v.streetRequired),
    city: z.string().min(2, v.cityRequired),
    stateProvince: z
      .string()
      .refine((val) => CANADIAN_PROVINCE_CODES.has(val), v.provinceRequired),
    zipPostalCode: z
      .string()
      .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, v.postalInvalid),
    country: z.string().optional(),
  });
}

export interface CustomerAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (profile: CustomerProfile) => void;
  title?: string;
  description?: string;
}

export function CustomerAddressDialog({
  open,
  onOpenChange,
  onSuccess,
  title,
  description,
}: CustomerAddressDialogProps) {
  const labels = useCustomerProfileLabels();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "";
  const { data: profile } = useCustomerProfile(userId, open && user?.role === "customer");
  const updateProfile = useUpdateCustomerProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () => createAddressSchema(labels.form.validation),
    [labels.form.validation],
  );

  const form = useForm<AddressValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      streetAddress: "",
      city: "",
      stateProvince: "",
      zipPostalCode: "",
      country: "CA",
    },
  });

  useEffect(() => {
    if (!open || !profile) return;
    form.reset({
      streetAddress: profile.address?.streetAddress ?? "",
      city: profile.address?.city ?? "",
      stateProvince: profile.address?.stateProvince ?? "",
      zipPostalCode: profile.address?.zipPostalCode ?? "",
      country: profile.address?.country ?? "CA",
    });
    setSubmitError(null);
  }, [open, profile, form]);

  const handleSubmit = form.handleSubmit(async (address) => {
    if (!profile || !userId) return;
    setSubmitError(null);
    try {
      const updated = await updateProfile.mutateAsync({
        userId,
        data: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          address: {
            ...address,
            country: address.country || "CA",
          },
        },
      });
      onSuccess?.(updated);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : labels.loadError);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="3"
        style={{ maxWidth: "min(520px, calc(100vw - 24px))" }}
        title={title ?? labels.form.address}
        description={description ?? labels.form.description}
      >
        {open ? (
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <AddressInput
                layout="split"
                values={form.watch()}
                onChange={(values) => {
                  form.setValue("streetAddress", values.streetAddress, { shouldValidate: true });
                  form.setValue("city", values.city, { shouldValidate: true });
                  form.setValue("stateProvince", values.stateProvince, { shouldValidate: true });
                  form.setValue("zipPostalCode", values.zipPostalCode, { shouldValidate: true });
                  form.setValue("country", values.country ?? "CA");
                }}
                errors={{
                  streetAddress: form.formState.errors.streetAddress?.message,
                  city: form.formState.errors.city?.message,
                  stateProvince: form.formState.errors.stateProvince?.message,
                  zipPostalCode: form.formState.errors.zipPostalCode?.message,
                }}
                labels={labels.form.addressFields}
                provinceLabels={labels.form.provinceLabels}
                loading={updateProfile.isPending}
                required
              />
                {submitError ? (
                  <Callout.Root color="red" variant="surface" role="alert">
                    <Callout.Text>{submitError}</Callout.Text>
                  </Callout.Root>
                ) : null}
                <Flex gap="2" wrap="wrap">
                  <Button type="submit" size="2" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? labels.form.saving : labels.form.save}
                  </Button>
                  <Button
                    type="button"
                    size="2"
                    variant="soft"
                    color="gray"
                    disabled={updateProfile.isPending}
                    onClick={() => onOpenChange(false)}
                  >
                    {labels.form.cancel}
                  </Button>
                </Flex>
              </Flex>
            </form>
          ) : null}
      </DialogContent>
    </Dialog>
  );
}
