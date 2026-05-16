/** Shared signup step copy defaults (English). Apps pass translated overrides via `labels`. */

import type { AddressInputLabels } from "../../profile-management/address-input";
import type { ProfilePhotoUploadLabels } from "../../profile-management/profile-photo-upload";
import type { ServiceAreaSelectorLabels } from "../../profile-management/service-area-selector";

export interface SignupCommonLabels {
  back: string;
  continue: string;
  saving: string;
  requiredMarker: string;
}

export const DEFAULT_SIGNUP_COMMON: SignupCommonLabels = {
  back: "Back",
  continue: "Continue",
  saving: "Saving...",
  requiredMarker: "*",
};

export interface LoginFormLabels {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  rememberMe: string;
  signIn: string;
  signingIn: string;
  newToWelpco: string;
  createAccount: string;
  validation: {
    emailInvalid: string;
    passwordMinLength: string;
  };
}

export const DEFAULT_LOGIN_FORM_LABELS: LoginFormLabels = {
  title: "Welcome back",
  subtitle: "Sign in to continue.",
  email: "Email",
  password: "Password",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "••••••••",
  forgotPassword: "Forgot password?",
  rememberMe: "Remember me",
  signIn: "Sign in",
  signingIn: "Signing in...",
  newToWelpco: "New to Welpco?",
  createAccount: "Create an account",
  validation: {
    emailInvalid: "Enter a valid email",
    passwordMinLength: "Password must be at least 8 characters",
  },
};

export interface EmailPasswordStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  email: string;
  password: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  passwordStrengthAria: string;
  strengthTooShort: string;
  strengthWeak: string;
  strengthFair: string;
  strengthGood: string;
  strengthStrong: string;
  strengthHint: string;
  creatingAccount: string;
  alreadyHaveAccount: string;
  signIn: string;
  validation: {
    emailInvalid: string;
    passwordMinLength: string;
    passwordMaxLength: string;
  };
}

export const DEFAULT_EMAIL_PASSWORD_LABELS: EmailPasswordStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "Create your account",
  description:
    "Set your email and password. We'll send a verification link in the background — you can keep going while it arrives.",
  email: "Email",
  password: "Password",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "At least 8 characters",
  passwordStrengthAria: "Password strength",
  strengthTooShort: "Too short",
  strengthWeak: "Weak",
  strengthFair: "Fair",
  strengthGood: "Good",
  strengthStrong: "Strong",
  strengthHint: ". Mix in numbers, symbols, and a longer length to strengthen it.",
  creatingAccount: "Creating your account...",
  alreadyHaveAccount: "Already have an account?",
  signIn: "Sign in",
  validation: {
    emailInvalid: "Enter a valid email address",
    passwordMinLength: "Password must be at least 8 characters",
    passwordMaxLength: "Password must be 128 characters or fewer",
  },
};

export interface SelectRoleStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  radiogroupAriaLabel: string;
  customerTitle: string;
  customerDescription: string;
  welperTitle: string;
  welperDescription: string;
  customerDisabledDescription: string;
  validationRequired: string;
  continueLoading: string;
}

export const DEFAULT_SELECT_ROLE_LABELS: SelectRoleStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "What brings you to Welpco?",
  description:
    "Pick one. You can switch later by creating a new account with a different email — most people stick with what they pick here.",
  radiogroupAriaLabel: "Choose your role",
  customerTitle: "Find help",
  customerDescription:
    "Book trusted Welpers in your area for cleaning, care, errands, and more.",
  welperTitle: "Become a Welper",
  welperDescription:
    "Set your own hours, your own rates, and earn from clients who need your skills.",
  customerDisabledDescription:
    "Customer sign-up is coming soon. For now, Welpco is open to Welpers.",
  validationRequired: "Pick one to continue.",
  continueLoading: "Saving...",
};

export interface IdentityCountryOption {
  code: string;
  label: string;
}

export interface IdentityStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryPlaceholder: string;
  phonePlaceholder: string;
  dateOfBirth: string;
  dobHint: string;
  tosPrefix: string;
  tosLink: string;
  privacyPrefix: string;
  privacyLink: string;
  countryOptions: IdentityCountryOption[];
  validation: {
    firstNameRequired: string;
    firstNameMax: string;
    lastNameRequired: string;
    lastNameMax: string;
    countryRequired: string;
    phoneRequired: string;
    phoneInvalid: string;
    dobRequired: string;
    dobInvalid: string;
    dobMinAge: string;
    tosRequired: string;
    privacyRequired: string;
  };
}

