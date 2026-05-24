"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { BookingStatus } from "@/lib/services/booking-service";
import { useWelperServiceAreaStepLabels } from "@/lib/i18n/use-auth-labels";

export type WelperNavChromeLabels = {
  mobileNavMenu: string;
  feedback: string;
  documentation: string;
  openNavAria: string;
  bellAria: string;
  bellUnreadAria: (count: number) => string;
  searchPlaceholder: string;
  userMenuAria: string;
};

export type WelperNavLabels = {
  roleBadge: string;
  tabs: {
    dashboard: string;
    messages: string;
    bookings: string;
    profile: string;
    settings: string;
  };
  userMenu: {
    profile: string;
    accountSettings: string;
    signOut: string;
  };
  themeMenu: string;
  theme: {
    system: string;
    light: string;
    dark: string;
  };
  languageMenu: string;
  language: {
    english: string;
    french: string;
  };
  chrome: WelperNavChromeLabels;
};

export type CustomerNavLabels = {
  roleBadge: string;
  tabs: {
    dashboard: string;
    search: string;
    bookings: string;
    messages: string;
    profile: string;
    settings: string;
  };
  userMenu: {
    profile: string;
    accountSettings: string;
    signOut: string;
  };
  themeMenu: string;
  theme: {
    system: string;
    light: string;
    dark: string;
  };
  languageMenu: string;
  language: {
    english: string;
    french: string;
  };
  chrome: WelperNavChromeLabels;
};

export function useCustomerNavLabels(): CustomerNavLabels {
  const t = useTranslations("dashboard.nav");
  const chrome = useTranslations("dashboard.nav.chrome");
  return {
    roleBadge: t("customerRoleBadge"),
    tabs: {
      dashboard: t("tabs.dashboard"),
      search: t("tabs.search"),
      bookings: t("tabs.bookings"),
      messages: t("tabs.messages"),
      profile: t("tabs.profile"),
      settings: t("tabs.settings"),
    },
    userMenu: {
      profile: t("userMenu.profile"),
      accountSettings: t("userMenu.accountSettings"),
      signOut: t("userMenu.signOut"),
    },
    themeMenu: t("themeMenu"),
    theme: {
      system: t("theme.system"),
      light: t("theme.light"),
      dark: t("theme.dark"),
    },
    languageMenu: t("languageMenu"),
    language: {
      english: t("language.english"),
      french: t("language.french"),
    },
    chrome: {
      mobileNavMenu: chrome("mobileNavMenu"),
      feedback: chrome("feedback"),
      documentation: chrome("documentation"),
      openNavAria: chrome("openNavAria"),
      bellAria: chrome("bellAria"),
      bellUnreadAria: (count: number) => chrome("bellUnreadAria", { count }),
      searchPlaceholder: chrome("customerSearchPlaceholder"),
      userMenuAria: chrome("userMenuAria"),
    },
  };
}

export function useWelperNavLabels(): WelperNavLabels {
  const t = useTranslations("dashboard.nav");
  const chrome = useTranslations("dashboard.nav.chrome");
  return {
    roleBadge: t("roleBadge"),
    tabs: {
      dashboard: t("tabs.dashboard"),
      messages: t("tabs.messages"),
      bookings: t("tabs.bookings"),
      profile: t("tabs.profile"),
      settings: t("tabs.settings"),
    },
    userMenu: {
      profile: t("userMenu.profile"),
      accountSettings: t("userMenu.accountSettings"),
      signOut: t("userMenu.signOut"),
    },
    themeMenu: t("themeMenu"),
    theme: {
      system: t("theme.system"),
      light: t("theme.light"),
      dark: t("theme.dark"),
    },
    languageMenu: t("languageMenu"),
    language: {
      english: t("language.english"),
      french: t("language.french"),
    },
    chrome: {
      mobileNavMenu: chrome("mobileNavMenu"),
      feedback: chrome("feedback"),
      documentation: chrome("documentation"),
      openNavAria: chrome("openNavAria"),
      bellAria: chrome("bellAria"),
      bellUnreadAria: (count: number) => chrome("bellUnreadAria", { count }),
      searchPlaceholder: chrome("searchPlaceholder"),
      userMenuAria: chrome("userMenuAria"),
    },
  };
}

