import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Profiles table schema for Drizzle ORM.
 * Matches the existing Prisma schema exactly for seamless migration.
 */
export const profiles = sqliteTable(
  'profiles',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Basic profile information
    name: text('name').notNull().unique(),
    email: text('email').notNull(),
    phoneNumber: text('phone_number'),

    // Shipping address (required)
    shippingFirstName: text('shipping_first_name').notNull(),
    shippingLastName: text('shipping_last_name').notNull(),
    shippingAddressLine1: text('shipping_address_line1').notNull(),
    shippingAddressLine2: text('shipping_address_line2'),
    shippingCity: text('shipping_city').notNull(),
    shippingState: text('shipping_state').notNull(),
    shippingPostalCode: text('shipping_postal_code').notNull(),
    shippingCountry: text('shipping_country').notNull(),

    // Billing address (optional)
    billingFirstName: text('billing_first_name'),
    billingLastName: text('billing_last_name'),
    billingAddressLine1: text('billing_address_line1'),
    billingAddressLine2: text('billing_address_line2'),
    billingCity: text('billing_city'),
    billingState: text('billing_state'),
    billingPostalCode: text('billing_postal_code'),
    billingCountry: text('billing_country'),

    // Payment method (encrypted sensitive data)
    paymentMethodType: text('payment_method_type').notNull(),
    paymentMethodEncryptedData: text('payment_method_encrypted_data').notNull(),
    paymentHolderName: text('payment_holder_name').notNull(),

    // Profile metadata
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    lastUsedAt: text('last_used_at'),
    purchaseCount: integer('purchase_count').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

    // Anti-scalping tracking (JSON blob)
    dailyPurchases: text('daily_purchases').notNull().default('{}')
  },
  (table) => ({
    // Indexes for performance (matching Prisma schema)
    nameIdx: index('idx_profiles_name').on(table.name),
    emailIdx: index('idx_profiles_email').on(table.email),
    isActiveIdx: index('idx_profiles_is_active').on(table.isActive),
    createdAtIdx: index('idx_profiles_created_at').on(table.createdAt)
  })
)

// Export type definitions for use in repositories
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

// Export the schema for Drizzle Kit
export { profiles as schema }
