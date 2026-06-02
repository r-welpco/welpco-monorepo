"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ProfilePhotoUploadLabels } from "@welpco/ui/platform/profile-management";
import type { WeeklyAvailabilityDisplayLabels } from "@welpco/ui/platform";
import type { BookingStatus } from "@/lib/services/booking-service";
import { useAuthRegisterStep } from "@/lib/i18n/auth-message-templates";
import { useWelperServiceAreaStepLabels } from "@/lib/i18n/use-auth-labels";
import { PLATFORM_SERVICE_FEE_PERCENT } from "@welpco/ui/platform/profile-management";

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
    marketplace: string;
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
    marketplace: string;
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
      marketplace: t("tabs.marketplace"),
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
      marketplace: t("tabs.marketplace"),
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
    cancel: t("cancel"),
    genericError: t("genericError"),
    turnstileComplete: t("turnstileComplete"),
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

export type CustomerHomeLabels = {
  greeting: (name: string) => string;
  loading: string;
  setupIncomplete: string;
  upcomingBookings: (count: number) => string;
  noUpcomingBookings: string;
  statsSectionTitle: string;
  stats: {
    activeBookings: string;
    bookingsCompleted: string;
    favoriteWelpers: string;
  };
  statsFootnote: (count: number) => string;
  activityTitle: string;
  quickActions: {
    title: string;
    findWelper: string;
    findWelperDescription: string;
    viewBookings: string;
    viewBookingsDescription: string;
    openMessages: string;
    openMessagesDescription: string;
  };
  recentActivity: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    findWelper: string;
  };
};

export function useCustomerHomeLabels(): CustomerHomeLabels {
  const t = useTranslations("dashboard.home.customer");
  return {
    greeting: (name) => t("greeting", { name }),
    loading: t("loading"),
    setupIncomplete: t("setupIncomplete"),
    upcomingBookings: (count) => t("upcomingBookings", { count }),
    noUpcomingBookings: t("noUpcomingBookings"),
    statsSectionTitle: t("statsSectionTitle"),
    stats: {
      activeBookings: t("stats.activeBookings"),
      bookingsCompleted: t("stats.bookingsCompleted"),
      favoriteWelpers: t("stats.favoriteWelpers"),
    },
    statsFootnote: (count) => t("statsFootnote", { count }),
    activityTitle: t("activityTitle"),
    quickActions: {
      title: t("quickActions.title"),
      findWelper: t("quickActions.findWelper"),
      findWelperDescription: t("quickActions.findWelperDescription"),
      viewBookings: t("quickActions.viewBookings"),
      viewBookingsDescription: t("quickActions.viewBookingsDescription"),
      openMessages: t("quickActions.openMessages"),
      openMessagesDescription: t("quickActions.openMessagesDescription"),
    },
    recentActivity: {
      title: t("recentActivity.title"),
      emptyTitle: t("recentActivity.emptyTitle"),
      emptyDescription: t("recentActivity.emptyDescription"),
      findWelper: t("recentActivity.findWelper"),
    },
  };
}

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
  const locale = useLocale();
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
    subtitleCustomer: t("subtitleCustomer"),
    browseServices: t("browseServices"),
    signInRequired: t("signInRequired"),
    loadFailed: t("loadFailed"),
    genericError: t("genericError"),
    emptyTitle: t("emptyTitle"),
    emptyAll: t("emptyAll"),
    emptyFiltered: (status: string) =>
      t("emptyFiltered", { status: statusLabel(status) }),
    created: (date: string) => t("created", { date }),
    formatDuration: (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h === 0) return t("durationMinutes", { minutes: m });
      if (m === 0) return t("durationHours", { hours: h });
      return t("durationHoursMinutes", { hours: h, minutes: m });
    },
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
        style: "currency",
        currency: "CAD",
      }).format(amount),
    decline: t("decline"),
    accept: t("accept"),
    cancelBooking: t("cancelBooking"),
    viewDetails: t("viewDetails"),
    customerFallback: t("customerFallback"),
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
      cancelDescriptionCustomer: t("confirm.cancelDescriptionCustomer"),
      cancelConfirm: t("confirm.cancelConfirm"),
      cancelCancel: t("confirm.cancelCancel"),
      cancelReasonLabel: t("confirm.cancelReasonLabel"),
      cancelReasonPlaceholder: t("confirm.cancelReasonPlaceholder"),
    },
  };
}

export function useCustomerPreviewLabels() {
  const t = useTranslations("dashboard.customerPreview");
  return {
    unknownName: t("unknownName"),
    statsHeading: t("statsHeading"),
    loadFailed: t("loadFailed"),
    noReviews: t("noReviews"),
    ratingLine: (rating: string, count: number) => t("ratingLine", { rating, count }),
    completedBookings: t("completedBookings"),
    jobPosts: t("jobPosts"),
    memberSince: t("memberSince"),
    profileComplete: t("profileComplete"),
    profileIncomplete: t("profileIncomplete"),
    viewCustomerAria: t("viewCustomerAria"),
  };
}

