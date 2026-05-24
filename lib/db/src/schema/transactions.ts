import { pgTable, serial, text, numeric, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  userId: text("user_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentApp: text("payment_app").notNull(),
  status: text("status").notNull(),
  isFraud: boolean("is_fraud").notNull().default(false),
  fraudType: text("fraud_type"),
  senderState: text("sender_state").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
