# Authentication Architecture

## Overview

This document describes the authentication implementation aligned with the approved technical architecture decisions.

## Architecture Decisions

### Backend (NestJS)
- **Decision**: JWT with NestJS Passport
- **Implementation**: 
  - JWT access tokens (15-30 minutes expiry)
  - Refresh tokens (7-30 days expiry)
  - Token refresh endpoint: `/auth/refresh`
  - Token blacklisting (Redis)

### Frontend (Next.js)
- **Decision**: NextAuth.js (Auth.js) v5
- **Implementation**:
  - Credentials provider calling NestJS backend
  - JWT session strategy
  - Token storage in NextAuth session
  - API client uses tokens from session

## Authentication Flow

### 1. Login Flow

```
User → Login Form → NextAuth Credentials Provider
  → Backend API `/auth/login` (NestJS)
  → Backend returns: { accessToken, refreshToken, user, profile } (profile from profile domain)
  → NextAuth stores tokens and profile data in JWT session
  → User redirected to dashboard
```

### 2. API Request Flow

```
Client Component → API Client
  → getAccessToken() → NextAuth Session
  → Extract accessToken from session
  → Add Authorization: Bearer {accessToken} header
  → Backend validates JWT token
  → Request processed
```

### 3. Token Refresh Flow (Future)

```
API Request → 401 Unauthorized
  → Check if refreshToken exists
  → Call `/auth/refresh` with refreshToken
  → Backend returns new accessToken
  → Update NextAuth session
  → Retry original request
```

## Implementation Details

### NextAuth Configuration

**Location**: `lib/auth/config.ts`

- **Session Strategy**: JWT (stateless)
- **Callbacks**:
  - `jwt`: Stores accessToken and refreshToken from backend
  - `session`: Exposes accessToken to client components
  - `authorized`: Protects dashboard routes

### Auth Provider

**Location**: `lib/auth/providers.ts`

- **Credentials Provider**: Calls NestJS backend `/auth/login`
- **Expected Backend Response**:
  ```typescript
  {
    accessToken: string;      // JWT access token (15-30 min)
    refreshToken: string;     // JWT refresh token (7-30 days)
    user: { id, email, accountType, status, emailVerified };  // account only
    profile?: { onboardingCompleted: boolean };  // from profile domain
  }
  ```

### API Client

**Location**: `lib/api/client.ts`

- Automatically includes `Authorization: Bearer {accessToken}` header
- Gets token from NextAuth session via `getAccessToken()`
- Works in both client and server contexts

### Token Management

**Location**: `lib/api/get-token.ts`

- Client-side: Uses `getSession()` from `next-auth/react`
- Server-side: Uses `auth()` from `@/auth`
- Returns accessToken from session

## Environment Variables

```env
# BFF API (Backend for Frontend)
NEXT_PUBLIC_API_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Development vs Production

### Development
- Sign-in calls the real BFF (`NEXT_PUBLIC_API_URL`); ensure the API is running locally.

### Production
- Must connect to real NestJS backend
- No development fallback
- All authentication goes through backend API

## Security Considerations

1. **Token Storage**: Tokens stored in NextAuth JWT session (HttpOnly cookies preferred)
2. **Token Transmission**: Access tokens sent via Authorization header
3. **Token Expiry**: Access tokens expire in 15-30 minutes (backend configurable)
4. **Refresh Tokens**: Long-lived, stored securely, used for token refresh
5. **Token Blacklisting**: Not implemented in MVP (no Redis session store)

## Next Steps

1. ✅ NextAuth.js v5 configured
2. ✅ Credentials provider calling backend API (no social login)
3. ✅ JWT token storage in session
4. ✅ API client using tokens
5. ✅ Access token refresh via BFF `/api/auth/refresh` in JWT callback

## References

- **Client Architecture**: `Functional_Architecture/09-Client-Applications-Final-Decisions.md`
- **Backend Architecture**: `Functional_Architecture/10-Backend-Technical-Architecture-Final-Decisions.md`

