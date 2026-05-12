/**
 * Standardized error codes for API responses
 * Used across all microservices for consistent error handling
 */
export var ErrorCode;
(function (ErrorCode) {
    // User Management
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["EMAIL_ALREADY_EXISTS"] = "EMAIL_ALREADY_EXISTS";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    ErrorCode["EMAIL_NOT_VERIFIED"] = "EMAIL_NOT_VERIFIED";
    // Day 15 — Signup ↔ onboarding merge, Phase 1.
    ErrorCode["EMAIL_VERIFICATION_REQUIRED"] = "EMAIL_VERIFICATION_REQUIRED";
    ErrorCode["INCOMPLETE_SIGNUP"] = "INCOMPLETE_SIGNUP";
    ErrorCode["ACCOUNT_EXISTS"] = "ACCOUNT_EXISTS";
    // Profile Management
    ErrorCode["PROFILE_NOT_FOUND"] = "PROFILE_NOT_FOUND";
    ErrorCode["PROFILE_ALREADY_EXISTS"] = "PROFILE_ALREADY_EXISTS";
    ErrorCode["INVALID_PHONE_NUMBER"] = "INVALID_PHONE_NUMBER";
    ErrorCode["INVALID_ADDRESS"] = "INVALID_ADDRESS";
    ErrorCode["INVALID_GEOJSON"] = "INVALID_GEOJSON";
    ErrorCode["SERVICE_OFFERING_NOT_FOUND"] = "SERVICE_OFFERING_NOT_FOUND";
    ErrorCode["AVAILABILITY_NOT_FOUND"] = "AVAILABILITY_NOT_FOUND";
    ErrorCode["FAVORITE_ALREADY_EXISTS"] = "FAVORITE_ALREADY_EXISTS";
    ErrorCode["FAVORITE_NOT_FOUND"] = "FAVORITE_NOT_FOUND";
    // Content Management
    ErrorCode["CATEGORY_NOT_FOUND"] = "CATEGORY_NOT_FOUND";
    ErrorCode["CATEGORY_ALREADY_EXISTS"] = "CATEGORY_ALREADY_EXISTS";
    ErrorCode["QUESTION_NOT_FOUND"] = "QUESTION_NOT_FOUND";
    ErrorCode["CONTENT_NOT_FOUND"] = "CONTENT_NOT_FOUND";
    // Common
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
})(ErrorCode || (ErrorCode = {}));
//# sourceMappingURL=error-codes.enum.js.map