export function useDashboardCommonLabels() {
  const t = useTranslations("dashboard.common");
  return {
    back: t("back"),
    genericError: t("genericError"),
  };
}

export function useDisputeLabels() {
  const t = useTranslations("dashboard.disputes");
  const d = useTranslations("dashboard.disputes.detail");
  return {
    backToBookings: t("backToBookings"),
    title: t("title"),
    description: t("description"),
    loadListFailed: t("loadListFailed"),
    emptyTitle: t("emptyTitle"),
    emptyDescription: t("emptyDescription"),
    viewBookings: t("viewBookings"),
    viewReport: t("viewReport"),
    openBooking: t("openBooking"),
    paginationAria: t("paginationAria"),
    prevPageAria: t("prevPageAria"),
    nextPageAria: t("nextPageAria"),
    pageOf: (page: number, totalPages: number, total: number) =>
      t("pageOf", { page, totalPages, total }),
    detail: {
      backToReports: d("backToReports"),
      loadingAria: d("loadingAria"),
      loadFailed: d("loadFailed"),
      notFoundTitle: d("notFoundTitle"),
      notFoundDescription: d("notFoundDescription"),
      viewAllReports: d("viewAllReports"),
      reportedAt: (date: string) => d("reportedAt", { date }),
      withdrawReport: d("withdrawReport"),
      withdrawnCallout: d("withdrawnCallout"),
      whatHappened: d("whatHappened"),
      noDescription: d("noDescription"),
      evidence: d("evidence"),
      evidenceCount: (count: number) => d("evidenceCount", { count }),
      whatHappensNext: d("whatHappensNext"),
      whatHappensNextDescription: d("whatHappensNextDescription"),
      messageAboutBooking: d("messageAboutBooking"),
      openTheBooking: d("openTheBooking"),
      withdrawConfirmTitle: d("withdrawConfirmTitle"),
      withdrawConfirmDescription: d("withdrawConfirmDescription"),
      withdrawConfirmLabel: d("withdrawConfirmLabel"),
      withdrawCancelLabel: d("withdrawCancelLabel"),
      withdrawFailed: d("withdrawFailed"),
    },
  };
}

/** User-menu chrome labels (theme, language, account) for customer or welper headers. */
export function useDashboardUserMenuLabels(): Pick<
  WelperNavLabels,
  "userMenu" | "themeMenu" | "theme" | "languageMenu" | "language"
> {
  const t = useTranslations("dashboard.nav");
  return {
    userMenu: {
      profile: t("userMenu.profile"),
      accountSettings: t("userMenu.accountSettings"),
      signOut: t("userMenu.signOut"),
    },
    themeMenu: t("themeMenu"),
    theme: {
      system: t("theme.system"),
      light: t("theme.light"),
      dark: t("theme.dark"),
    },
    languageMenu: t("languageMenu"),
    language: {
      english: t("language.english"),
      french: t("language.french"),
    },
  };
}

export type WelperHomeLabels = {
  greeting: (name: string) => string;
  loading: string;
  setupIncomplete: string;
  pendingJobs: (count: number) => string;
  activeJobs: (count: number) => string;
  noJobsDiscoverable: string;
  noJobsNotDiscoverable: string;
  statsSectionTitle: string;
  stats: {
    activeJobs: string;
    totalEarnings: string;
    completedJobs: string;
  };
  statsFootnote: (count: number) => string;
  activityTitle: string;
  quickActions: {
    title: string;
    viewJobs: string;
    viewJobsDescription: string;
    setAvailability: string;
    setAvailabilityDescription: string;
    openMessages: string;
    openMessagesDescription: string;
  };
  recentActivity: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    completeProfile: string;
  };
};

