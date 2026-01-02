import { PrismaClient, User } from '@prisma/client';
import { AppError } from '../middlewares/error-handler.js';
import { PasswordUtil } from '../utils/password.util.js';
import { ValidationUtil } from '../utils/validation.util.js';
import { TokenService } from './token.service.js';
import { AuthTokens, RegisterRequest, LoginRequest, UserResponse, TokenPayload } from '../types/auth.types.js';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Validate input
    const validation = ValidationUtil.validateRegister(data);
    if (!validation.valid) {
      throw new AppError(validation.message || 'Validation failed', 400);
    }

    // Validate password strength
    const passwordValidation = PasswordUtil.validate(data.password);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message || 'Invalid password', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await PasswordUtil.hash(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName || null,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const refreshToken = TokenService.generateRefreshToken(tokenPayload);

    // Store refresh token
    await TokenService.storeRefreshToken(user.id, refreshToken);

    return {
      user: this.formatUserResponse(user),
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Login user
   */
  static async login(data: LoginRequest): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Validate input
    const validation = ValidationUtil.validateLogin(data);
    if (!validation.valid) {
      throw new AppError(validation.message || 'Validation failed', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const refreshToken = TokenService.generateRefreshToken(tokenPayload);

    // Store refresh token
    await TokenService.storeRefreshToken(user.id, refreshToken);

    return {
      user: this.formatUserResponse({ ...user, lastLoginAt: new Date() }),
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    // Validate token exists in database
    const isValid = await TokenService.validateRefreshToken(refreshToken);
    if (!isValid) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = TokenService.generateAccessToken(tokenPayload);
    const newRefreshToken = TokenService.generateRefreshToken(tokenPayload);

    // Revoke old refresh token and store new one
    await TokenService.revokeRefreshToken(refreshToken);
    await TokenService.storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user
   */
  static async logout(refreshToken: string): Promise<void> {
    await TokenService.revokeRefreshToken(refreshToken);
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(userId: string, currentAccessToken?: string): Promise<void> {
    // Revoke all refresh tokens
    await TokenService.revokeAllUserTokens(userId);
    
    // Blacklist current access token if provided
    if (currentAccessToken) {
      await TokenService.blacklistToken(currentAccessToken, userId);
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.formatUserResponse(user);
  }

  /**
   * Format user response (exclude sensitive data)
   */
  private static formatUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
