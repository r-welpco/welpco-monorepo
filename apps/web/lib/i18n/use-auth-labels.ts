"use client";

import { PLATFORM_SERVICE_FEE_PERCENT } from "@welpco/ui/platform/profile-management";
import { useTranslations } from "next-intl";
import { useAuthMessages, useAuthRegisterStep } from "@/lib/i18n/auth-message-templates";
import type {
  AccountRecoveryFormLabels,
  AccountVerificationLabels,
  EmailPasswordStepLabels,
  IdentityStepLabels,
  LoginFormLabels,
  OptionalProfileStepLabels,
  PasswordResetLabels,
  SelectRoleStepLabels,
  WelperAvailabilityStepLabels,
  WelperBackgroundCheckStepLabels,
  WelperPayoutStepLabels,
  WelperBioStepLabels,
  WelperOfferingStepLabels,
  WelperServiceAreaStepLabels,
} from "@welpco/ui/platform/user-management";

export function useLoginFormLabels(): LoginFormLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.login");
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    email: t("email"),
    password: t("password"),
    emailPlaceholder: tc("emailPlaceholder"),
    passwordPlaceholder: tc("passwordPlaceholder"),
    forgotPassword: t("forgotPassword"),
    rememberMe: t("rememberMe"),
    signIn: t("signIn"),
    signingIn: t("signingIn"),
    newToWelpco: t("newToWelpco"),
    createAccount: t("createAccount"),
    validation: {
      emailInvalid: t("validation.emailInvalid"),
      passwordMinLength: t("validation.passwordMinLength"),
    },
  };
}

export function useEmailPasswordStepLabels(): EmailPasswordStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.begin");
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    email: t("email"),
    password: t("password"),
    emailPlaceholder: tc("emailPlaceholder"),
    passwordPlaceholder: t("passwordPlaceholder"),
    passwordStrengthAria: t("passwordStrengthAria"),
    strengthTooShort: t("strengthTooShort"),
    strengthWeak: t("strengthWeak"),
    strengthFair: t("strengthFair"),
    strengthGood: t("strengthGood"),
    strengthStrong: t("strengthStrong"),
    strengthHint: t("strengthHint"),
    creatingAccount: t("creatingAccount"),
    alreadyHaveAccount: t("alreadyHaveAccount"),
    signIn: t("signInLink"),
    validation: {
      emailInvalid: t("validation.emailInvalid"),
      passwordMinLength: t("validation.passwordMinLength"),
      passwordMaxLength: t("validation.passwordMaxLength"),
    },
  };
}

export function useSelectRoleStepLabels(): SelectRoleStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.selectRole");
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    radiogroupAriaLabel: t("radiogroupAriaLabel"),
    customerTitle: t("customerTitle"),
    customerDescription: t("customerDescription"),
    welperTitle: t("welperTitle"),
    welperDescription: t("welperDescription"),
    customerDisabledDescription: t("customerDisabledDescription"),
    validationRequired: t("validation.required"),
    continueLoading: tc("saving"),
  };
}

export function useIdentityStepLabels(): IdentityStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.identity");
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    firstName: t("firstName"),
    lastName: t("lastName"),
    firstNamePlaceholder: t("firstNamePlaceholder"),
    lastNamePlaceholder: t("lastNamePlaceholder"),
    phone: t("phone"),
    countryPlaceholder: t("countryPlaceholder"),
    phonePlaceholder: t("phonePlaceholder"),
    dateOfBirth: t("dateOfBirth"),
    dobHint: t("dobHint"),
    minorWelperModal: {
      title: t("minorWelperModal.title"),
      description: t("minorWelperModal.description"),
      close: t("minorWelperModal.close"),
    },
    tosPrefix: t("tosPrefix"),
    tosLink: t("tosLink"),
    privacyPrefix: t("privacyPrefix"),
    privacyLink: t("privacyLink"),
    countryOptions: [
      { code: "CA", label: t("countries.CA") },
      { code: "US", label: t("countries.US") },
      { code: "GB", label: t("countries.GB") },
      { code: "AU", label: t("countries.AU") },
      { code: "FR", label: t("countries.FR") },
      { code: "DE", label: t("countries.DE") },
      { code: "IN", label: t("countries.IN") },
      { code: "MX", label: t("countries.MX") },
    ],
    validation: {
      firstNameRequired: t("validation.firstNameRequired"),
      firstNameMax: t("validation.firstNameMax"),
      lastNameRequired: t("validation.lastNameRequired"),
      lastNameMax: t("validation.lastNameMax"),
      countryRequired: t("validation.countryRequired"),
      phoneRequired: t("validation.phoneRequired"),
      phoneInvalid: t("validation.phoneInvalid"),
      dobRequired: t("validation.dobRequired"),
      dobInvalid: t("validation.dobInvalid"),
      dobMinAge: t("validation.dobMinAge"),
      dobTooYoung: t("validation.dobTooYoung"),
      tosRequired: t("validation.tosRequired"),
      privacyRequired: t("validation.privacyRequired"),
    },
  };
}