export function useWelperHomeLabels(): WelperHomeLabels {
  const t = useTranslations("dashboard.home");
  return {
    greeting: (name) => t("greeting", { name }),
    loading: t("loading"),
    setupIncomplete: t("setupIncomplete"),
    pendingJobs: (count) => t("pendingJobs", { count }),
    activeJobs: (count) => t("activeJobs", { count }),
    noJobsDiscoverable: t("noJobsDiscoverable"),
    noJobsNotDiscoverable: t("noJobsNotDiscoverable"),
    statsSectionTitle: t("statsSectionTitle"),
    stats: {
      activeJobs: t("stats.activeJobs"),
      totalEarnings: t("stats.totalEarnings"),
      completedJobs: t("stats.completedJobs"),
    },
    statsFootnote: (count) => t("statsFootnote", { count }),
    activityTitle: t("activityTitle"),
    quickActions: {
      title: t("quickActions.title"),
      viewJobs: t("quickActions.viewJobs"),
      viewJobsDescription: t("quickActions.viewJobsDescription"),
      setAvailability: t("quickActions.setAvailability"),
      setAvailabilityDescription: t("quickActions.setAvailabilityDescription"),
      openMessages: t("quickActions.openMessages"),
      openMessagesDescription: t("quickActions.openMessagesDescription"),
    },
    recentActivity: {
      title: t("recentActivity.title"),
      emptyTitle: t("recentActivity.emptyTitle"),
      emptyDescription: t("recentActivity.emptyDescription"),
      completeProfile: t("recentActivity.completeProfile"),
    },
  };
}

const BOOKING_STATUS_KEYS = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "payment_released",
  "cancelled",
  "declined",
  "disputed",
  "no_show",
] as const;

type BookingStatusKey = (typeof BOOKING_STATUS_KEYS)[number];

function isBookingStatusKey(status: string): status is BookingStatusKey {
  return (BOOKING_STATUS_KEYS as readonly string[]).includes(status);
}

/** Localized booking status label for welper dashboard surfaces. */
export function useBookingStatusLabel() {
  const t = useTranslations("dashboard.bookings.status");
  return useCallback(
    (status: string) => {
      if (isBookingStatusKey(status)) {
        return t(status);
      }
      return status.replace(/_/g, " ");
    },
    [t],
  );
}

export function useWelperBookingsLabels() {
  const t = useTranslations("dashboard.bookings");
  const statusLabel = useBookingStatusLabel();

  const tabLabels: Record<string, string> = {
    all: t("tabs.all"),
    pending: t("tabs.pending"),
    upcoming: t("tabs.upcoming"),
    active: t("tabs.active"),
    completed: t("tabs.completed"),
    cancelled: t("tabs.cancelled"),
    declined: t("tabs.declined"),
    disputed: t("tabs.disputed"),
  };

  return {
    title: t("title"),
    subtitle: t("subtitle"),
    signInRequired: t("signInRequired"),
    loadFailed: t("loadFailed"),
    genericError: t("genericError"),
    emptyTitle: t("emptyTitle"),
    emptyAll: t("emptyAll"),
    emptyFiltered: (status: string) =>
      t("emptyFiltered", { status: statusLabel(status) }),
    created: (date: string) => t("created", { date }),
    decline: t("decline"),
    accept: t("accept"),
    cancelBooking: t("cancelBooking"),
    pageOf: (page: number, total: number) => t("pageOf", { page, total }),
    prevPage: t("prevPage"),
    nextPage: t("nextPage"),
    acceptFailed: t("acceptFailed"),
    declineFailed: t("declineFailed"),
    cancelFailed: t("cancelFailed"),
    tabLabels,
    statusLabel,
    confirm: {
      acceptTitle: t("confirm.acceptTitle"),
      acceptDescription: t("confirm.acceptDescription"),
      acceptConfirm: t("confirm.acceptConfirm"),
      acceptCancel: t("confirm.acceptCancel"),
      declineTitle: t("confirm.declineTitle"),
      declineDescription: t("confirm.declineDescription"),
      declineConfirm: t("confirm.declineConfirm"),
      declineCancel: t("confirm.declineCancel"),
      declineReasonLabel: t("confirm.declineReasonLabel"),
      declineReasonPlaceholder: t("confirm.declineReasonPlaceholder"),
      cancelTitle: t("confirm.cancelTitle"),
      cancelDescription: t("confirm.cancelDescription"),
      cancelConfirm: t("confirm.cancelConfirm"),
      cancelCancel: t("confirm.cancelCancel"),
      cancelReasonLabel: t("confirm.cancelReasonLabel"),
      cancelReasonPlaceholder: t("confirm.cancelReasonPlaceholder"),
    },
  };
}

