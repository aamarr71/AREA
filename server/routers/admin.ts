import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { router, adminProcedure } from "../_core/trpc";
import { db } from "../db/connection";
import { users, invites } from "../db/schema";
import { generateInviteToken } from "../middleware/auth";
import { getMetrics, getRecentErrors } from "../middleware/metrics";
import { clearCache } from "../middleware/cache";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const adminRouter = router({
  // ----- Metrics & Cache (migrated from password-based to session-based admin auth) -----

  stats: adminProcedure.query(() => getMetrics()),

  errors: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(({ input }) => getRecentErrors(input?.limit)),

  clearCache: adminProcedure.mutation(() => {
    clearCache();
    return { ok: true };
  }),

  // ----- User Management -----

  /**
   * Create a new user (without password) and an invite token.
   * Returns the invite link — the admin shares it manually with the customer.
   */
  createInvite: adminProcedure
    .input(z.object({
      email: z.string().trim().toLowerCase().email(),
      name: z.string().trim().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ein User mit dieser E-Mail existiert bereits.",
        });
      }

      const [newUser] = await db.insert(users).values({
        email: input.email,
        name: input.name,
        role: "user",
        // passwordHash stays null until invite is accepted
      }).returning();

      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

      await db.insert(invites).values({
        token,
        email: input.email,
        invitedBy: ctx.userId,
        expiresAt,
      });

      // Build the invite link relative to the request host so it works in dev + prod.
      const proto = (ctx.req.headers["x-forwarded-proto"] as string) || ctx.req.protocol;
      const host = ctx.req.headers.host;
      const inviteLink = `${proto}://${host}/invite/${token}`;

      return {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        token,
        inviteLink,
        expiresAt,
      };
    }),

  /** List all users with their basic status. */
  listUsers: adminProcedure.query(async () => {
    const all = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });
    return all.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      hasPassword: u.passwordHash !== null,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }));
  }),

  /** Toggle a user's `isActive` flag. */
  toggleUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Du kannst dich nicht selbst deaktivieren.",
        });
      }
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User nicht gefunden." });
      }
      const [updated] = await db.update(users)
        .set({ isActive: !user.isActive })
        .where(eq(users.id, user.id))
        .returning();
      return { id: updated.id, isActive: updated.isActive };
    }),
});
