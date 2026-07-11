"use client";

import {
  Button,
  Dialog,
  DialogContent,
  Flex,
  SEMANTIC_COLOR,
  Text,
  TextArea,
} from "@welpco/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminErrorCallout } from "@/components/admin-callout";
import {
  moderateAdminPortfolioPhoto,
  type AdminPortfolioPhoto,
} from "@/lib/services/admin-portfolio-service";

/** Fixed-size thumbnail that opens the full-size photo in a dialog. */
export function PortfolioPhotoThumbnail({ photo }: { photo: AdminPortfolioPhoto }) {
  const [open, setOpen] = useState(false);
  const alt = photo.caption?.trim() || `Portfolio photo by ${photo.welperName}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View full-size photo: ${alt}`}
        style={{ padding: 0, border: 0, background: "none", cursor: "zoom-in", display: "block" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external S3 URL, fixed-size moderation thumbnail */}
        <img
          src={photo.url}
          alt={alt}
          width={64}
          height={64}
          loading="lazy"
          style={{
            width: 64,
            height: 64,
            objectFit: "cover",
            borderRadius: "var(--radius-2)",
            border: "1px solid var(--gray-a6)",
            display: "block",
          }}
        />
      </button>
      <DialogContent title={photo.welperName} description={photo.caption ?? undefined} maxWidth="720px">
        {/* eslint-disable-next-line @next/next/no-img-element -- external S3 URL */}
        <img
          src={photo.url}
          alt={alt}
          style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: "var(--radius-2)", display: "block", margin: "0 auto" }}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Approve / Reject row actions. Refetches the server list on success (router.refresh). */
export function PortfolioPhotoActions({ photo }: { photo: AdminPortfolioPhoto }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function onApprove() {
    setError(null);
    setPending("approve");
    try {
      await moderateAdminPortfolioPhoto(photo.id, { status: "approved" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setPending(null);
    }
  }

  async function onReject() {
    setError(null);
    setPending("reject");
    try {
      const trimmed = reason.trim();
      await moderateAdminPortfolioPhoto(photo.id, {
        status: "rejected",
        ...(trimmed ? { rejectionReason: trimmed } : {}),
      });
      setRejectOpen(false);
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <Flex direction="column" gap="2" align="start">
      {error ? <AdminErrorCallout message={error} /> : null}
      <Flex gap="2">
        {photo.status !== "approved" ? (
          <Button
            type="button"
            size="2"
            disabled={pending !== null}
            onClick={() => void onApprove()}
          >
            {pending === "approve" ? "Approving..." : "Approve"}
          </Button>
        ) : null}
        {photo.status !== "rejected" ? (
          <Dialog
            open={rejectOpen}
            onOpenChange={(open) => {
              if (pending === "reject") return;
              setRejectOpen(open);
              if (!open) setReason("");
            }}
          >
            <Button
              type="button"
              size="2"
              variant="soft"
              color={SEMANTIC_COLOR.danger}
              disabled={pending !== null}
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
            <DialogContent
              title="Reject this photo?"
              description="The photo stays hidden from the public profile and the welper is notified — your reason is included if you add one."
              maxWidth="480px"
            >
              <Flex direction="column" gap="4">
                <label>
                  <Text as="div" size="2" weight="medium" mb="1">
                    Reason (optional)
                  </Text>
                  <TextArea
                    size="2"
                    rows={3}
                    placeholder="e.g. Photo is blurry, or doesn't show the work"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <Flex gap="2" justify="end">
                  <Button
                    type="button"
                    size="2"
                    variant="soft"
                    disabled={pending === "reject"}
                    onClick={() => {
                      setRejectOpen(false);
                      setReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="2"
                    color={SEMANTIC_COLOR.danger}
                    disabled={pending === "reject"}
                    onClick={() => void onReject()}
                  >
                    {pending === "reject" ? "Rejecting..." : "Reject photo"}
                  </Button>
                </Flex>
              </Flex>
            </DialogContent>
          </Dialog>
        ) : null}
      </Flex>
    </Flex>
  );
}