export function useWelperMessagesLabels() {
  const t = useTranslations("dashboard.messages");
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    backToBookings: t("backToBookings"),
    signInTitle: t("signInTitle"),
    signInDescription: t("signInDescription"),
    conversations: t("conversations"),
    conversationsHint: t("conversationsHint"),
    loadError: t("loadError"),
    emptyTitle: t("emptyTitle"),
    emptyDescription: t("emptyDescription"),
    unreadAria: t("unreadAria"),
    counterpartyCustomer: (id: string) =>
      t("counterpartyCustomer", { id: id.slice(-8).toUpperCase() }),
    counterpartyWelper: (id: string) =>
      t("counterpartyWelper", { id: id.slice(-8).toUpperCase() }),
    bookingRef: (id: string) =>
      t("bookingRef", { id: id.slice(-8).toUpperCase() }),
    lastMessage: (preview: string) => t("lastMessage", { preview }),
    noneSelected: t("noneSelected"),
    pickFromList: t("pickFromList"),
    threadTitle: t("threadTitle"),
    threadBooking: (id: string) =>
      t("threadBooking", { id: id.slice(-8).toUpperCase() }),
    viewBooking: t("viewBooking"),
    sendFailed: t("sendFailed"),
  };
}

export function useDashboardSettingsLabels() {
  const t = useTranslations("dashboard.settings");
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    subtitleWelper: t("subtitleWelper"),
    signInTitle: t("signInTitle"),
    signInDescription: t("signInDescription"),
    tabs: {
      account: t("tabs.account"),
      privacy: t("tabs.privacy"),
      notifications: t("tabs.notifications"),
      appearance: t("tabs.appearance"),
      payment: t("tabs.payment"),
    },
    emailUpdated: t("emailUpdated"),
    passwordUpdated: t("passwordUpdated"),
    genericError: t("genericError"),
    deleteAccount: t("deleteAccount"),
    deleteDescription: t("deleteDescription"),
    deleteButton: t("deleteButton"),
    privacyCustomerNote: t("privacyCustomerNote"),
  };
}

/** @deprecated Use useDashboardSettingsLabels */
export const useWelperSettingsLabels = useDashboardSettingsLabels;

export function useWelperProfileFormLabels() {
  const t = useTranslations("dashboard.profile.form");
  return {
    title: t("title"),
    description: t("description"),
    firstName: t("firstName"),
    lastName: t("lastName"),
    phone: t("phone"),
    bio: t("bio"),
    bioPlaceholder: t("bioPlaceholder"),
    charCount: (count: number) => t("charCount", { count }),
    visibility: t("visibility"),
    visibilityHint: t("visibilityHint"),
    visibilityCurrent: (value: string) => t("visibilityCurrent", { value }),
    save: t("save"),
    saving: t("saving"),
  };
}

