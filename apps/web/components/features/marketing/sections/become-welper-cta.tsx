"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MarketingImageGallery } from "../shared/marketing-image-gallery";

/**
 * BecomeWelperCTA — provider-side recruiting block.
 */

export function BecomeWelperCTA() {
  const t = useTranslations("marketing.home.becomeWelper");
  const tA11y = useTranslations("marketing.a11y");
  const points = t.raw("points") as string[];

  return (
    <section className="section">
      <div className="container">
        <div
          data-grid="becomewelper-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            alignItems: "center",
            padding: "24px 0",
          }}
        >
          <div style={{ position: "relative" }}>
            <MarketingImageGallery
              layout="welper-collage"
              ariaLabel={tA11y("welperPhotosGallery")}
              swipeHint={tA11y("swipeHint")}
              items={[
                {
                  src: "/marketing/become-welper-lawncare.jpg",
                  alt: t("images.lawn"),
                  ratio: "3 / 4",
                },
                {
                  src: "/marketing/become-welper-baking.jpg",
                  alt: t("images.baking"),
                  ratio: "1 / 1",
                },
                {
                  src: "/marketing/become-welper-tutoring.jpg",
                  alt: t("images.tutoring"),
                  ratio: "1 / 1",
                },
              ]}
            />
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              {t("eyebrow")}
            </div>
            <h2>
              {t("titleLine1")}
              <br />
              <span className="display-italic">{t("titleLine2")}</span>
            </h2>
            <p
              style={{
                marginTop: 20,
                fontSize: 17,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
                maxWidth: 480,
              }}
            >
              {t("body")}
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "28px 0 0",
                display: "grid",
                gap: 14,
              }}
            >
              {points.map((s) => (
                <li
                  key={s}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    fontSize: 15,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      color: "var(--evergreen)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      flex: "0 0 auto",
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              <Link href="/register" className="btn btn-primary">
                {t("ctaPrimary")} <span aria-hidden="true">→</span>
              </Link>
              <Link href="/how-it-works" className="btn btn-ghost">
                {t("ctaSecondary")}
              </Link>
            </div>
            <div
              style={{
                marginTop: 28,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--fg-faint)",
              }}
            >
              {t("footnote")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