export const DEFAULT_IDENTITY_LABELS: IdentityStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "Tell us who you are",
  description:
    "We use these details to confirm bookings and reach you about your account. They're never shown publicly without your say-so.",
  firstName: "First name",
  lastName: "Last name",
  phone: "Phone",
  countryPlaceholder: "Country",
  phonePlaceholder: "416 555 1234",
  dateOfBirth: "Date of birth",
  dobHint: "You must be at least 13.",
  tosPrefix: "I agree to the",
  tosLink: "Terms of Service",
  privacyPrefix: "I've read the",
  privacyLink: "Privacy Policy",
  countryOptions: [
    { code: "CA", label: "Canada (+1)" },
    { code: "US", label: "United States (+1)" },
    { code: "GB", label: "United Kingdom (+44)" },
    { code: "AU", label: "Australia (+61)" },
    { code: "FR", label: "France (+33)" },
    { code: "DE", label: "Germany (+49)" },
    { code: "IN", label: "India (+91)" },
    { code: "MX", label: "Mexico (+52)" },
  ],
  validation: {
    firstNameRequired: "First name is required",
    firstNameMax: "First name must be 80 characters or fewer",
    lastNameRequired: "Last name is required",
    lastNameMax: "Last name must be 80 characters or fewer",
    countryRequired: "Pick a country",
    phoneRequired: "Phone number is required",
    phoneInvalid: "Enter a valid phone number for the selected country",
    dobRequired: "Date of birth is required",
    dobInvalid: "Enter a valid date",
    dobMinAge: "You must be at least 13 to sign up",
    tosRequired: "Accept the Terms of Service to continue",
    privacyRequired: "Accept the Privacy Policy to continue",
  },
};

export interface WelperBioStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  bioLabel: string;
  bioPlaceholder: string;
  charCount: string;
  charsRemaining: string;
  minCharsRemaining: string;
  validation: {
    bioMin: string;
    bioMax: string;
  };
}

export const DEFAULT_WELPER_BIO_LABELS: WelperBioStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "Tell customers who you are",
  description:
    "A few sentences about your work, what you love about it, and who you're a great fit for. This is the first thing people read on your profile — speak in your own voice.",
  bioLabel: "Your bio",
  bioPlaceholder:
    "What do you do, who do you do it for, and why are you good at it?",
  charCount: "{count} characters",
  charsRemaining: "{count} left",
  minCharsRemaining: "{count} more to go ({min} min)",
  validation: {
    bioMin: "Bio must be at least {min} characters",
    bioMax: "Bio must be {max} characters or fewer",
  },
};

const DEFAULT_WELPER_SERVICE_AREA_SELECTOR: ServiceAreaSelectorLabels = {
  centerAddress: "Center address",
  serviceRadius: "Service radius (miles)",
  radiusHint:
    "Services will be available within {miles} miles of the center address.",
};

const DEFAULT_WELPER_SERVICE_AREA_ADDRESS: AddressInputLabels = {
  streetAddress: "Street address",
  city: "City",
  stateProvince: "Province / state",
  zipPostalCode: "Postal / ZIP code",
  streetPlaceholder: "123 Main Street",
};

export interface WelperServiceAreaStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  validation: {
    required: string;
    cityRequired: string;
    provinceRequired: string;
    postalRequired: string;
    radiusRange: string;
  };
  selector: ServiceAreaSelectorLabels;
  address: AddressInputLabels;
}

export const DEFAULT_WELPER_SERVICE_AREA_LABELS: WelperServiceAreaStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "Where do you work?",
  description:
    "Set the center of your service area and how far you are willing to travel. Customers nearby will be able to find you in search.",
  validation: {
    required: "Set your service area and radius to continue.",
    cityRequired: "City is required.",
    provinceRequired: "Province / state is required.",
    postalRequired: "Postal code is required so we can place you on the map.",
    radiusRange: "Choose a radius between 1 and 100 miles.",
  },
  selector: DEFAULT_WELPER_SERVICE_AREA_SELECTOR,
  address: DEFAULT_WELPER_SERVICE_AREA_ADDRESS,
};