export function useMessagesLabels(isWelper: boolean) {
  const t = useTranslations("dashboard.messages");
  const base = {
    title: t("title"),
    subtitle: isWelper ? t("subtitle") : t("subtitleCustomer"),
    backToBookings: t("backToBookings"),
    signInTitle: t("signInTitle"),
    signInDescription: t("signInDescription"),
    conversations: t("conversations"),
    conversationsHint: isWelper ? t("conversationsHint") : t("conversationsHintCustomer"),
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
    pickFromList: isWelper ? t("pickFromList") : t("pickFromListCustomer"),
    threadTitle: t("threadTitle"),
    threadBooking: (id: string) =>
      t("threadBooking", { id: id.slice(-8).toUpperCase() }),
    viewBooking: t("viewBooking"),
    messagingClosed: t("messagingClosed"),
    sendFailed: t("sendFailed"),
    composerPlaceholder: t("composerPlaceholder"),
  };
  return base;
}

/** @deprecated Use useMessagesLabels */
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
    messagingClosed: t("messagingClosed"),
    sendFailed: t("sendFailed"),
    composerPlaceholder: t("composerPlaceholder"),
  };
}

export function useCustomerProfileLabels() {
  const t = useTranslations("dashboard.profile.customer");
  const f = useTranslations("dashboard.profile.customer.favorites");
  const form = useTranslations("dashboard.profile.customer.form");
  const af = useTranslations("dashboard.profile.customer.form.addressFields");
  const v = useTranslations("dashboard.profile.customer.form.validation");
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    loadError: t("loadError"),
    tabs: {
      personal: t("tabs.personal"),
      favorites: t("tabs.favorites"),
    },
    form: {
      title: form("title"),
      description: form("description"),
      firstName: form("firstName"),
      lastName: form("lastName"),
      phone: form("phone"),
      address: form("address"),
      firstNamePlaceholder: form("firstNamePlaceholder"),
      lastNamePlaceholder: form("lastNamePlaceholder"),
      phonePlaceholder: form("phonePlaceholder"),
      save: form("save"),
      saving: form("saving"),
      addressIncomplete: form("addressIncomplete"),
      addressFields: {
        streetAddress: af("streetAddress"),
        city: af("city"),
        stateProvince: af("stateProvince"),
        zipPostalCode: af("zipPostalCode"),
        streetPlaceholder: af("streetPlaceholder"),
        cityPlaceholder: af("cityPlaceholder"),
        zipPlaceholder: af("zipPlaceholder"),
        provincePlaceholder: af("provincePlaceholder"),
        country: af("country"),
      },
      validation: {
        firstNameRequired: v("firstNameRequired"),
        lastNameRequired: v("lastNameRequired"),
        phoneRequired: v("phoneRequired"),
        streetRequired: v("streetRequired"),
        cityRequired: v("cityRequired"),
        provinceRequired: v("provinceRequired"),
        postalInvalid: v("postalInvalid"),
      },
    },
    favorites: {
      unknownWelper: f("unknownWelper"),
      serviceProvider: f("serviceProvider"),
      unknownLocation: f("unknownLocation"),
      emptyTitle: f("emptyTitle"),
      emptyDescription: f("emptyDescription"),
      heading: f("heading"),
      headingDescription: f("headingDescription"),
      searchPlaceholder: f("searchPlaceholder"),
      showingCount: (shown: number, total: number) => f("showingCount", { shown, total }),
      noMatchTitle: f("noMatchTitle"),
      noMatchDescription: f("noMatchDescription"),
      jobsCompleted: (count: number) => f("jobsCompleted", { count }),
      lastBooked: (date: string) => f("lastBooked", { date }),
      viewProfile: f("viewProfile"),
      remove: f("remove"),
      quickRebook: f("quickRebook"),
    },
  };
}

