import { z } from "zod";

// User role schema
export const userRolesSchema = z.object({
  charity: z.boolean().default(false),
  patron: z.boolean().default(false),
  moderator: z.boolean().default(false),
  admin: z.boolean().default(false),
});

// User profile update schema
export const updateUserProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(100, "Display name too long").optional(),
  city: z.string().min(1, "City is required").max(100, "City name too long").optional(),
});

// Role assignment schema (admin only)
export const assignRolesSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roles: userRolesSchema,
});

// User search schema
export const userSearchSchema = z.object({
  query: z.string().optional(),
  roles: userRolesSchema.partial().optional(),
  city: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type UserRoles = z.infer<typeof userRolesSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
