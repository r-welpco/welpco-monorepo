"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  isWelperLaunchAnnouncementSuppressed,
  suppressWelperLaunchAnnouncementAutoShow,
} from "@/lib/marketing/welper-launch-announcement-storage";

export function WelperLaunchAnnouncement() {
  const t = useTranslations("marketing.welpersOpen");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [neverAgain, setNeverAgain] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isWelperLaunchAnnouncementSuppressed()) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mounted) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  const closeModal = useCallback(() => {
    if (neverAgain) {
      suppressWelperLaunchAnnouncementAutoShow();
    }
    setOpen(false);
    setNeverAgain(false);
  }, [neverAgain]);

  const openModal = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="welpco-launch-dialog"
        data-launch-announcement-modal
        aria-labelledby="welper-launch-announcement-title"
        onCancel={(e) => {
          e.preventDefault();
          closeModal();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            closeModal();
          }
        }}
      >
        <div
          className="card welpco-launch-dialog__panel"
          data-launch-announcement-panel
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="welpco-launch-dialog__close"
            onClick={closeModal}
            aria-label={t("close")}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>

          <div className="pill" style={{ marginBottom: 16 }}>
            {t("badge")}
          </div>

          <h2
            id="welper-launch-announcement-title"
            style={{ margin: "0 0 12px", fontSize: "clamp(1.5rem, 4vw, 2rem)", lineHeight: 1.15 }}
          >
            {t("title")}
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              fontSize: 17,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
            }}
          >
            {t("intro")}
          </p>

          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {t("whatsNextTitle")}
            </p>
            <p style={{ margin: 0, fontSize: 15, color: "var(--fg-muted)", lineHeight: 1.55 }}>
              {t("whatsNextBody")}
            </p>
          </div>

          <p style={{ margin: "0 0 24px", fontSize: 15, color: "var(--fg-muted)", lineHeight: 1.55 }}>
            {t("feedbackPrefix")}{" "}
            <a
              href={`mailto:${t("supportEmail")}`}
              style={{ color: "var(--fg)", fontWeight: 500 }}
            >
              {t("supportEmail")}
            </a>
            {t("feedbackSuffix")}
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 24,
              fontSize: 14,
              color: "var(--fg-muted)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={neverAgain}
              onChange={(e) => setNeverAgain(e.target.checked)}
              style={{ marginTop: 3, accentColor: "var(--evergreen)" }}
            />
            <span>{t("neverShowAgain")}</span>
          </label>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/register" className="btn btn-primary" onClick={closeModal}>
              {t("ctaPrimary")} <span aria-hidden="true">→</span>
            </Link>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              {t("close")}
            </button>
          </div>
        </div>
      </dialog>

      <button
        type="button"
        className="welpco-launch-dialog__fab"
        data-launch-announcement-fab
        onClick={openModal}
        aria-label={t("fabLabel")}
        title={t("fabLabel")}
        aria-expanded={open}
        hidden={open}
      >
        <Megaphone size={22} strokeWidth={2} aria-hidden />
      </button>
    </>
  );
}