export interface WelperOfferingStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  yourServices: string;
  remove: string;
  addAnother: string;
  firstService: string;
  category: string;
  subcategory: string;
  serviceTitle: string;
  hourlyRate: string;
  descriptionLabel: string;
  addToList: string;
  loadingCategories: string;
  chooseCategory: string;
  chooseCategoryFirst: string;
  noSubcategories: string;
  chooseSubcategory: string;
  addAtLeastOne: string;
  validation: {
    parentRequired: string;
    subcategoryRequired: string;
    titleRequired: string;
    rateRequired: string;
    rateMin: string;
    descriptionRequired: string;
  };
}

export const DEFAULT_WELPER_OFFERING_LABELS: WelperOfferingStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "Add your services",
  description:
    "Choose a category and subcategory for each service you offer, then add pricing and a description. You can add up to {max} services now and more later from your profile.",
  yourServices: "Your services ({count}/{max})",
  remove: "Remove",
  addAnother: "Add another service",
  firstService: "First service",
  category: "Category",
  subcategory: "Subcategory",
  serviceTitle: "Service title",
  hourlyRate: "Hourly rate ($)",
  descriptionLabel: "Description",
  addToList: "Add to list",
  loadingCategories: "Loading categories...",
  chooseCategory: "Choose a category",
  chooseCategoryFirst: "Choose a category first",
  noSubcategories: "No subcategories available",
  chooseSubcategory: "Choose a subcategory",
  addAtLeastOne: "Add at least one service before continuing.",
  validation: {
    parentRequired: "Choose a category",
    subcategoryRequired: "Choose a subcategory",
    titleRequired: "Give this service a title",
    rateRequired: "Set an hourly rate",
    rateMin: "Rate must be at least $1",
    descriptionRequired: "Add a short description",
  },
};

export interface WelperAvailabilityStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  addSlotLabel: string;
  dayPlaceholder: string;
  addSlotButton: string;
  yourWeeklyHours: string;
  remove: string;
  days: Record<string, string>;
  validation: {
    endAfterStart: string;
    maxSlots: string;
    duplicateSlot: string;
    addAtLeastOne: string;
  };
}

export const DEFAULT_WELPER_AVAILABILITY_LABELS: WelperAvailabilityStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "When are you available?",
  description:
    "Add the times you can normally take work. Customers see these ranges in search and at booking time. You can change them anytime.",
  addSlotLabel: "Add a weekly slot",
  dayPlaceholder: "Day",
  addSlotButton: "Add slot",
  yourWeeklyHours: "Your weekly hours",
  remove: "Remove",
  days: {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  },
  validation: {
    endAfterStart: "End time must be after start time",
    maxSlots: "That's the cap — 50 slots max",
    duplicateSlot: "That slot is already in your list",
    addAtLeastOne: "Add at least one slot to continue.",
  },
};

export interface WelperBackgroundCheckStepLabels extends SignupCommonLabels {
  title: string;
  under18Description: string;
  description: string;
  limitedTimeRate: string;
  payAndContinue: string;
  startCertnVerification: string;
  openCertnVerification: string;
  certnEmailInvite: string;
  footer: string;
  continue: string;
  paymentReceivedPrefix: string;
  paymentInviteReady: string;
  paymentFailureStart: string;
  paymentInvitePending: string;
  failureMissingProfile: string;
  failureCertnFailed: string;
  failureGeneric: string;
}

export const DEFAULT_WELPER_BACKGROUND_CHECK_LABELS: WelperBackgroundCheckStepLabels =
  {
    ...DEFAULT_SIGNUP_COMMON,
    title: "Background check",
    under18Description:
      "Because you are under 18, a criminal background check is not required at this time.",
    description:
      "Adult Welpers must complete a Basic Canadian criminal record check before going live. Pay the fee below, then finish identity verification with our screening partner.",
    limitedTimeRate: "Limited-time rate",
    payAndContinue: "Pay {amount} and continue",
    startCertnVerification: "Start Certn verification",
    openCertnVerification: "Open Certn verification",
    certnEmailInvite:
      "We sent a Certn screening link to your signup email. Open that message to complete your background check (it is not the Certn admin login at demo-app.certn.co).",
    footer:
      "Results are usually ready within a few business days. You can finish signup while your check is processing; search and bookings unlock once you are cleared.",
    continue: "Continue",
    paymentReceivedPrefix: "Payment received.",
    paymentInviteReady:
      "Continue verification on Certn if you have not already, then proceed with signup.",
    paymentFailureStart:
      "Payment is complete. Start Certn below if verification has not begun.",
    paymentInvitePending:
      "Payment is complete. We are sending your Certn invite — you can continue signup while it processes.",
    failureMissingProfile:
      "We could not start Certn — your name and date of birth from the identity step are required.",
    failureCertnFailed: "Certn could not start: {detail}",
    failureGeneric:
      "We could not start Certn verification. Try again below, or contact support if it keeps failing.",
  };