export function useWelperProfileLabels() {
  const t = useTranslations("dashboard.profile");
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    loadError: t("loadError"),
    tabs: {
      overview: t("tabs.overview"),
      profile: t("tabs.profile"),
      offerings: t("tabs.offerings"),
      availability: t("tabs.availability"),
      serviceArea: t("tabs.serviceArea"),
      backgroundCheck: t("tabs.backgroundCheck"),
      payout: t("tabs.payout"),
    },
    overview: {
      quickStats: t("overview.quickStats"),
      serviceOfferings: t("overview.serviceOfferings"),
      activeOfferings: t("overview.activeOfferings"),
    },
    photo: {
      alt: t("photo.alt"),
      requiredDescription: t("photo.requiredDescription"),
      optionalDescription: t("photo.optionalDescription"),
    },
    availability: {
      calendarHint: t("availability.calendarHint"),
    },
    uncategorized: t("uncategorized"),
    defaultServiceTitle: t("defaultServiceTitle"),
    serviceArea: {
      title: t("serviceArea.title"),
      description: t("serviceArea.description"),
    },
  };
}

export function useWelperBookingDetailLabels() {
  const t = useTranslations("dashboard.bookingsDetail");
  return {
    backToBookings: t("backToBookings"),
    bookingTitle: (id: string) => t("bookingTitle", { id }),
    loadFailed: t("loadFailed"),
    notFoundHint: t("notFoundHint"),
    timeline: t("timeline"),
    timelineLabels: {
      created: t("timelineCreated"),
      accepted: t("timelineAccepted"),
      checkedIn: t("timelineCheckedIn"),
      checkedOut: t("timelineCheckedOut"),
      receiptSent: t("timelineReceiptSent"),
      completed: t("timelineCompleted"),
      cancelled: t("timelineCancelled"),
      declined: t("timelineDeclined"),
    },
    quickActionsTitle: t("quickActionsTitle"),
    quickActionsHint: t("quickActionsHint"),
    checkIn: t("checkIn"),
    checkOut: t("checkOut"),
    acceptBooking: t("acceptBooking"),
    overviewTitle: t("overviewTitle"),
    serviceFallback: (id: string) => t("serviceFallback", { id }),
    scheduleTbd: t("scheduleTbd"),
    peopleTitle: t("peopleTitle"),
    customer: t("customer"),
    welper: t("welper"),
    you: t("you"),
    pricingTitle: t("pricingTitle"),
    hourlyRate: t("hourlyRate"),
    agreedTotal: t("agreedTotal"),
    actionsTitle: t("actionsTitle"),
    actionsHint: t("actionsHint"),
    disputeBlocked: t("disputeBlocked"),
    yourReview: t("yourReview"),
    reviewRating: (rating: number) => t("reviewRating", { rating }),
    editReview: t("editReview"),
    reportInProgress: t("reportInProgress"),
    reportProblem: t("reportProblem"),
    messageCustomer: t("messageCustomer"),
    reviewCustomer: t("reviewCustomer"),
    serviceReceiptTitle: t("serviceReceiptTitle"),
    serviceReceiptSubtitle: t("serviceReceiptSubtitle"),
    confirmed: t("confirmed"),
    billingPeriod: t("billingPeriod"),
    rateOnReceipt: t("rateOnReceipt"),
    amountCharged: t("amountCharged"),
    paymentTitle: t("paymentTitle"),
    locationTitle: t("locationTitle"),
    notesTitle: t("notesTitle"),
    attachmentsTitle: t("attachmentsTitle"),
    confirmCheckIn: {
      title: t("confirmCheckInTitle"),
      description: t("confirmCheckInDescription"),
      confirm: t("confirmCheckInConfirm"),
      cancel: t("confirmCheckInCancel"),
    },
    checkInFailed: t("checkInFailed"),
    receiptDialog: {
      title: t("receiptDialogTitle"),
      description: t("receiptDialogDescription"),
      billingIn: t("receiptBillingIn"),
      billingOut: t("receiptBillingOut"),
      notes: t("receiptNotes"),
      submit: t("receiptSubmit"),
      submitting: t("receiptSubmitting"),
      extraAuth: t("receiptExtraAuth"),
      failed: t("receiptFailed"),
    },
    reviewDialog: {
      editTitle: t("reviewDialogEditTitle"),
      newTitle: t("reviewDialogNewTitle"),
      editDescription: t("reviewDialogEditDescription"),
      newDescription: t("reviewDialogNewDescription"),
      saveChanges: t("reviewSaveChanges"),
      skip: t("reviewSkip"),
    },
    dispute: {
      title: t("disputeTitle"),
      description: t("disputeDescription"),
    },
    attachmentFallback: t("attachmentFallback"),
    previewUnavailable: t("previewUnavailable"),
  };
}

