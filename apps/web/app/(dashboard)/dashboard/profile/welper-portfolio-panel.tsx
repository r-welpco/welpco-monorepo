"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Text } from "@welpco/ui/text";
import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { Callout } from "@welpco/ui/callout";
import { Skeleton } from "@welpco/ui/skeleton";
import { Spinner } from "@welpco/ui/spinner";
import { TextField } from "@welpco/ui/text-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { ActionConfirmDialog } from "@welpco/ui/platform/feedback";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  useDeletePortfolioPhoto,
  useMyPortfolio,
  useReorderPortfolio,
  useUpdatePortfolioPhoto,
  useUploadPortfolioPhoto,
} from "@/lib/hooks/use-portfolio";
import {
  ImageDecodeError,
  ImageTooLargeError,
  PORTFOLIO_ACCEPTED_INPUT_TYPES,
  PORTFOLIO_CAPTION_MAX_LENGTH,
  PORTFOLIO_FILE_INPUT_ACCEPT,
  PORTFOLIO_MAX_PHOTOS,
  type PortfolioPhoto,
  type PortfolioUploadStage,
} from "@/lib/services/portfolio-service";
import { useApiErrorMessage } from "@/lib/i18n/use-api-error-message";

/**
 * SHARE-001 (web half): welper-facing portfolio manager.
 *
 * - Grid of own photos with honest moderation chips (§17.5): pending (amber),
 *   live (primary), not approved (danger, `rejectionReason` surfaced verbatim).
 * - Upload pipeline with mandatory client-side EXIF/GPS strip (canvas
 *   re-encode in `portfolio-service.ts`).
 * - Inline caption edit (200 chars), up/down reorder (no dnd dependency),
 *   delete behind an AlertDialog (§17.6), 24-photo cap messaging.
 * - Optional "Show under" offering association at upload time (the BFF only
 *   accepts `offeringId` on create — it is not editable afterwards).
 */

const ANY_OFFERING = "__any__";

interface OfferingOption {
  id: string;
  title: string;
}

function StatusChip({ status }: { status: PortfolioPhoto["status"] }) {
  const t = useTranslations("dashboard.profile.portfolio");
  if (status === "approved") {
    return (
      <Badge color={SEMANTIC_COLOR.primary} variant="soft">
        {t("statusLive")}
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge color={SEMANTIC_COLOR.danger} variant="soft">
        {t("statusRejected")}
      </Badge>
    );
  }
  return (
    <Badge color={SEMANTIC_COLOR.warning} variant="soft">
      {t("statusPending")}
    </Badge>
  );
}

