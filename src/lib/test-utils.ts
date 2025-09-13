// Test utilities for GiftFlow
import { prisma } from './prisma';
import { userRolesSchema } from './validations/user';

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  clerkUserId: 'test-clerk-user-id',
  roles: { charity: true, patron: true, moderator: false, admin: false },
  displayName: 'Test User',
  city: 'Test City',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockWish = {
  id: 'test-wish-id',
  charityId: 'test-user-id',
  type: 'PREVERIFIED' as const,
  title: 'Test Wish',
  description: 'Test description for a tax-deductible wish',
  city: 'Test City',
  amountCents: 100000, // $1,000
  status: 'ELIGIBLE' as const,
  tags: ['medical', 'test'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockFulfillment = {
  id: 'test-fulfillment-id',
  wishId: 'test-wish-id',
  patronId: 'test-patron-id',
  amountCents: 50000, // $500
  provider: 'STRIPE' as const,
  status: 'SUCCEEDED' as const,
  createdAt: new Date(),
};

// Test database helpers
export async function createTestUser(overrides: Partial<typeof mockUser> = {}) {
  const userData = { ...mockUser, ...overrides };
  return await prisma.user.create({
    data: {
      clerkUserId: userData.clerkUserId,
      roles: userData.roles,
      displayName: userData.displayName,
      city: userData.city,
      emailVerified: userData.emailVerified,
    },
  });
}

export async function createTestWish(overrides: Partial<typeof mockWish> = {}) {
  const wishData = { ...mockWish, ...overrides };
  return await prisma.wish.create({
    data: {
      charityId: wishData.charityId,
      type: wishData.type,
      title: wishData.title,
      description: wishData.description,
      city: wishData.city,
      amountCents: wishData.amountCents,
      status: wishData.status,
      tags: wishData.tags,
    },
  });
}

export async function createTestFulfillment(overrides: Partial<typeof mockFulfillment> = {}) {
  const fulfillmentData = { ...mockFulfillment, ...overrides };
  return await prisma.fulfillment.create({
    data: {
      wishId: fulfillmentData.wishId,
      patronId: fulfillmentData.patronId,
      amountCents: fulfillmentData.amountCents,
      provider: fulfillmentData.provider,
      status: fulfillmentData.status,
    },
  });
}

// Clean up test data
export async function cleanupTestData() {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actorUserId: { startsWith: 'test-' } },
        { entityId: { startsWith: 'test-' } },
      ],
    },
  });
  
  await prisma.fulfillment.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'test-' } },
        { patronId: { startsWith: 'test-' } },
        { wishId: { startsWith: 'test-' } },
      ],
    },
  });
  
  await prisma.wishDocument.deleteMany({
    where: {
      wishId: { startsWith: 'test-' },
    },
  });
  
  await prisma.wish.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'test-' } },
        { charityId: { startsWith: 'test-' } },
      ],
    },
  });
  
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'test-' } },
        { clerkUserId: { startsWith: 'test-' } },
      ],
    },
  });
}

// Security test helpers
export function validateUserRoles(roles: any): boolean {
  try {
    userRolesSchema.parse(roles);
    return true;
  } catch {
    return false;
  }
}

export function checkForPrivilegeEscalation(oldRoles: any, newRoles: any): boolean {
  // Check if user is trying to escalate to admin or moderator
  if (newRoles.admin && !oldRoles.admin) return true;
  if (newRoles.moderator && !oldRoles.moderator) return true;
  return false;
}

// API test helpers
export function createMockRequest(body: any = {}, headers: any = {}) {
  return {
    json: async () => body,
    headers: new Headers(headers),
    url: 'http://localhost:3000/api/test',
  } as Request;
}

export function createMockResponse() {
  const response = {
    status: 200,
    headers: new Headers(),
    body: null,
  };
  
  return {
    json: (data: any) => {
      response.body = data;
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: response.headers,
      });
    },
    status: (code: number) => {
      response.status = code;
      return {
        json: (data: any) => {
          response.body = data;
          return new Response(JSON.stringify(data), {
            status: code,
            headers: response.headers,
          });
        },
      };
    },
  };
}