export function useWelperProfileOfferingLabels() {
  const t = useTranslations("dashboard.profile.offerings");
  return {
    listTitle: t("listTitle"),
    listDescription: t("listDescription"),
    addOffering: t("addOffering"),
    searchPlaceholder: t("searchPlaceholder"),
    active: t("active"),
    inactive: t("inactive"),
    edit: t("edit"),
    delete: t("delete"),
    activeLabel: t("activeLabel"),
    dialogAdd: t("dialogAdd"),
    dialogEdit: t("dialogEdit"),
    deleteTitle: t("deleteTitle"),
    deleteDescription: t("deleteDescription"),
    deleteConfirm: t("deleteConfirm"),
    deleteCancel: t("deleteCancel"),
    allCategories: t("allCategories"),
    allStatus: t("allStatus"),
    activeOnly: t("activeOnly"),
    inactiveOnly: t("inactiveOnly"),
    filterByCategoryAria: t("filterByCategoryAria"),
    filterByStatusAria: t("filterByStatusAria"),
    showingCount: (shown: number, total: number) => t("showingCount", { shown, total }),
    noOfferingsFound: t("noOfferingsFound"),
    emptyFirst: t("emptyFirst"),
    emptyFiltered: t("emptyFiltered"),
  };
}

export function useWelperServiceOfferingFormLabels() {
  const t = useTranslations("dashboard.profile.offerings.form");
  const tOverride = useTranslations("dashboard.profile.offerings.form.serviceAreaSelector");
  const serviceArea = useWelperServiceAreaStepLabels();
  return {
    pageTitle: t("pageTitle"),
    pageDescription: t("pageDescription"),
    title: t("title"),
    titlePlaceholder: t("titlePlaceholder"),
    category: t("category"),
    subcategoriesOptional: t("subcategoriesOptional"),
    subcategoriesHint: t("subcategoriesHint"),
    hourlyRate: t("hourlyRate"),
    experienceYears: t("experienceYears"),
    description: t("description"),
    descriptionPlaceholder: t("descriptionPlaceholder"),
    serviceArea: t("serviceArea"),
    serviceAreaOverrideHint: t("serviceAreaOverrideHint"),
    usingDefaultServiceArea: (km: number, city: string) =>
      t("usingDefaultServiceArea", { km, city }),
    activeStatus: t("activeStatus"),
    activeStatusHint: t("activeStatusHint"),
    save: t("save"),
    saving: t("saving"),
    validation: {
      titleRequired: t("validation.titleRequired"),
      titleMax: t("validation.titleMax"),
      categoryRequired: t("validation.categoryRequired"),
      rateMin: t("validation.rateMin"),
      rateMax: t("validation.rateMax"),
      experienceMin: t("validation.experienceMin"),
      experienceMax: t("validation.experienceMax"),
      descriptionMin: t("validation.descriptionMin"),
      descriptionMax: t("validation.descriptionMax"),
      cityRequired: t("validation.cityRequired"),
      stateRequired: t("validation.stateRequired"),
      postalRequired: t("validation.postalRequired"),
      radiusMin: t("validation.radiusMin"),
      radiusMax: t("validation.radiusMax"),
    },
    serviceAreaSelector: {
      ...serviceArea.selector,
      override: {
        overrideDescription: tOverride("overrideDescription"),
        useDefault: tOverride("useDefault"),
        defineCustom: tOverride("defineCustom"),
        usingDefault: (km: number, city: string) => tOverride("usingDefault", { km, city }),
      },
    },
    serviceAreaAddress: serviceArea.address,
  };
}