const DEFAULT_OPTIONAL_PROFILE_PHOTO: ProfilePhotoUploadLabels = {
  title: "Profile photo",
  description: "A clear, friendly photo of you. JPEG, PNG, or WebP up to 5 MB.",
  photoAlt: "Profile photo",
  uploadPhoto: "Upload photo",
  changePhoto: "Change photo",
  removePhoto: "Remove photo",
  acceptedHint: "Accepted: {formats}. Max {maxSizeMB} MB. Min {minWidth}×{minHeight} px.",
  errors: {
    invalidFormat: "File must be one of: {formats}",
    fileTooLarge: "File size must be less than {maxSizeMB} MB",
    imageTooSmall: "Image must be at least {minWidth}×{minHeight} pixels",
    imageTooLarge: "Image must be at most {maxWidth}×{maxHeight} pixels",
    invalidImage: "Invalid image file",
    uploadFailed:
      "We couldn't upload your photo. Try again, or pick a different file.",
    removeFailed: "Failed to remove photo",
  },
};

const DEFAULT_OPTIONAL_PROFILE_ADDRESS: AddressInputLabels = {
  streetAddress: "Street address",
  city: "City",
  stateProvince: "Province",
  zipPostalCode: "Postal code",
  streetPlaceholder: "123 Main Street",
};

export interface OptionalProfileStepLabels extends SignupCommonLabels {
  title: string;
  description: string;
  photoUpload: ProfilePhotoUploadLabels;
  addressTitle: string;
  addressDescription: string;
  address: AddressInputLabels;
  finishSignup: string;
}

export const DEFAULT_OPTIONAL_PROFILE_LABELS: OptionalProfileStepLabels = {
  ...DEFAULT_SIGNUP_COMMON,
  title: "Finish your profile",
  description:
    "Add a profile photo so customers and Welpers know who they're working with. You can update it anytime from your profile.",
  photoUpload: DEFAULT_OPTIONAL_PROFILE_PHOTO,
  addressTitle: "Where do you live?",
  addressDescription:
    "We use this to find Welpers near you. Optional — you can enter it later from your profile.",
  address: DEFAULT_OPTIONAL_PROFILE_ADDRESS,
  finishSignup: "Finish signup",
};

export interface PasswordResetLabels {
  title: string;
  description: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  updatePassword: string;
  updating: string;
  cancel: string;
  requiredMarker: string;
  validation: {
    emailInvalid: string;
    passwordMinLength: string;
    confirmPasswordMinLength: string;
    passwordsMustMatch: string;
  };
}

export const DEFAULT_PASSWORD_RESET_LABELS: PasswordResetLabels = {
  title: "Reset password",
  description: "Enter your email and a new password.",
  email: "Email",
  newPassword: "New password",
  confirmPassword: "Confirm password",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "••••••••",
  updatePassword: "Update password",
  updating: "Updating...",
  cancel: "Cancel",
  requiredMarker: "*",
  validation: {
    emailInvalid: "Enter a valid email",
    passwordMinLength: "Password must be at least 8 characters",
    confirmPasswordMinLength: "Confirm your password",
    passwordsMustMatch: "Passwords must match",
  },
};

export interface AccountVerificationLabels {
  title: string;
  codeSentPrefix: string;
  codeLabel: string;
  codeDigitAria: string;
  resendCode: string;
  verify: string;
  verifying: string;
  requiredMarker: string;
  validation: {
    codeInvalid: string;
  };
}

export const DEFAULT_ACCOUNT_VERIFICATION_LABELS: AccountVerificationLabels = {
  title: "Verify your account",
  codeSentPrefix: "We sent a 6-digit code to",
  codeLabel: "Verification code",
  codeDigitAria: "Verification code digit {index} of {total}",
  resendCode: "Resend code",
  verify: "Verify",
  verifying: "Verifying…",
  requiredMarker: "*",
  validation: {
    codeInvalid: "Enter the 6-digit code",
  },
};
