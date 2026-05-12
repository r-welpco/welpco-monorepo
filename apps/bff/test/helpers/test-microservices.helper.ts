import nock from 'nock';

/** Single backend base URL (BFF serves all domains in-process). */
const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export class TestMicroservicesHelper {
  /**
   * Mock user-management (auth) endpoints on the single backend
   */
  static mockUserManagement(baseUrl: string = DEFAULT_BACKEND_URL) {
    return nock(baseUrl);
  }

  /**
   * Mock profile-management endpoints on the single backend
   */
  static mockProfileManagement(baseUrl: string = DEFAULT_BACKEND_URL) {
    return nock(baseUrl);
  }

  /**
   * Setup mock for successful login
   */
  static mockLoginSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/login')
      .reply(200, {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          accountType: 'Customer',
          status: 'Active',
          emailVerified: true,
        },
      });
  }

  /**
   * Setup mock for failed login
   */
  static mockLoginFailure(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/login')
      .reply(401, {
        statusCode: 401,
        message: 'Invalid credentials',
      });
  }

  /**
   * Setup mock for successful registration
   */
  static mockRegisterSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/register')
      .reply(201, {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-1',
          email: 'newuser@example.com',
          accountType: 'Customer',
          status: 'Pending',
          emailVerified: false,
        },
      });
  }

  /**
   * Setup mock for duplicate email registration
   */
  static mockRegisterDuplicateEmail(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/register')
      .reply(409, {
        statusCode: 409,
        message: 'Email already exists',
      });
  }

  /**
   * Setup mock for get current user
   */
  static mockGetCurrentUser(
    userId: string = 'user-1',
    accountType: string = 'Customer',
    baseUrl: string = DEFAULT_BACKEND_URL,
  ) {
    return this.mockUserManagement(baseUrl)
      .get('/api/users/me')
      .reply(200, {
        id: userId,
        email: 'test@example.com',
        accountType: accountType,
        status: 'Active',
        emailVerified: true,
      });
  }

  /**
   * Setup mock for get customer profile
   */
  static mockGetCustomerProfile(
    customerId: string = 'customer-1',
    baseUrl: string = DEFAULT_BACKEND_URL,
  ) {
    return this.mockProfileManagement(baseUrl)
      .get(`/api/profiles/customer/${customerId}`)
      .reply(200, {
        customerId: customerId,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: {
          countryCode: '+1',
          number: '5551234567',
          formatted: '+1 555-123-4567',
        },
        onboardingCompleted: false,
      });
  }

  /**
   * Setup mock for get welper profile
   */
  static mockGetWelperProfile(
    welperId: string = 'welper-1',
    baseUrl: string = DEFAULT_BACKEND_URL,
  ) {
    return this.mockProfileManagement(baseUrl)
      .get(`/api/search/welpers/${welperId}`)
      .reply(200, {
        welperId: welperId,
        bio: 'Experienced service provider',
        defaultHourlyRate: 25.0,
        onboardingCompleted: false,
      });
  }

  /**
   * Setup mock for complete onboarding
   */
  static mockCompleteOnboarding(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockProfileManagement(baseUrl)
      .put('/api/profiles/me/onboarding-complete')
      .reply(200, {
        onboardingCompleted: true,
      });
  }

  /**
   * Setup mock for successful token refresh
   */
  static mockRefreshTokenSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/refresh')
      .reply(200, {
        accessToken: 'new-access-token',
      });
  }

  /**
   * Setup mock for failed token refresh
   */
  static mockRefreshTokenFailure(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/refresh')
      .reply(401, {
        statusCode: 401,
        message: 'Invalid refresh token',
      });
  }

  /**
   * Setup mock for verify email
   */
  static mockVerifyEmailSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/verify-email')
      .reply(200, {
        success: true,
      });
  }

  /**
   * Setup mock for resend verification email
   */
  static mockResendVerificationEmailSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/resend-verification')
      .reply(200, {
        success: true,
      });
  }

  /**
   * Setup mock for password reset request
   */
  static mockRequestResetPasswordSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/reset-password')
      .reply(200, {
        success: true,
      });
  }

  /**
   * Setup mock for password reset confirmation
   */
  static mockConfirmResetPasswordSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/reset-password/confirm')
      .reply(200, {
        success: true,
      });
  }

  /**
   * Setup mock for change password
   */
  static mockChangePasswordSuccess(baseUrl: string = DEFAULT_BACKEND_URL) {
    return this.mockUserManagement(baseUrl)
      .post('/api/auth/change-password')
      .reply(200, {
        success: true,
      });
  }

  /**
   * Clean up all mocks
   */
  static cleanAll() {
    nock.cleanAll();
  }
}
