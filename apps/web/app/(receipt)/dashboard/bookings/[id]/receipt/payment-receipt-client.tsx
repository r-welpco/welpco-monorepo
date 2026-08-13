"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@welpco/ui/button";
import { useSession } from "next-auth/react";
import { useBookingById } from "@/lib/hooks/use-bookings";
import { useCustomerProfile } from "@/lib/hooks/use-profile";
import { usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import { usePaymentReceiptLabels } from "@/lib/i18n/use-dashboard-labels";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { publicWelperDisplayName } from "@/lib/display-name";
import { formatOfferingCategoryLabel } from "@/lib/utils/category-utils";
import styles from "./payment-receipt.module.css";

type PaymentReceiptClientProps = {
  bookingId: string;
  shouldPrint: boolean;
};

function shortReference(value: string): string {
  return value.slice(-8).toUpperCase();
}

function safeDateFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string | null,
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, ...(timeZone ? { timeZone } : {}) });
  } catch {
    return new Intl.DateTimeFormat(locale, options);
  }
}

export default function PaymentReceiptClient({
  bookingId,
  shouldPrint,
}: PaymentReceiptClientProps) {
  const locale = useLocale();
  const intlLocale = locale === "fr" ? "fr-CA" : "en-CA";
  const labels = usePaymentReceiptLabels();
  const categoryDisplayName = useCategoryDisplayName();
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const { data: booking, isLoading: bookingLoading, isError: bookingError } =
    useBookingById(bookingId);
  const isOwner = !!booking && currentUserId === booking.customerId;
  const { data: customerProfile, isLoading: customerLoading } = useCustomerProfile(
    currentUserId,
    isOwner,
  );
  const { data: welperProfile, isLoading: welperLoading } = usePublicWelperProfile(
    booking?.welperId,
    !!booking,
  );
  const [logoReady, setLogoReady] = useState(false);
  const printedRef = useRef(false);

  const receipt = booking?.serviceReceipt ?? null;
  const isAvailable =
    isOwner && booking?.paymentPhase === "captured" && receipt !== null;
  const dataLoading =
    sessionStatus === "loading" ||
    bookingLoading ||
    (isOwner && customerLoading) ||
    (!!booking && welperLoading);

  const bookingOffering = useMemo(
    () =>
      welperProfile?.serviceOfferings.find(
        (offering) => offering.id === booking?.serviceOfferingId,
      ) ?? null,
    [booking?.serviceOfferingId, welperProfile?.serviceOfferings],
  );

  const serviceName = bookingOffering
    ? formatOfferingCategoryLabel(bookingOffering, categoryDisplayName)
    : labels.serviceFallback;
  const customerName =
    [customerProfile?.firstName, customerProfile?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    booking?.customerFirstName?.trim() ||
    labels.customerFallback;
  const welperName = publicWelperDisplayName(welperProfile, labels.welperFallback);

  const issueDate = receipt?.sentToCustomerAt ?? receipt?.confirmedAt ?? null;
  const dateFormatter = safeDateFormatter(
    intlLocale,
    { year: "numeric", month: "long", day: "numeric" },
    booking?.timezoneName,
  );
  const timeFormatter = safeDateFormatter(
    intlLocale,
    { hour: "numeric", minute: "2-digit" },
    booking?.timezoneName,
  );
  const currencyFormatter = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: receipt?.currency?.toUpperCase() || "CAD",
    currencyDisplay: "symbol",
  });

  const billingStart = receipt ? new Date(receipt.billingCheckInAt) : null;
  const billingEnd = receipt ? new Date(receipt.billingCheckOutAt) : null;
  const durationMinutes =
    billingStart && billingEnd
      ? Math.max(0, Math.round((billingEnd.getTime() - billingStart.getTime()) / 60_000))
      : 0;
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const durationLabel =
    durationHours === 0
      ? labels.durationMinutes(remainingMinutes)
      : remainingMinutes === 0
        ? labels.durationHours(durationHours)
        : labels.durationHoursMinutes(durationHours, remainingMinutes);

  useEffect(() => {
    if (!shouldPrint || !isAvailable || dataLoading || !logoReady || printedRef.current) return;
    printedRef.current = true;

    let timer: ReturnType<typeof setTimeout> | undefined;
    void document.fonts.ready.then(() => {
      timer = setTimeout(() => window.print(), 100);
    });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [dataLoading, isAvailable, logoReady, shouldPrint]);

  if (dataLoading) {
    return (
      <main className={styles.statePage} aria-busy="true">
        <div className={styles.loadingCard} />
      </main>
    );
  }

  if (bookingError || !isAvailable || !receipt || !billingStart || !billingEnd) {
    return (
      <main className={styles.statePage}>
        <section className={styles.unavailableCard}>
          <ShieldCheck size={34} aria-hidden />
          <h1>{labels.unavailableTitle}</h1>
          <p>{labels.unavailableDescription}</p>
          <Button asChild variant="solid">
            <Link href={`/dashboard/bookings/${bookingId}`}>
              <ArrowLeft size={16} aria-hidden />
              {labels.backToBooking}
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.receiptShell}>
      <nav className={styles.actions} aria-label={labels.title}>
        <Button asChild variant="soft" color="gray">
          <Link href={`/dashboard/bookings/${bookingId}`}>
            <ArrowLeft size={16} aria-hidden />
            {labels.backToBooking}
          </Link>
        </Button>
        <Button variant="solid" onClick={() => window.print()}>
          <Printer size={16} aria-hidden />
          {labels.print}
        </Button>
      </nav>

      <article className={styles.receipt} aria-labelledby="receipt-title">
        <header className={styles.header}>
          <Image
            src="/logos/Welpco_Imagotype_Primary_Reg.svg"
            alt="Welpco"
            width={214}
            height={86}
            priority
            onLoad={() => setLogoReady(true)}
          />
          <div className={styles.headingBlock}>
            <h1 id="receipt-title">{labels.title}</h1>
            <div className={styles.paidBadge}>
              <CheckCircle2 size={17} aria-hidden />
              {labels.paid}
            </div>
          </div>
        </header>

        <div className={styles.rule} />

        <section className={styles.metaGrid}>
          <div>
            <span>{labels.bookingReference}</span>
            <strong>{shortReference(booking.id)}</strong>
          </div>
          <div>
            <span>{labels.issuedOn}</span>
            <strong>{issueDate ? dateFormatter.format(new Date(issueDate)) : "—"}</strong>
          </div>
        </section>

        <section className={styles.peopleGrid}>
          <div className={styles.infoCard}>
            <UserRound size={20} aria-hidden />
            <div>
              <span>{labels.customer}</span>
              <strong>{customerName}</strong>
            </div>
          </div>
          <div className={styles.infoCard}>
            <ShieldCheck size={20} aria-hidden />
            <div>
              <span>{labels.welper}</span>
              <strong>{welperName}</strong>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>{labels.serviceDetails}</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <ShieldCheck size={18} aria-hidden />
              <span>{labels.service}</span>
              <strong>{serviceName}</strong>
            </div>
            <div className={styles.detailItem}>
              <CalendarDays size={18} aria-hidden />
              <span>{labels.serviceDate}</span>
              <strong>{dateFormatter.format(billingStart)}</strong>
            </div>
            <div className={styles.detailItem}>
              <Clock3 size={18} aria-hidden />
              <span>{labels.billingPeriod}</span>
              <strong>
                {timeFormatter.format(billingStart)} – {timeFormatter.format(billingEnd)}
              </strong>
            </div>
            <div className={styles.detailItem}>
              <Clock3 size={18} aria-hidden />
              <span>{labels.duration}</span>
              <strong>{durationLabel}</strong>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.currencyIcon} aria-hidden>$</span>
              <span>{labels.hourlyRate}</span>
              <strong>{currencyFormatter.format(receipt.hourlyRate)}</strong>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.summarySection}`}>
          <h2>{labels.paymentSummary}</h2>
          <dl className={styles.summary}>
            <div>
              <dt>{labels.subtotal}</dt>
              <dd>{currencyFormatter.format(receipt.subtotalCents / 100)}</dd>
            </div>
            <div>
              <dt>{labels.tax}</dt>
              <dd>{currencyFormatter.format(receipt.taxCents / 100)}</dd>
            </div>
            <div className={styles.totalRow}>
              <dt>{labels.totalPaid}</dt>
              <dd>{currencyFormatter.format(receipt.totalCents / 100)}</dd>
            </div>
          </dl>
        </section>

        <footer className={styles.footer}>
          <p><ShieldCheck size={17} aria-hidden />{labels.securePayment}</p>
          <p>{labels.support}</p>
          <strong>welpco.com</strong>
        </footer>
      </article>
    </main>
  );
}