export function useWelperBioStepLabels(): WelperBioStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.welperBio");
  const bio = useAuthRegisterStep("welperBio");
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    bioLabel: t("bioLabel"),
    bioPlaceholder: t("bioPlaceholder"),
    charCount: bio.charCount,
    charsRemaining: bio.charsRemaining,
    minCharsRemaining: bio.minCharsRemaining,
    validation: {
      bioMin: bio.validation.bioMin,
      bioMax: bio.validation.bioMax,
    },
  };
}

export function useWelperServiceAreaStepLabels(): WelperServiceAreaStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.welperServiceArea");
  const area = useAuthRegisterStep("welperServiceArea");
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    validation: {
      required: t("validation.required"),
      cityRequired: t("validation.cityRequired"),
      provinceRequired: t("validation.provinceRequired"),
      postalRequired: t("validation.postalRequired"),
      radiusRange: t("validation.radiusRange"),
    },
    selector: {
      centerAddress: t("selector.centerAddress"),
      serviceRadius: t("selector.serviceRadius"),
      radiusPlaceholder: t("selector.radiusPlaceholder"),
      radiusHint: area.selector.radiusHint,
    },
    address: {
      streetAddress: t("address.streetAddress"),
      city: t("address.city"),
      stateProvince: t("address.stateProvince"),
      zipPostalCode: t("address.zipPostalCode"),
      streetPlaceholder: t("address.streetPlaceholder"),
    },
  };
}

export function useWelperOfferingStepLabels(maxServices: number): WelperOfferingStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.welperOffering");
  const offering = useAuthRegisterStep("welperOffering");
  void maxServices;
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: offering.description,
    yourServices: offering.yourServices,
    remove: t("remove"),
    addAnother: t("addAnother"),
    firstService: t("firstService"),
    category: t("category"),
    subcategory: t("subcategory"),
    serviceTitle: t("serviceTitle"),
    hourlyRate: t("hourlyRate"),
    customerChargeHint: (charge) =>
      t("customerChargeHint", { charge, feePercent: PLATFORM_SERVICE_FEE_PERCENT }),
    descriptionLabel: t("descriptionLabel"),
    addToList: t("addToList"),
    loadingCategories: t("loadingCategories"),
    chooseCategory: t("chooseCategory"),
    chooseCategoryFirst: t("chooseCategoryFirst"),
    noSubcategories: t("noSubcategories"),
    chooseSubcategory: t("chooseSubcategory"),
    addAtLeastOne: t("addAtLeastOne"),
    validation: {
      parentRequired: t("validation.parentRequired"),
      subcategoryRequired: t("validation.subcategoryRequired"),
      titleRequired: t("validation.titleRequired"),
      rateRequired: t("validation.rateRequired"),
      rateMin: t("validation.rateMin"),
      descriptionRequired: t("validation.descriptionRequired"),
      descriptionMin: offering.validation.descriptionMin,
    },
  };
}

export function useWelperAvailabilityStepLabels(): WelperAvailabilityStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.welperAvailability");
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    addSlotLabel: t("addSlotLabel"),
    dayPlaceholder: t("dayPlaceholder"),
    addSlotButton: t("addSlotButton"),
    yourWeeklyHours: t("yourWeeklyHours"),
    remove: t("remove"),
    days: {
      monday: t("days.monday"),
      tuesday: t("days.tuesday"),
      wednesday: t("days.wednesday"),
      thursday: t("days.thursday"),
      friday: t("days.friday"),
      saturday: t("days.saturday"),
      sunday: t("days.sunday"),
    },
    validation: {
      endAfterStart: t("validation.endAfterStart"),
      maxSlots: t("validation.maxSlots"),
      duplicateSlot: t("validation.duplicateSlot"),
      addAtLeastOne: t("validation.addAtLeastOne"),
    },
  };
}

