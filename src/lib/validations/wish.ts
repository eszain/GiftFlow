import { z } from "zod";

// Wish creation schema
export const createWishSchema = z.object({
  type: z.enum(["PREVERIFIED", "CUSTOM"]),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  amountCents: z.number().int().positive().optional(),
  tags: z.array(z.string()).min(1, "At least one tag is required").max(10, "Too many tags"),
  vendorLinks: z.array(z.string().url()).optional(),
  documents: z.array(z.object({
    url: z.string().url(),
    docType: z.enum(["INVOICE", "ESTIMATE", "MEDICAL", "ENROLLMENT", "OTHER"]),
  })).optional(),
});

// Wish update schema
export const updateWishSchema = createWishSchema.partial();

// Wish fulfillment schema
export const fulfillWishSchema = z.object({
  amountCents: z.number().int().positive("Amount must be positive"),
  provider: z.enum(["STRIPE", "DIRECT_VENDOR", "MANUAL_CHECK"]),
  receiptUrl: z.string().url().optional(),
});

// Wish search/filter schema
export const wishSearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional(),
  type: z.enum(["PREVERIFIED", "CUSTOM"]).optional(),
  status: z.enum(["ELIGIBLE"]).optional(), // Only allow eligible for public search
  minAmount: z.number().int().min(0).optional(),
  maxAmount: z.number().int().min(0).optional(),
  sortBy: z.enum(["newest", "amount", "relevance"]).default("newest"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// Pre-verified wish categories
export const PREVERIFIED_CATEGORIES = [
  "medical-expenses",
  "educational-materials",
  "housing-assistance",
  "food-assistance",
  "transportation",
  "childcare",
  "utilities",
  "clothing",
] as const;

export type CreateWishInput = z.infer<typeof createWishSchema>;
export type UpdateWishInput = z.infer<typeof updateWishSchema>;
export type FulfillWishInput = z.infer<typeof fulfillWishSchema>;
export type WishSearchInput = z.infer<typeof wishSearchSchema>;