function PortfolioPhotoCard({
  photo,
  index,
  total,
  offeringTitle,
  onMove,
  onDelete,
  reorderPending,
}: {
  photo: PortfolioPhoto;
  index: number;
  total: number;
  offeringTitle: string | null;
  onMove: (photoId: string, direction: -1 | 1) => void;
  onDelete: (photoId: string) => void;
  reorderPending: boolean;
}) {
  const t = useTranslations("dashboard.profile.portfolio");
  const apiErrorMessage = useApiErrorMessage();
  const updatePhoto = useUpdatePortfolioPhoto();
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [captionError, setCaptionError] = useState<string | null>(null);
  const captionDirty = caption !== (photo.caption ?? "");

  const handleCaptionSave = () => {
    setCaptionError(null);
    void updatePhoto
      .mutateAsync({ photoId: photo.id, data: { caption: caption.trim() } })
      .catch((error: unknown) =>
        setCaptionError(
          apiErrorMessage(error, "portfolioCaption", t("updateFailed")),
        ),
      );
  };

  return (
    <Card size="2" variant="surface">
      <Flex direction="column" gap="3">
        <Box
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: "var(--radius-3)",
            overflow: "hidden",
            backgroundColor: "var(--gray-3)",
          }}
        >
          {photo.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- S3 host is env-dependent; plain <img> like other portfolio surfaces
            <img
              src={photo.url}
              alt={photo.caption || t("photoAlt")}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : null}
        </Box>

        <Flex justify="between" align="center" gap="2" wrap="wrap">
          <StatusChip status={photo.status} />
          <Flex gap="1" align="center">
            <IconButton
              variant="soft"
              color="gray"
              size="1"
              aria-label={t("moveEarlierAria")}
              disabled={index === 0 || reorderPending}
              onClick={() => onMove(photo.id, -1)}
            >
              <ArrowUp size={14} aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="soft"
              color="gray"
              size="1"
              aria-label={t("moveLaterAria")}
              disabled={index === total - 1 || reorderPending}
              onClick={() => onMove(photo.id, 1)}
            >
              <ArrowDown size={14} aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="soft"
              color={SEMANTIC_COLOR.danger}
              size="1"
              aria-label={t("deleteAria")}
              onClick={() => onDelete(photo.id)}
            >
              <Trash2 size={14} aria-hidden="true" />
            </IconButton>
          </Flex>
        </Flex>

        {photo.status === "rejected" ? (
          <Text size="1" color={SEMANTIC_COLOR.danger} as="p">
            {photo.rejectionReason
              ? t("rejectedReason", { reason: photo.rejectionReason })
              : t("rejectedNoReason")}
          </Text>
        ) : null}

        {offeringTitle ? (
          <Text size="1" color="gray" as="p">
            {t("shownUnder", { title: offeringTitle })}
          </Text>
        ) : null}

        <Box>
          <Text
            as="label"
            size="1"
            weight="medium"
            htmlFor={`portfolio-caption-${photo.id}`}
            mb={FORM_SPACING.labelGap}
          >
            {t("captionLabel")}
          </Text>
          <Flex gap="2" align="center">
            <Box flexGrow="1">
              <TextField.Root
                id={`portfolio-caption-${photo.id}`}
                size="1"
                value={caption}
                maxLength={PORTFOLIO_CAPTION_MAX_LENGTH}
                placeholder={t("captionPlaceholder")}
                disabled={updatePhoto.isPending}
                onChange={(e) => setCaption(e.target.value)}
              />
            </Box>
            {captionDirty ? (
              <Button
                size="1"
                variant="soft"
                color={SEMANTIC_COLOR.primary}
                disabled={updatePhoto.isPending}
                onClick={handleCaptionSave}
              >
                {updatePhoto.isPending ? t("captionSaving") : t("captionSave")}
              </Button>
            ) : null}
          </Flex>
          {captionError ? (
            <Text size="1" color={SEMANTIC_COLOR.danger} as="p" mt="1">
              {captionError}
            </Text>
          ) : null}
        </Box>
      </Flex>
    </Card>
  );
}