export function useWelperBackgroundCheckStepLabels(): WelperBackgroundCheckStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.welperBackgroundCheck");
  const bg = useAuthRegisterStep("welperBackgroundCheck");
  return {
    back: tc("back"),
    continue: t("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    under18Description: t("under18Description"),
    description: t("description"),
    limitedTimeRate: t("limitedTimeRate"),
    pricePlusTax: t("pricePlusTax"),
    payAndContinue: bg.payAndContinue,
    startCertnVerification: "",
    openCertnVerification: "",
    certnLinkReady: "",
    certnEmailInvite: t("certnEmailInvite"),
    resendInviteEmail: t("resendInviteEmail"),
    resendInviteEmailSending: t("resendInviteEmailSending"),
    resendInviteEmailSent: t("resendInviteEmailSent"),
    footer: t("footer"),
    paymentReceivedPrefix: t("paymentReceivedPrefix"),
    paymentInviteReady: "",
    paymentFailureStart: "",
    paymentInvitePending: "",
    failureMissingProfile: t("failureMissingProfile"),
    failureCertnFailed: "",
    failureGeneric: "",
  };
}

export function useWelperPayoutStepLabels(): WelperPayoutStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.welperPayout");
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    successDescription: t("successDescription"),
    connectTitle: t("connectTitle"),
    connectDescription: t("connectDescription"),
    connectCta: t("connectCta"),
    connectInProgress: t("connectInProgress"),
    stripeSetupGuideTitle: t("stripeSetupGuideTitle"),
    stripeSetupGuideIntro: t("stripeSetupGuideIntro"),
    stripeSetupStepBusinessType: t("stripeSetupStepBusinessType"),
    stripeSetupStepPersonalDetails: t("stripeSetupStepPersonalDetails"),
    stripeSetupBusinessDetailsLead: t("stripeSetupBusinessDetailsLead"),
    stripeSetupBusinessIndustry: t("stripeSetupBusinessIndustry"),
    stripeSetupBusinessWebsite: t("stripeSetupBusinessWebsite"),
    stripeSetupBusinessProduct: t("stripeSetupBusinessProduct"),
    stripeSetupStepBankDetails: t("stripeSetupStepBankDetails"),
  };
}

export function useForgotPasswordLabels(): AccountRecoveryFormLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.forgotPassword");
  return {
    email: t("email"),
    emailPlaceholder: tc("emailPlaceholder"),
    cancel: tc("cancel"),
    sendResetLink: t("submit"),
    sending: t("submitting"),
    recoverAccount: t("submit"),
    validation: {
      emailInvalid: t("validation.emailInvalid"),
    },
  };
}

export function usePasswordResetLabels(): PasswordResetLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.resetPassword");
  return {
    title: t("title"),
    description: t("description"),
    email: t("email"),
    newPassword: t("newPassword"),
    confirmPassword: t("confirmPassword"),
    emailPlaceholder: tc("emailPlaceholder"),
    passwordPlaceholder: tc("passwordPlaceholder"),
    updatePassword: t("submit"),
    updating: t("submitting"),
    cancel: tc("cancel"),
    requiredMarker: "*",
    validation: {
      emailInvalid: t("validation.emailInvalid"),
      passwordMinLength: t("validation.passwordMinLength"),
      passwordStrength: t("validation.passwordStrength"),
      confirmPasswordMinLength: t("validation.confirmPasswordMinLength"),
      passwordsMustMatch: t("validation.passwordsMustMatch"),
    },
  };
}

export function useAccountVerificationLabels(): AccountVerificationLabels {
  const t = useTranslations("auth.verification");
  const verification = useAuthMessages().auth.verification;
  return {
    title: t("title"),
    codeSentPrefix: t("codeSentPrefix"),
    codeLabel: t("codeLabel"),
    codeDigitAria: verification.codeDigitAria,
    resendCode: t("resendCode"),
    verify: t("verify"),
    verifying: t("verifying"),
    requiredMarker: "*",
    validation: {
      codeInvalid: t("validation.codeFormat"),
    },
  };
}

export function useOptionalProfileStepLabels(): OptionalProfileStepLabels {
  const tc = useTranslations("auth.common");
  const t = useTranslations("auth.register.steps.optionalProfile");
  const optional = useAuthRegisterStep("optionalProfile");
  const photo = optional.photoUpload;
  return {
    back: tc("back"),
    continue: tc("continue"),
    saving: tc("saving"),
    requiredMarker: "*",
    title: t("title"),
    description: t("description"),
    photoUpload: {
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
    },
    addressTitle: t("addressTitle"),
    addressDescription: t("addressDescription"),
    address: {
      streetAddress: t("address.streetAddress"),
      city: t("address.city"),
      stateProvince: t("address.stateProvince"),
      zipPostalCode: t("address.zipPostalCode"),
      streetPlaceholder: t("address.streetPlaceholder"),
    },
    finishSignup: t("finishSignup"),
  };
}
