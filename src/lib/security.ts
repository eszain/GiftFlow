/**
 * GiftFlow Security Configuration
 * 
 * Centralized security utilities and configurations
 */

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';
import { userRolesSchema } from './validations/user';

// Rate limiting configuration
export const RATE_LIMITS = {
  wish_creation: { requests: 10, window: 60 * 60 * 1000 }, // 10 per hour
  fulfillment: { requests: 20, window: 60 * 60 * 1000 }, // 20 per hour
  api_general: { requests: 100, window: 60 * 1000 }, // 100 per minute
  auth_operations: { requests: 5, window: 60 * 1000 }, // 5 per minute
} as const;

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://clerk.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.clerk.com https://api.stripe.com https://*.supabase.co",
    "frame-src https://js.stripe.com https://clerk.com",
  ].join('; '),
} as const;

// Input sanitization patterns
export const SANITIZATION_PATTERNS = {
  xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  sql_injection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  path_traversal: /\.\.\//g,
  command_injection: /[;&|`$()]/g,
} as const;

// Security utility functions
export class SecurityUtils {
  /**
   * Validate user authentication and return user data
   */
  static async validateAuth(request: NextRequest) {
    try {
      const { userId } = auth();
      if (!userId) {
        throw new Error('Unauthorized');
      }

      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(userId: string, role: 'charity' | 'patron' | 'moderator' | 'admin'): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) return false;

      const roles = userRolesSchema.parse(user.roles);
      return roles[role] === true;
    } catch {
      return false;
    }
  }

  /**
   * Validate user permissions for resource access
   */
  static async validateResourceAccess(
    userId: string,
    resourceType: 'wish' | 'fulfillment' | 'user',
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) return false;

      const roles = userRolesSchema.parse(user.roles);

      // Admin can do everything
      if (roles.admin) return true;

      switch (resourceType) {
        case 'wish':
          const wish = await prisma.wish.findUnique({
            where: { id: resourceId },
            select: { charityId: true, status: true },
          });

          if (!wish) return false;

          // Owner can read/write their own wishes
          if (wish.charityId === userId) {
            return action === 'read' || (action === 'write' && ['DRAFT', 'REJECTED'].includes(wish.status));
          }

          // Moderators can read all wishes
          if (roles.moderator && action === 'read') return true;

          // Public can read eligible wishes
          if (action === 'read' && wish.status === 'ELIGIBLE') return true;

          return false;

        case 'fulfillment':
          const fulfillment = await prisma.fulfillment.findUnique({
            where: { id: resourceId },
            select: { patronId: true, wish: { select: { charityId: true } } },
          });

          if (!fulfillment) return false;

          // Patron can read their own fulfillments
          if (fulfillment.patronId === userId && action === 'read') return true;

          // Charity can read fulfillments for their wishes
          if (fulfillment.wish.charityId === userId && action === 'read') return true;

          return false;

        case 'user':
          // Users can read their own profile
          if (resourceId === userId && action === 'read') return true;

          // Users can update their own profile (but not roles)
          if (resourceId === userId && action === 'write') return true;

          // Admins can read/update all users
          if (roles.admin) return true;

          return false;

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    let sanitized = input;

    // Remove XSS attempts
    sanitized = sanitized.replace(SANITIZATION_PATTERNS.xss, '');
    
    // Remove SQL injection attempts
    sanitized = sanitized.replace(SANITIZATION_PATTERNS.sql_injection, '');
    
    // Remove path traversal attempts
    sanitized = sanitized.replace(SANITIZATION_PATTERNS.path_traversal, '');
    
    // Remove command injection attempts
    sanitized = sanitized.replace(SANITIZATION_PATTERNS.command_injection, '');

    return sanitized.trim();
  }

  /**
   * Validate and sanitize wish data
   */
  static sanitizeWishData(data: any) {
    return {
      title: this.sanitizeInput(data.title || ''),
      description: this.sanitizeInput(data.description || ''),
      city: this.sanitizeInput(data.city || ''),
      tags: Array.isArray(data.tags) 
        ? data.tags.map((tag: string) => this.sanitizeInput(tag)).filter(Boolean)
        : [],
    };
  }

  /**
   * Check rate limits
   */
  static async checkRateLimit(
    userId: string,
    endpoint: keyof typeof RATE_LIMITS
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const limit = RATE_LIMITS[endpoint];
    const now = Date.now();
    const windowStart = now - limit.window;

    // In a real implementation, you would use Redis or similar for rate limiting
    // For now, we'll use a simple in-memory approach (not suitable for production)
    
    // This is a placeholder - implement proper rate limiting with Redis
    return {
      allowed: true,
      remaining: limit.requests - 1,
      resetTime: now + limit.window,
    };
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    userId: string,
    event: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: userId,
          entityType: 'security_event',
          entityId: 'system',
          action: event,
          details: {
            ...details,
            severity,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    return { valid: true };
  }

  /**
   * Check for suspicious activity patterns
   */
  static async detectSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    
    try {
      // Check for rapid wish creation
      const recentWishes = await prisma.wish.count({
        where: {
          charityId: userId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      if (recentWishes > 5) {
        reasons.push('Rapid wish creation');
      }

      // Check for duplicate content
      const wishes = await prisma.wish.findMany({
        where: { charityId: userId },
        select: { title: true, description: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const titles = wishes.map(w => w.title.toLowerCase());
      const descriptions = wishes.map(w => w.description.toLowerCase());

      if (new Set(titles).size < titles.length * 0.7) {
        reasons.push('Duplicate wish titles');
      }

      if (new Set(descriptions).size < descriptions.length * 0.7) {
        reasons.push('Duplicate wish descriptions');
      }

      return {
        suspicious: reasons.length > 0,
        reasons,
      };
    } catch {
      return { suspicious: false, reasons: [] };
    }
  }
}

// Security middleware for API routes
export function withSecurity(handler: Function) {
  return async (request: NextRequest, context: any) => {
    try {
      // Add security headers
      const response = await handler(request, context);
      
      if (response instanceof Response) {
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    } catch (error) {
      // Log security events
      await SecurityUtils.logSecurityEvent(
        'system',
        'api_error',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'medium'
      );
      
      throw error;
    }
  };
}

// Export security configuration
export const SECURITY_CONFIG = {
  RATE_LIMITS,
  SECURITY_HEADERS,
  SANITIZATION_PATTERNS,
} as const;