export function useWelperAvailabilityExceptionsLabels() {
  const t = useTranslations("dashboard.profile.availabilityExceptions");
  return {
    title: t("title"),
    description: t("description"),
    addException: t("addException"),
    dialogTitle: t("dialogTitle"),
    dialogDescription: t("dialogDescription"),
    startDate: t("startDate"),
    endDateOptional: t("endDateOptional"),
    endDateHint: t("endDateHint"),
    availabilityStatus: t("availabilityStatus"),
    available: t("available"),
    unavailable: t("unavailable"),
    reasonOptional: t("reasonOptional"),
    reasonPlaceholder: t("reasonPlaceholder"),
    charCount: (count: number, max: number) => t("charCount", { count, max }),
    cancel: t("cancel"),
    addExceptionConfirm: t("addExceptionConfirm"),
    pickDate: t("pickDate"),
    endDateInvalid: t("endDateInvalid"),
    reasonTooLong: (max: number) => t("reasonTooLong", { max }),
    emptyCallout: t("emptyCallout"),
    removeAria: t("removeAria"),
    holidaysTitle: t("holidaysTitle"),
    holidaysDescription: t("holidaysDescription"),
    loadingHolidays: t("loadingHolidays"),
    addHolidayUnavailable: t("addHolidayUnavailable"),
  };
}

export function useWelperAvailabilityScheduleLabels() {
  const t = useTranslations("dashboard.profile.availabilitySchedule");
  const dayShort = t.raw("dayShort") as string[];
  return {
    regularTitle: t("regularTitle"),
    regularDescription: t("regularDescription"),
    addSlotsTitle: t("addSlotsTitle"),
    addSlotsHint: t("addSlotsHint"),
    startTime: t("startTime"),
    endTime: t("endTime"),
    addSlotsButton: t("addSlotsButton"),
    currentSlotsTitle: t("currentSlotsTitle"),
    to: t("to"),
    removeSlotAria: t("removeSlotAria"),
    emptyCallout: t("emptyCallout"),
    endAfterStart: t("endAfterStart"),
    statsWithExceptions: t("statsWithExceptions"),
    statsRegularOnly: t("statsRegularOnly"),
    dayLabels: [0, 1, 2, 3, 4, 5, 6].map((d) => dayShort[d] ?? ""),
    dayNames: {
      0: dayShort[0],
      1: dayShort[1],
      2: dayShort[2],
      3: dayShort[3],
      4: dayShort[4],
      5: dayShort[5],
      6: dayShort[6],
    },
  };
}

export function useDashboardNotificationLabels() {
  const t = useTranslations("dashboard.notifications");
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    markAllRead: t("markAllRead"),
    unreadCount: (count: number) => t("unreadCount", { count }),
    bellAria: t("bellAria"),
    bellUnreadAria: (count: number) => t("bellUnreadAria", { count }),
    view: t("view"),
    filterAll: t("filterAll"),
    filterUnread: t("filterUnread"),
    filterRead: t("filterRead"),
    emptyAllTitle: t("emptyAllTitle"),
    emptyUnreadTitle: t("emptyUnreadTitle"),
    emptyReadTitle: t("emptyReadTitle"),
    emptyAllDescription: t("emptyAllDescription"),
    emptyUnreadDescription: t("emptyUnreadDescription"),
    emptyReadDescription: t("emptyReadDescription"),
  };
}

export function useEmailVerificationDialogLabels() {
  const t = useTranslations("dashboard.emailVerification");
  return {
    title: t("title"),
    description: (email: string) => t("description", { email }),
    resend: t("resend"),
    close: t("close"),
    emailFallback: t("emailFallback"),
  };
}