export function useBookingNewLabels() {
  const t = useTranslations("dashboard.bookingNew");
  return {
    formatDuration: (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h === 0) return t("durationMinutes", { minutes: m });
      if (m === 0) return t("durationHours", { hours: h });
      return t("durationHoursMinutes", { hours: h, minutes: m });
    },
    title: t("title"),
    scheduleWith: (name: string) => t("scheduleWith", { name }),
    profileLoadFailed: t("profileLoadFailed"),
    backToSearch: t("backToSearch"),
    submitConfirming: t("submitConfirming"),
    submitRequest: t("submitRequest"),
    submitContinue: t("submitContinue"),
    summaryTitle: t("summaryTitle"),
    summaryRate: t("summaryRate"),
    summaryHoldLabel: t("summaryHoldLabel"),
    summaryHoldAmount: (amount: string) => t("summaryHoldAmount", { amount }),
    summaryTaxNote: t("summaryTaxNote"),
    summaryEstimatedJob: (duration: string) => t("summaryEstimatedJob", { duration }),
    summaryEstimatedBeforeTax: (amount: string) => t("summaryEstimatedBeforeTax", { amount }),
    summaryFinalChargeNote: t("summaryFinalChargeNote"),
    summaryPickService: t("summaryPickService"),
    beforeConfirmTitle: t("beforeConfirmTitle"),
    beforeConfirmPolicy: t("beforeConfirmPolicy"),
    detailsTitle: t("detailsTitle"),
    serviceLabel: t("serviceLabel"),
    selectService: t("selectService"),
    chooseServiceFirst: t("chooseServiceFirst"),
    serviceTypeLabel: t("serviceTypeLabel"),
    selectServiceType: t("selectServiceType"),
    chooseServiceType: t("chooseServiceType"),
    serviceQuestionsTitle: t("serviceQuestionsTitle"),
    questionsLoadFailed: t("questionsLoadFailed"),
    retry: t("retry"),
    whenTitle: t("whenTitle"),
    dateLabel: t("dateLabel"),
    startTimeLabel: t("startTimeLabel"),
    endTimeLabel: t("endTimeLabel"),
    endAfterStart: t("endAfterStart"),
    minDuration: t("minDuration"),
    maxDuration: t("maxDuration"),
    notesLabel: t("notesLabel"),
    notesOptional: t("notesOptional"),
    notesPlaceholder: t("notesPlaceholder"),
    profileGate: t("profileGate"),
    paymentSettings: t("paymentSettings"),
    paymentRequired: t("paymentRequired"),
    createFailed: t("createFailed"),
    mobileHoldLabel: t("mobileHoldLabel"),
  };
}

