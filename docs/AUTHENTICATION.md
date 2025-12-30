# Authentication & Security Implementation

## Overview

This document describes the authentication and security system implemented for CogniNote.

## Features Implemented

### 1. JWT-Based Authentication
- **Access Tokens**: Short-lived (15 minutes) for API authentication
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Token Storage**: Refresh tokens stored in PostgreSQL with expiry tracking
- **Token Rotation**: New refresh token issued on each refresh

### 2. Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Validation**: Minimum 8 characters
- **No Storage**: Plain text passwords never stored

### 3. Role-Based Access Control (RBAC)
- **Roles**: USER, ADMIN, MODERATOR
- **Middleware**: `requireRole()`, `requireAdmin()`, `requireAdminOrModerator()`, `requireOwnership()`
- **Default**: New users assigned USER role

### 4. Session Management
- **Multiple Devices**: Users can be logged in on multiple devices
- **Individual Logout**: Revoke specific refresh token
- **Logout All**: Revoke all user's refresh tokens
- **Auto Cleanup**: Expired tokens automatically cleaned up

### 5. Security Measures

#### Input Validation
- Email format validation
- Password strength validation
- Request body validation with Joi

#### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout from current device
- `POST /api/auth/logout-all` - Logout from all devices (requires auth)
- `GET /api/auth/profile` - Get user profile (requires auth)

#### Protected Routes
Use the `authenticate` middleware:
```typescript
router.get('/protected', authenticate, handler);
```

Use RBAC middleware:
```typescript
router.delete('/admin', authenticate, requireAdmin, handler);
```

#### Error Handling
- No sensitive information in error messages
- Generic "Invalid email or password" for auth failures
- Proper HTTP status codes (401, 403, etc.)

## Security Checklist

### ✅ Completed
- [x] Passwords hashed with bcrypt
- [x] JWT tokens properly signed and verified
- [x] Refresh tokens stored in database
- [x] Token expiry enforced
- [x] Email validation
- [x] Password strength validation
- [x] Role-based access control
- [x] Secure error messages
- [x] Account deactivation support
- [x] Last login tracking

### ⚠️ Important Notes
1. **JWT_SECRET**: Must be changed in production (use strong random value)
2. **HTTPS Required**: Always use HTTPS in production
3. **Rate Limiting**: Already configured globally
4. **CORS**: Configure allowed origins properly
5. **Token Cleanup**: Consider implementing periodic cleanup job

## Usage Examples

### Register a New User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Access Protected Route
```bash
curl http://localhost:8000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Database Schema

### User Model
- `id`: UUID
- `email`: Unique, indexed
- `passwordHash`: bcrypt hash
- `fullName`: Optional
- `role`: USER | ADMIN | MODERATOR
- `isActive`: Boolean (for account deactivation)
- `lastLoginAt`: Timestamp
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### RefreshToken Model
- `id`: UUID
- `userId`: Foreign key to User
- `token`: Unique JWT string
- `expiresAt`: Timestamp
- `createdAt`: Timestamp

## Potential Future Enhancements

1. **OAuth2 Integration**
   - Google, GitHub, Microsoft providers
   - Already architected for easy addition

2. **Two-Factor Authentication (2FA)**
   - TOTP support
   - SMS verification

3. **Password Reset**
   - Email-based password reset
   - Secure token generation

4. **Account Verification**
   - Email verification on registration
   - Prevent unverified account usage

5. **Security Events Logging**
   - Failed login attempts
   - Suspicious activity detection
   - Login from new device notifications

6. **Advanced RBAC**
   - Fine-grained permissions
   - Resource-level access control
   - Dynamic role assignment

## Files Created/Modified

### New Files
- `src/types/auth.types.ts`
- `src/utils/password.util.ts`
- `src/utils/validation.util.ts`
- `src/services/token.service.ts`
- `src/services/auth.service.ts`
- `src/middlewares/auth.middleware.ts`
- `src/middlewares/rbac.middleware.ts`
- `src/controllers/auth.controller.ts`
- `src/tests/auth.test.ts`
- `src/tests/password.test.ts`
- `src/tests/token.test.ts`

### Modified Files
- `prisma/schema.prisma` - Added Role enum, RefreshToken model, updated User model
- `src/routes/auth.routes.ts` - Implemented all auth endpoints with Swagger docs
- `.env.example` - Added JWT configuration

## Testing

Run authentication tests:
```bash
npm test -- auth.test.ts
npm test -- password.test.ts
npm test -- token.test.ts
```

## Maintenance

### Regular Tasks
1. Monitor failed login attempts
2. Clean up expired refresh tokens (consider cron job)
3. Review user roles and permissions
4. Update JWT secret periodically (requires user re-login)
5. Monitor for security vulnerabilities in dependencies