export function WelperProfilePortfolioPanel({
  offerings,
}: {
  offerings: OfferingOption[];
}) {
  const t = useTranslations("dashboard.profile.portfolio");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: photos, isLoading, isError } = useMyPortfolio();
  const uploadPhoto = useUploadPortfolioPhoto();
  const deletePhoto = useDeletePortfolioPhoto();
  const reorder = useReorderPortfolio();

  const [uploadStage, setUploadStage] = useState<PortfolioUploadStage | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState(ANY_OFFERING);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sortedPhotos = [...(photos ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const count = sortedPhotos.length;
  const atCap = count >= PORTFOLIO_MAX_PHOTOS;
  const uploading = uploadPhoto.isPending;

  const offeringTitleById = new Map(offerings.map((o) => [o.id, o.title]));

  const uploadErrorMessage = (err: unknown): string => {
    if (err instanceof ImageDecodeError) return t("errors.decodeFailed");
    if (err instanceof ImageTooLargeError) return t("errors.tooLarge");
    if (err instanceof ApiClientError) {
      if (err.code === "PORTFOLIO_LIMIT_REACHED" || err.statusCode === 409) {
        return t("limitReached", { max: PORTFOLIO_MAX_PHOTOS });
      }
      if (err.statusCode === 503) return t("errors.storageUnavailable");
    }
    return t("errors.uploadFailed");
  };

  const handleFilePicked = (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    if (
      !(PORTFOLIO_ACCEPTED_INPUT_TYPES as readonly string[]).includes(
        file.type === "image/jpg" ? "image/jpeg" : file.type,
      )
    ) {
      setUploadError(t("errors.decodeFailed"));
      return;
    }
    void uploadPhoto
      .mutateAsync({
        file,
        offeringId:
          selectedOfferingId === ANY_OFFERING ? undefined : selectedOfferingId,
        onStage: setUploadStage,
      })
      .catch((err: unknown) => setUploadError(uploadErrorMessage(err)))
      .finally(() => setUploadStage(null));
  };

  const handleMove = (photoId: string, direction: -1 | 1) => {
    const ids = sortedPhotos.map((p) => p.id);
    const from = ids.indexOf(photoId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setActionError(null);
    void reorder
      .mutateAsync(ids)
      .catch(() => setActionError(t("updateFailed")));
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    setActionError(null);
    void deletePhoto
      .mutateAsync(pendingDeleteId)
      .then(() => setPendingDeleteId(null))
      .catch(() => {
        setPendingDeleteId(null);
        setActionError(t("deleteFailed"));
      });
  };

  const stageLabel =
    uploadStage === "processing"
      ? t("stageProcessing")
      : uploadStage === "saving"
        ? t("stageSaving")
        : t("stageUploading");

  const uploadControls = (
    <Flex direction="column" gap="3">
      {offerings.length > 0 ? (
        <Box style={{ maxWidth: "320px" }}>
          <Text
            as="label"
            id="portfolio-offering-label"
            size="2"
            weight="medium"
            mb={FORM_SPACING.labelGap}
            style={{ display: "block" }}
          >
            {t("offeringLabel")}
          </Text>
          <Select
            value={selectedOfferingId}
            onValueChange={setSelectedOfferingId}
            disabled={uploading}
          >
            <SelectTrigger
              aria-labelledby="portfolio-offering-label"
              style={{ width: "100%" }}
            />
            <SelectContent>
              <SelectItem value={ANY_OFFERING}>{t("offeringAny")}</SelectItem>
              {offerings.map((offering) => (
                <SelectItem key={offering.id} value={offering.id}>
                  {offering.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>
      ) : null}

      <Flex gap="3" align="center" wrap="wrap">
        <Button
          size="2"
          color={SEMANTIC_COLOR.primary}
          disabled={uploading || atCap}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Spinner size="1" />
              {stageLabel}
            </>
          ) : (
            <>
              <ImagePlus size={16} aria-hidden="true" />
              {t("addPhoto")}
            </>
          )}
        </Button>
        <Text size="2" color="gray" highContrast>
          {t("photoCount", { count, max: PORTFOLIO_MAX_PHOTOS })}
        </Text>
      </Flex>
      <input
        ref={fileInputRef}
        type="file"
        accept={PORTFOLIO_FILE_INPUT_ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => {
          handleFilePicked(e.target.files?.[0] ?? null);
          // Allow re-picking the same file after an error.
          e.target.value = "";
        }}
      />
      <Text size="1" color="gray" as="p">
        {t("acceptHint")} {t("heicHint")}
      </Text>
      {atCap ? (
        <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
          <Callout.Text>{t("limitReached", { max: PORTFOLIO_MAX_PHOTOS })}</Callout.Text>
        </Callout.Root>
      ) : null}
      {uploadError ? (
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>{uploadError}</Callout.Text>
        </Callout.Root>
      ) : null}
    </Flex>
  );

  return (
    <Flex direction="column" gap="4">
      <Text size="2" color="gray">
        {t("subtitle")} {t("reviewNote")}
      </Text>

      {isError ? (
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>{t("loadError")}</Callout.Text>
        </Callout.Root>
      ) : null}

      {uploadControls}

      {actionError ? (
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>{actionError}</Callout.Text>
        </Callout.Root>
      ) : null}

      {isLoading ? (
        <Grid columns={{ initial: "2", sm: "3" }} gap="4">
          {[1, 2, 3].map((key) => (
            <Card key={key} size="2" variant="surface">
              <Flex direction="column" gap="3">
                <Skeleton width="100%" style={{ aspectRatio: "1 / 1" }} />
                <Skeleton width="60%" height="16px" />
              </Flex>
            </Card>
          ))}
        </Grid>
      ) : count === 0 && !isError ? (
        <Card size="3" variant="surface">
          <Flex direction="column" gap="2" align="center" py="5">
            <Text size="3" weight="medium" as="p" align="center">
              {t("emptyTitle")}
            </Text>
            <Text size="2" color="gray" highContrast as="p" align="center">
              {t("emptyDescription")}
            </Text>
          </Flex>
        </Card>
      ) : (
        <Grid columns={{ initial: "2", sm: "3" }} gap="4">
          {sortedPhotos.map((photo, index) => (
            <PortfolioPhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              total={count}
              offeringTitle={
                photo.offeringId
                  ? (offeringTitleById.get(photo.offeringId) ?? null)
                  : null
              }
              onMove={handleMove}
              onDelete={setPendingDeleteId}
              reorderPending={reorder.isPending}
            />
          ))}
        </Grid>
      )}

      <ActionConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("deleteCancel")}
        variant="danger"
        pending={deletePhoto.isPending}
        onConfirm={handleConfirmDelete}
      />
    </Flex>
  );
}