export type PersonalizationAppearanceLabels = {
  title: string;
  description: string;
  themeMode: string;
  translucentTheme: string;
  translucentThemeHint: string;
  background: string;
  theme: Record<"light" | "dark" | "system", { name: string; description: string }>;
  /** Maps `backgrounds.ts` id → localized name/description. */
  backgroundById: Record<string, { name: string; description: string }>;
};

export function usePersonalizationSettingsLabels(): PersonalizationAppearanceLabels {
  const t = useTranslations("dashboard.settingsForms");
  const ta = useTranslations("dashboard.settingsForms.appearance");
  return {
    title: t("personalizationTitle"),
    description: t("personalizationDescription"),
    themeMode: t("themeMode"),
    translucentTheme: t("translucentTheme"),
    translucentThemeHint: t("translucentThemeHint"),
    background: t("background"),
    theme: {
      light: { name: ta("theme.light.name"), description: ta("theme.light.description") },
      dark: { name: ta("theme.dark.name"), description: ta("theme.dark.description") },
      system: { name: ta("theme.system.name"), description: ta("theme.system.description") },
    },
    backgroundById: {
      default: {
        name: ta("backgrounds.default.name"),
        description: ta("backgrounds.default.description"),
      },
      "blue-ocean": {
        name: ta("backgrounds.blueOcean.name"),
        description: ta("backgrounds.blueOcean.description"),
      },
      "purple-sunset": {
        name: ta("backgrounds.purpleSunset.name"),
        description: ta("backgrounds.purpleSunset.description"),
      },
      "warm-sunrise": {
        name: ta("backgrounds.warmSunrise.name"),
        description: ta("backgrounds.warmSunrise.description"),
      },
      "cool-mint": {
        name: ta("backgrounds.coolMint.name"),
        description: ta("backgrounds.coolMint.description"),
      },
      "minimal-gray": {
        name: ta("backgrounds.minimalGray.name"),
        description: ta("backgrounds.minimalGray.description"),
      },
    },
  };
}

export function useDashboardSettingsFormLabels() {
  const t = useTranslations("dashboard.settingsForms");
  return {
    emailTitle: t("emailTitle"),
    emailDescription: t("emailDescription"),
    emailHint: t("emailHint"),
    emailLabel: t("emailLabel"),
    emailSubmit: t("emailSubmit"),
    emailSubmitting: t("emailSubmitting"),
    passwordTitle: t("passwordTitle"),
    passwordDescription: t("passwordDescription"),
    passwordCurrent: t("passwordCurrent"),
    passwordNew: t("passwordNew"),
    passwordConfirm: t("passwordConfirm"),
    passwordSubmit: t("passwordSubmit"),
    passwordSubmitting: t("passwordSubmitting"),
    personalizationTitle: t("personalizationTitle"),
    personalizationDescription: t("personalizationDescription"),
    themeMode: t("themeMode"),
    translucentTheme: t("translucentTheme"),
    translucentThemeHint: t("translucentThemeHint"),
    background: t("background"),
    deleteTitle: t("deleteTitle"),
    deleteDescription: t("deleteDescription"),
    deleteConfirmLabel: t("deleteConfirmLabel"),
    deleteSubmit: t("deleteSubmit"),
    deleteCancel: t("deleteCancel"),
  };
}

/** Map tab filter value to localized label key. */
export function welperBookingTabLabel(
  labels: ReturnType<typeof useWelperBookingsLabels>,
  value: BookingStatus | undefined,
): string {
  if (value === undefined) return labels.tabLabels.all;
  if (value === "accepted") return labels.tabLabels.upcoming;
  if (value === "in_progress") return labels.tabLabels.active;
  if (value === "pending") return labels.tabLabels.pending;
  if (value === "completed") return labels.tabLabels.completed;
  if (value === "cancelled") return labels.tabLabels.cancelled;
  if (value === "declined") return labels.tabLabels.declined;
  if (value === "disputed") return labels.tabLabels.disputed;
  return labels.statusLabel(value);
}