export function useDashboardSettingsLabels() {
  const t = useTranslations("dashboard.settings");
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    subtitleWelper: t("subtitleWelper"),
    loadingAria: t("loadingAria"),
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
    paymentTitle: t("paymentTitle"),
    paymentDescription: t("paymentDescription"),
    paymentMethods: {
      stripeNotConfigured: t("paymentMethods.stripeNotConfigured"),
      saveCard: t("paymentMethods.saveCard"),
      savingCard: t("paymentMethods.savingCard"),
      cancel: t("paymentMethods.cancel"),
      couldNotSaveCard: t("paymentMethods.couldNotSaveCard"),
      cardBrandFallback: t("paymentMethods.cardBrandFallback"),
      defaultBadge: t("paymentMethods.defaultBadge"),
      setDefault: t("paymentMethods.setDefault"),
      remove: t("paymentMethods.remove"),
      removeConfirm: t("paymentMethods.removeConfirm"),
      addPaymentMethod: t("paymentMethods.addPaymentMethod"),
      preparing: t("paymentMethods.preparing"),
      couldNotStartSetup: t("paymentMethods.couldNotStartSetup"),
    },
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
    firstNamePlaceholder: t("firstNamePlaceholder"),
    lastNamePlaceholder: t("lastNamePlaceholder"),
    phonePlaceholder: t("phonePlaceholder"),
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
      customerDescription: t("photo.customerDescription"),
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

/** Shared crop/upload labels for profile photo (signup + dashboard). */
export function useProfilePhotoUploadLabels(): ProfilePhotoUploadLabels {
  const t = useTranslations("auth.register.steps.optionalProfile");
  const optional = useAuthRegisterStep("optionalProfile");
  const photo = optional.photoUpload;
  return {
    title: t("photoUpload.title"),
    description: t("photoUpload.description"),
    photoAlt: t("photoUpload.photoAlt"),
    uploadPhoto: t("photoUpload.uploadPhoto"),
    changePhoto: t("photoUpload.changePhoto"),
    removePhoto: t("photoUpload.removePhoto"),
    acceptedHint: photo.acceptedHint,
    crop: {
      title: t("photoUpload.crop.title"),
      description: t("photoUpload.crop.description"),
      zoom: t("photoUpload.crop.zoom"),
      cancel: t("photoUpload.crop.cancel"),
      save: t("photoUpload.crop.save"),
    },
    errors: {
      invalidFormat: photo.errors.invalidFormat,
      fileTooLarge: photo.errors.fileTooLarge,
      imageTooSmall: photo.errors.imageTooSmall,
      imageTooLarge: photo.errors.imageTooLarge,
      invalidImage: t("photoUpload.errors.invalidImage"),
      uploadFailed: t("photoUpload.errors.uploadFailed"),
      removeFailed: t("photoUpload.errors.removeFailed"),
    },
  };
}

export function useWelperBookingDetailLabels() {
  const locale = useLocale();
  const t = useTranslations("dashboard.bookingsDetail");
  const cadLocale = locale === "fr" ? "fr-CA" : "en-CA";
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(cadLocale, { style: "currency", currency: "CAD" }).format(
      amount,
    );
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
    scheduleTitle: t("scheduleTitle"),
    scheduleDate: t("scheduleDate"),
    scheduleTimeWindow: t("scheduleTimeWindow"),
    durationLabel: t("durationLabel"),
    formatDuration: (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h === 0) return t("durationMinutes", { minutes: m });
      if (m === 0) return t("durationHours", { hours: h });
      return t("durationHoursMinutes", { hours: h, minutes: m });
    },
    formatCurrency,
    ratePerHour: (rate: string) => t("ratePerHour", { rate }),
    receiptOriginalHold: (amount: string) => t("receiptOriginalHold", { amount }),
    receiptExtraChargeHint: t("receiptExtraChargeHint"),
    receiptTotal: (amount: string) => t("receiptTotal", { amount }),
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
    checkInLateHint: t("checkInLateHint"),
    paymentReleasedPayoutNote: t("paymentReleasedPayoutNote"),
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
      categories: {
        no_show: t("disputeCategories.no_show"),
        quality: t("disputeCategories.quality"),
        overcharge: t("disputeCategories.overcharge"),
        safety: t("disputeCategories.safety"),
        other: t("disputeCategories.other"),
      },
    },
    attachmentFallback: t("attachmentFallback"),
    previewUnavailable: t("previewUnavailable"),
    additionalDetail: t("additionalDetail"),
    receiptDraftLoadFailed: t("receiptDraftLoadFailed"),
    disputeForm: {
      subjectLabel: t("disputeForm.subjectLabel"),
      subjectPlaceholder: t("disputeForm.subjectPlaceholder"),
      categoryLabel: t("disputeForm.categoryLabel"),
      descriptionLabel: t("disputeForm.descriptionLabel"),
      descriptionPlaceholder: t("disputeForm.descriptionPlaceholder"),
      safetyBold: t("disputeForm.safetyBold"),
      safetyRest: t("disputeForm.safetyRest"),
      submit: t("disputeForm.submit"),
      submitting: t("disputeForm.submitting"),
      validation: {
        subjectMin: t("disputeForm.validation.subjectMin"),
        subjectMax: (max: number) => t("disputeForm.validation.subjectMax", { max }),
        descriptionMax: (max: number) =>
          t("disputeForm.validation.descriptionMax", { max }),
      },
      evidence: {
        title: t("disputeForm.evidence.title"),
        description: (maxFiles: number, maxSizeMb: number) =>
          t("disputeForm.evidence.description", { maxFiles, maxSizeMb }),
        attach: (count: number, max: number) =>
          t("disputeForm.evidence.attach", { count, max }),
        limitReached: (count: number, max: number) =>
          t("disputeForm.evidence.limitReached", { count, max }),
        uploading: t("disputeForm.evidence.uploading"),
        attached: t("disputeForm.evidence.attached"),
        uploadFailed: t("disputeForm.evidence.uploadFailed"),
        removeAria: (fileName: string) =>
          t("disputeForm.evidence.removeAria", { fileName }),
        maxFilesError: (max: number) => t("disputeForm.evidence.maxFilesError", { max }),
        oversizedError: (maxMb: number, fileName: string, fileSize: string) =>
          t("disputeForm.evidence.oversizedError", { maxMb, name: fileName, size: fileSize }),
      },
    },
    ratingForm: {
      ratingLabel: t("ratingForm.ratingLabel"),
      commentLabel: t("ratingForm.commentLabel"),
      commentPlaceholder: t("ratingForm.commentPlaceholder"),
      starAria: (count: number) => t("ratingForm.starAria", { count }),
      starAriaPlural: (count: number) => t("ratingForm.starAriaPlural", { count }),
      charactersLeft: (count: number) => t("ratingForm.charactersLeft", { count }),
      submit: t("ratingForm.submit"),
      submitting: t("ratingForm.submitting"),
      validation: {
        ratingRequired: t("ratingForm.validation.ratingRequired"),
        commentMin: t("ratingForm.validation.commentMin"),
        commentMax: (max: number) => t("ratingForm.validation.commentMax", { max }),
      },
    },
  };
}

export function useCustomerBookingDetailLabels() {
  const t = useTranslations("dashboard.bookingsDetail.customer");
  const p = useTranslations("dashboard.bookingsDetail.customer.payment");
  return {
    notFoundTitle: t("notFoundTitle"),
    actionsHint: t("actionsHint"),
    messageWelper: t("messageWelper"),
    reviewWelper: t("reviewWelper"),
    receiptWrongAmountCallout: t("receiptWrongAmountCallout"),
    locationSectionTitle: t("locationSectionTitle"),
    serviceAddress: t("serviceAddress"),
    serviceQuestions: t("serviceQuestions"),
    cancellationReason: t("cancellationReason"),
    declineReason: t("declineReason"),
    receiptAlreadyConfirmed: t("receiptAlreadyConfirmed"),
    payment: {
      sectionTitle: p("sectionTitle"),
      cardOnFile: p("cardOnFile"),
      authorizeHint: p("authorizeHint"),
      authorizing: p("authorizing"),
      authorize: p("authorize"),
      holdActive: p("holdActive"),
      captureScheduled: (date: string) => p("captureScheduled", { date }),
      captured: p("captured"),
      failed: p("failed"),
      balanceTitle: p("balanceTitle"),
      balanceHint: p("balanceHint"),
      payBalance: p("payBalance"),
      authorizeFailed: p("authorizeFailed"),
      paymentFailed: p("paymentFailed"),
      stripeNotConfigured: p("stripeNotConfigured"),
      paymentUiLoadFailed: p("paymentUiLoadFailed"),
      authenticationFailed: p("authenticationFailed"),
    },
    reviewDialog: {
      editTitle: t("reviewDialog.editTitle"),
      newTitle: t("reviewDialog.newTitle"),
      editDescription: t("reviewDialog.editDescription"),
      newDescription: t("reviewDialog.newDescription"),
      newSubtext: t("reviewDialog.newSubtext"),
      saveChanges: t("reviewDialog.saveChanges"),
      skip: t("reviewDialog.skip"),
    },
  };
}

