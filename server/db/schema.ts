import {
  pgTable,
  varchar,
  serial,
  integer,
  timestamp,
  boolean,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";

// ----- Enums -----
export const roleEnum = pgEnum("role", ["admin", "user"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["success", "error", "timeout"]);

// ----- Users (Makler-Kunden) -----
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  // Null until the invite has been accepted and a password set.
  passwordHash: varchar("password_hash", { length: 255 }),
  role: roleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// ----- Invites (Magic-Link) -----
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  invitedBy: integer("invited_by").notNull(), // admin user id
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ----- Analyses (History per user) -----
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  contentHash: varchar("content_hash", { length: 64 }),
  // JSON stringified result; postgres `text` is unbounded.
  result: text("result"),
  status: analysisStatusEnum("status").notNull(),
  errorMessage: varchar("error_message", { length: 1000 }),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ----- Inferred Types -----
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
