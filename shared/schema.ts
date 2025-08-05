import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// WooCommerce Order Types
export const wooCommerceOrderSchema = z.object({
  id: z.number(),
  number: z.string(),
  status: z.string(),
  currency: z.string(),
  total: z.string(),
  date_created: z.string(),
  billing: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string().optional(),
    address_1: z.string(),
    address_2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  shipping: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string().optional(),
    address_1: z.string(),
    address_2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
  }).optional(),
  line_items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    product_id: z.number(),
    quantity: z.number(),
    total: z.string(),
    sku: z.string().optional(),
  })),
  shipping_lines: z.array(z.object({
    id: z.number(),
    method_title: z.string(),
    total: z.string(),
  })).optional(),
});

export const orderLookupRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const orderLookupResponseSchema = z.object({
  success: z.boolean(),
  customer_email: z.string().email(),
  total_orders: z.number(),
  total_value: z.string(),
  orders: z.array(wooCommerceOrderSchema),
  products: z.array(z.object({
    id: z.number(),
    name: z.string(),
    sku: z.string().optional(),
    quantity: z.number(),
    price: z.string(),
    total: z.string(),
    order_id: z.number(),
    order_number: z.string(),
    order_date: z.string(),
    order_status: z.string(),
    is_split_payment: z.boolean().optional(),
    split_payments: z.array(z.object({
      order_id: z.number(),
      order_number: z.string(),
      amount: z.string(),
      date: z.string(),
    })).optional(),
  })),
  debug_woocommerce_raw: z.array(z.any()).optional(), // For debugging WooCommerce data
});

// Formatted Product Type (for frontend display)
export const formattedProductSchema = z.object({
  id: z.number(),
  orderId: z.number(),
  price: z.string(),
  name: z.string(),
  description: z.string(),
  benefits: z.array(z.string()),
  purchaseDate: z.string(),
  isRefundable: z.boolean(),
  hasRefundRequest: z.boolean(),
  // Additional fields preserved from original
  quantity: z.number(),
  total: z.string(),
  order_number: z.string(),
  order_status: z.string(),
  sku: z.string().optional(),
  data_source: z.string().optional(), // 'woocommerce', 'gohighlevel', or 'stripe'
  is_split_payment: z.boolean().optional(),
  split_payments: z.array(z.object({
    order_id: z.number(),
    order_number: z.string(),
    amount: z.string(),
    date: z.string(),
  })).optional(),
});

// GoHighLevel schemas
export const ghlContactSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email(),
  locationId: z.string().optional(),
});

export const ghlProductSchema = z.object({
  name: z.string(),
  sku: z.string().optional(),
  quantity: z.number(),
  price: z.number(),
});

export const ghlTransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  status: z.string(),
  createdAt: z.string(),
  products: z.array(ghlProductSchema).optional(),
});

export const ghlContactsSearchResponseSchema = z.object({
  contacts: z.array(ghlContactSchema),
});

export const ghlTransactionsResponseSchema = z.object({
  transactions: z.array(ghlTransactionSchema),
});

export type WooCommerceOrder = z.infer<typeof wooCommerceOrderSchema>;
export type OrderLookupRequest = z.infer<typeof orderLookupRequestSchema>;
export type OrderLookupResponse = z.infer<typeof orderLookupResponseSchema>;
export type FormattedProduct = z.infer<typeof formattedProductSchema>;
export type GHLContact = z.infer<typeof ghlContactSchema>;
export type GHLTransaction = z.infer<typeof ghlTransactionSchema>;
export type GHLContactsSearchResponse = z.infer<typeof ghlContactsSearchResponseSchema>;
export type GHLTransactionsResponse = z.infer<typeof ghlTransactionsResponseSchema>;