export function useSearchLabels() {
  const locale = useLocale();
  const t = useTranslations("dashboard.search");
  const hero = useTranslations("dashboard.search.hero");
  const filters = useTranslations("dashboard.search.filters");
  const toolbar = useTranslations("dashboard.search.toolbar");
  const card = useTranslations("dashboard.search.card");
  const profileDialog = useTranslations("dashboard.search.profileDialog");
  const serviceDialog = useTranslations("dashboard.search.serviceDialog");
  const resultsList = useTranslations("dashboard.search.resultsList");
  return {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    heroTitle: t("heroTitle"),
    locationPrompt: t("locationPrompt"),
    geolocationUnsupported: t("geolocationUnsupported"),
    geocodingUnavailable: t("geocodingUnavailable"),
    geocodingUnavailableRetry: t("geocodingUnavailableRetry"),
    postalNotFound: t("postalNotFound"),
    locationDenied: t("locationDenied"),
    addressLookupFailed: t("addressLookupFailed"),
    toggleFiltersHide: t("toggleFiltersHide"),
    toggleFiltersShow: t("toggleFiltersShow"),
    filtersActive: t("filtersActive"),
    loadError: t("loadError"),
    genericError: t("genericError"),
    contactSupport: t("contactSupport"),
    tryAgain: t("tryAgain"),
    resultsHeading: t("resultsHeading"),
    resultsError: t("resultsError"),
    prevPage: t("prevPage"),
    nextPage: t("nextPage"),
    pageOf: (page: number, total: number) => t("pageOf", { page, total }),
    emptyTitle: t("emptyTitle"),
    emptyDescription: t("emptyDescription"),
    clearSearchFilters: t("clearSearchFilters"),
    browseCategories: t("browseCategories"),
    hero: {
      description: hero("description"),
      placeholder: hero("placeholder"),
      postalAria: hero("postalAria"),
      searching: hero("searching"),
      search: hero("search"),
      detecting: hero("detecting"),
      useMyLocation: hero("useMyLocation"),
      browseByCategory: hero("browseByCategory"),
      searchInCategoryAria: (category: string) => hero("searchInCategoryAria", { category }),
      welpersCountAria: (count: number) => hero("welpersCountAria", { count }),
    },
    filters: {
      title: filters("title"),
      clearAllAria: filters("clearAllAria"),
      clear: filters("clear"),
      compactHint: filters("compactHint"),
      serviceCategory: filters("serviceCategory"),
      serviceCategoryAria: filters("serviceCategoryAria"),
      anyCategory: filters("anyCategory"),
      keyword: filters("keyword"),
      keywordPlaceholder: filters("keywordPlaceholder"),
      withinKm: filters("withinKm"),
      radiusAria: filters("radiusAria"),
      anyDistance: filters("anyDistance"),
      priceRange: filters("priceRange"),
      priceAria: filters("priceAria"),
      anyPrice: filters("anyPrice"),
      pricePerHour: (range: string) =>
        filters("pricePerHour", {
          range: locale === "fr" ? range : `$${range}`,
        }),
      minRating: filters("minRating"),
      ratingAria: filters("ratingAria"),
      anyRating: filters("anyRating"),
      starsPlus: (rating: string) => filters("starsPlus", { rating }),
    },
    toolbar: {
      loading: toolbar("loading"),
      noResults: toolbar("noResults"),
      showingRange: (start: number, end: number, total: number) =>
        toolbar("showingRange", { start, end, total }),
      welper: toolbar("welper"),
      welpers: toolbar("welpers"),
      sortBy: toolbar("sortBy"),
      sortAria: toolbar("sortAria"),
      sortRelevance: toolbar("sortRelevance"),
      sortPrice: toolbar("sortPrice"),
      sortDistance: toolbar("sortDistance"),
      view: toolbar("view"),
      listViewAria: toolbar("listViewAria"),
      gridViewAria: toolbar("gridViewAria"),
    },
    card: {
      noReviewsYet: card("noReviewsYet"),
      ratedAria: (rating: number, count: number) => card("ratedAria", { rating, count }),
      view: card("view"),
      viewProfile: card("viewProfile"),
      book: card("book"),
      bookNow: card("bookNow"),
    },
    profileDialog: {
      loading: profileDialog("loading"),
      description: profileDialog("description"),
      noBio: profileDialog("noBio"),
      services: profileDialog("services"),
      bookThisService: profileDialog("bookThisService"),
      noServicesListed: profileDialog("noServicesListed"),
      close: profileDialog("close"),
      bookNow: profileDialog("bookNow"),
      loadFailed: profileDialog("loadFailed"),
      experienceYears: (years: number) => profileDialog("experienceYears", { years }),
    },
    serviceDialog: {
      loading: serviceDialog("loading"),
      title: serviceDialog("title"),
      description: (name: string) => serviceDialog("description", { name }),
      servicesAvailable: (count: number) => serviceDialog("servicesAvailable", { count }),
      noServices: serviceDialog("noServices"),
      bookThisService: serviceDialog("bookThisService"),
      loadFailed: serviceDialog("loadFailed"),
      experienceYears: (years: number) => serviceDialog("experienceYears", { years }),
    },
    resultsList: {
      tryAgain: resultsList("tryAgain"),
      emptyTitle: resultsList("emptyTitle"),
      welpersFound: (count: number) => resultsList("welpersFound", { count }),
    },
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
    customerChargeHint: (charge: string) =>
      t("customerChargeHint", { charge, feePercent: PLATFORM_SERVICE_FEE_PERCENT }),
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
    markAsRead: t("markAsRead"),
    newBadge: t("newBadge"),
    clearAll: t("clearAll"),
    unreadCount: (count: number) => t("unreadCount", { count }),
    bellAria: t("bellAria"),
    bellUnreadAria: (count: number) => t("bellUnreadAria", { count }),
    view: t("view"),
    showAll: t("showAll"),
    emptyAllTitle: t("emptyAllTitle"),
    emptyUnreadTitle: t("emptyUnreadTitle"),
    emptyAllDescription: t("emptyAllDescription"),
    emptyUnreadDescription: t("emptyUnreadDescription"),
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
  const deleteReasonKeys = [
    "no_longer_need",
    "better_alternative",
    "privacy",
    "too_expensive",
    "technical",
    "other",
  ] as const;
  return {
    emailTitle: t("emailTitle"),
    emailDescription: t("emailDescription"),
    emailHint: t("emailHint"),
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    emailSubmit: t("emailSubmit"),
    emailSubmitting: t("emailSubmitting"),
    emailValidation: {
      emailInvalid: t("emailValidationInvalid"),
    },
    passwordTitle: t("passwordTitle"),
    passwordDescription: t("passwordDescription"),
    passwordCurrent: t("passwordCurrent"),
    passwordNew: t("passwordNew"),
    passwordConfirm: t("passwordConfirm"),
    passwordCurrentPlaceholder: t("passwordCurrentPlaceholder"),
    passwordNewPlaceholder: t("passwordNewPlaceholder"),
    passwordConfirmPlaceholder: t("passwordConfirmPlaceholder"),
    passwordStrength: (label: string) => t("passwordStrength", { label }),
    passwordStrengthWeak: t("passwordStrengthWeak"),
    passwordStrengthMedium: t("passwordStrengthMedium"),
    passwordStrengthStrong: t("passwordStrengthStrong"),
    passwordSubmit: t("passwordSubmit"),
    passwordSubmitting: t("passwordSubmitting"),
    passwordValidation: {
      currentRequired: t("passwordValidation.currentRequired"),
      newMin: t("passwordValidation.newMin"),
      confirmMin: t("passwordValidation.confirmMin"),
      mismatch: t("passwordValidation.mismatch"),
      sameAsCurrent: t("passwordValidation.sameAsCurrent"),
    },
    personalizationTitle: t("personalizationTitle"),
    personalizationDescription: t("personalizationDescription"),
    themeMode: t("themeMode"),
    themeModePlaceholder: t("themeModePlaceholder"),
    translucentTheme: t("translucentTheme"),
    translucentThemeHint: t("translucentThemeHint"),
    background: t("background"),
    backgroundPlaceholder: t("backgroundPlaceholder"),
    deleteTitle: t("deleteTitle"),
    deleteDescription: t("deleteDescription"),
    deleteWhatHappensTitle: t("deleteWhatHappensTitle"),
    deleteBulletSignedOut: t("deleteBulletSignedOut"),
    deleteBulletBookings: t("deleteBulletBookings"),
    deleteBulletMessages: t("deleteBulletMessages"),
    deleteBulletReviews: t("deleteBulletReviews"),
    deleteSupportNote: t("deleteSupportNote"),
    deleteReasonLabel: t("deleteReasonLabel"),
    deleteReasonPlaceholder: t("deleteReasonPlaceholder"),
    deleteFeedbackLabel: t("deleteFeedbackLabel"),
    deleteFeedbackPlaceholder: t("deleteFeedbackPlaceholder"),
    deleteConfirmLabel: t("deleteConfirmLabel"),
    deleteConfirmPlaceholder: t("deleteConfirmPlaceholder"),
    deleteSubmit: t("deleteSubmit"),
    deleteSubmitting: t("deleteSubmitting"),
    deleteCancel: t("deleteCancel"),
    deleteValidation: {
      feedbackMax: t("deleteValidationFeedbackMax"),
    },
    deleteReasons: deleteReasonKeys.map((key) => ({
      value: key,
      label: t(`deleteReasons.${key}`),
    })),
  };
}

import type { JobApplyBlockReason } from "@/lib/services/job-posting.service";
import type { JobStatus } from "@welpco/ui/platform";

const MARKETPLACE_JOB_STATUSES = new Set<JobStatus>([
  "published",
  "applications_open",
  "converted_to_booking",
  "completed",
  "expired",
  "cancelled",
  "draft",
  "open",
  "reviewing",
  "shortlisted",
  "interviewing",
  "offer",
  "filled",
]);

export function useMarketplaceLabels() {
  const locale = useLocale();
  const t = useTranslations("dashboard.marketplace");

  const statusLabel = useCallback(
    (status: JobStatus) => {
      if (MARKETPLACE_JOB_STATUSES.has(status)) {
        return t(`status.${status}`);
      }
      return status.replace(/_/g, " ");
    },
    [t],
  );

  const applyBlockMessage = useCallback(
    (reason: JobApplyBlockReason) => t(`applyBlocked.${reason}`),
    [t],
  );

  return {
    list: {
      titleCustomer: t("list.titleCustomer"),
      titleWelper: t("list.titleWelper"),
      subtitleCustomer: t("list.subtitleCustomer"),
      subtitleWelper: t("list.subtitleWelper"),
      postJob: t("list.postJob"),
      loadFailed: t("list.loadFailed"),
      jobPostCount: (count: number) => t("list.jobPostCount", { count }),
      empty: {
        customerTitle: t("list.empty.customerTitle"),
        customerDescription: t("list.empty.customerDescription"),
        customerCta: t("list.empty.customerCta"),
        welperNoFiltersTitle: t("list.empty.welperNoFiltersTitle"),
        welperNoFiltersDescription: t("list.empty.welperNoFiltersDescription"),
        welperFilteredTitle: t("list.empty.welperFilteredTitle"),
        welperFilteredDescription: t("list.empty.welperFilteredDescription"),
        clearFilters: t("list.empty.clearFilters"),
      },
    },
    filters: {
      title: t("filters.title"),
      allCategories: t("filters.allCategories"),
      allServices: t("filters.allServices"),
      eligibleOnly: t("filters.eligibleOnly"),
      canApplyChip: t("filters.canApplyChip"),
      noJobsFound: t("filters.noJobsFound"),
      jobCount: (count: number) => t("filters.jobCount", { count }),
      clearAll: t("filters.clearAll"),
      removeFilterAria: (label: string) => t("filters.removeFilterAria", { label }),
    },
    viewToggle: {
      label: t("viewToggle.label"),
      listAria: t("viewToggle.listAria"),
      gridAria: t("viewToggle.gridAria"),
    },
    card: {
      defaultCategory: t("card.defaultCategory"),
      viewDetails: t("card.viewDetails"),
      apply: t("card.apply"),
      applied: t("card.applied"),
      noApplicationsYet: t("card.noApplicationsYet"),
      applicationCount: (count: number) => t("card.applicationCount", { count }),
      posted: (date: string) => t("card.posted", { date }),
    },
    statusLabel,
    new: {
      title: t("new.title"),
      stepOf: (step: number, stepName: string) => t("new.stepOf", { step, stepName }),
      stepCategory: t("new.stepCategory"),
      stepDetails: t("new.stepDetails"),
      profileIncomplete: t("new.profileIncomplete"),
      category: t("new.category"),
      subcategory: t("new.subcategory"),
      selectCategory: t("new.selectCategory"),
      selectSubcategory: t("new.selectSubcategory"),
      continue: t("new.continue"),
      aboutJob: t("new.aboutJob"),
      titleLabel: t("new.titleLabel"),
      serviceQuestions: t("new.serviceQuestions"),
      noServiceQuestions: t("new.noServiceQuestions"),
      when: t("new.when"),
      date: t("new.date"),
      startTime: t("new.startTime"),
      endTime: t("new.endTime"),
      endAfterStart: t("new.endAfterStart"),
      minDuration: t("new.minDuration"),
      serviceLocation: (address: string) => t("new.serviceLocation", { address }),
      back: t("new.back"),
      posting: t("new.posting"),
      postJob: t("new.postJob"),
      submitFailed: t("new.submitFailed"),
    },
    detail: {
      back: t("detail.back"),
      notFound: t("detail.notFound"),
      date: t("detail.date"),
      time: t("detail.time"),
      duration: t("detail.duration"),
      location: t("detail.location"),
      applications: t("detail.applications"),
      closes: t("detail.closes"),
      cancelJob: t("detail.cancelJob"),
      applyToJob: t("detail.applyToJob"),
      yourApplication: t("detail.yourApplication"),
      withdrawApplication: t("detail.withdrawApplication"),
      aboutJob: t("detail.aboutJob"),
      serviceAddress: (address: string) => t("detail.serviceAddress", { address }),
      applicationsTitle: t("detail.applicationsTitle"),
      noApplicationsTitle: t("detail.noApplicationsTitle"),
      noApplicationsDescription: t("detail.noApplicationsDescription"),
      welperFallback: t("detail.welperFallback"),
      viewLinkedBooking: t("detail.viewLinkedBooking"),
      applyDialogTitle: t("detail.applyDialogTitle"),
      applyDialogReviewDescription: t("detail.applyDialogReviewDescription"),
      applyDialogSubmitDescription: t("detail.applyDialogSubmitDescription"),
      applyStepReview: t("detail.applyStepReview"),
      applyStepSubmit: t("detail.applyStepSubmit"),
      cancel: t("detail.cancel"),
      continueToProposal: t("detail.continueToProposal"),
      submitApplication: t("detail.submitApplication"),
      applyFailed: t("detail.applyFailed"),
      applicationStatus: (status: "pending" | "accepted" | "rejected" | "withdrawn") => ({
        label: t(`detail.applicationStatus.${status}.label`),
        helper: t(`detail.applicationStatus.${status}.helper`),
      }),
    },
    applyBlocked: {
      title: t("applyBlocked.title"),
      close: t("applyBlocked.close"),
      manageOfferings: t("applyBlocked.manageOfferings"),
      completeProfile: t("applyBlocked.completeProfile"),
      message: applyBlockMessage,
    },
    reviewSummary: {
      jobDetails: t("reviewSummary.jobDetails"),
      schedule: t("reviewSummary.schedule"),
      formatDuration: (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return t("reviewSummary.durationMinutes", { minutes: m });
        if (m === 0) return t("reviewSummary.durationHours", { hours: h });
        return t("reviewSummary.durationHoursMinutes", { hours: h, minutes: m });
      },
      location: t("reviewSummary.location"),
      serviceQuestions: t("reviewSummary.serviceQuestions"),
      questionsLoadFailed: t("reviewSummary.questionsLoadFailed"),
      noServiceDetails: t("reviewSummary.noServiceDetails"),
    },
    applicationForm: {
      title: t("applicationForm.title"),
      subtitle: t("applicationForm.subtitle"),
      serviceOffering: t("applicationForm.serviceOffering"),
      selectOffering: t("applicationForm.selectOffering"),
      selectOfferingError: t("applicationForm.selectOfferingError"),
      yourRate: (rate: number) => {
        const formatted = locale === "fr" ? `${rate} $` : `$${rate}`;
        return t("applicationForm.yourRate", { rate: formatted });
      },
      proposalMessage: t("applicationForm.proposalMessage"),
      proposalPlaceholder: t("applicationForm.proposalPlaceholder"),
      proposalMinError: t("applicationForm.proposalMinError"),
      submitting: t("applicationForm.submitting"),
      submit: t("applicationForm.submit"),
    },
    applicationReview: {
      verified: t("applicationReview.verified"),
      applied: (date: string) => t("applicationReview.applied", { date }),
      sendBookingRequest: t("applicationReview.sendBookingRequest"),
      hourlyRate: (rate: number) =>
        t("applicationReview.hourlyRate", {
          rate: locale === "fr" ? rate : `$${rate}`,
        }),
      emptyDescription: t("applicationReview.emptyDescription"),
      tryAgain: t("applicationReview.tryAgain"),
      statusLabel: (status: "pending" | "accepted" | "rejected" | "withdrawn") =>
        t(`applicationReview.status.${status}`),
    },
    searchEmpty: {
      postJob: t("searchEmpty.postJob"),
    },
    bookingHandoff: {
      linkedCallout: t("bookingHandoff.linkedCallout"),
      pageSubtitle: (jobTitle: string) => t("bookingHandoff.pageSubtitle", { jobTitle }),
    },
  };
}

/** Labels for customer-facing Mon–Sun availability strips on search cards and booking. */
export function useWelperAvailabilityDisplayLabels(): WeeklyAvailabilityDisplayLabels {
  const t = useTranslations("dashboard.welperAvailabilityDisplay");

  return {
    label: t("label"),
    adHocOnly: t("adHocOnly"),
    unavailable: t("unavailable"),
    noSlots: t("noSlots"),
    dayColumn: t("dayColumn"),
    hoursColumn: t("hoursColumn"),
    viewTimesAria: (day: string) => t("viewTimesAria", { day }),
    dayLetters: [
      t("dayLetters.mon"),
      t("dayLetters.tue"),
      t("dayLetters.wed"),
      t("dayLetters.thu"),
      t("dayLetters.fri"),
      t("dayLetters.sat"),
      t("dayLetters.sun"),
    ],
    dayNames: [
      t("dayNames.monday"),
      t("dayNames.tuesday"),
      t("dayNames.wednesday"),
      t("dayNames.thursday"),
      t("dayNames.friday"),
      t("dayNames.saturday"),
      t("dayNames.sunday"),
    ],
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
