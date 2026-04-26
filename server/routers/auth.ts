import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { db } from "../db/connection";
import { users, invites } from "../db/schema";
import { hashPassword, verifyPassword } from "../middleware/auth";
import { logger } from "../middleware/logger";

const GENERIC_LOGIN_ERROR = "E-Mail oder Passwort falsch.";

export const authRouter = router({
  /**
   * Login with email + password. Sets session on success.
   * Returns the public user object (no passwordHash).
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      // Generic error so we don't leak whether the email exists.
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: GENERIC_LOGIN_ERROR });
      }
      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account ist deaktiviert." });
      }

      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: GENERIC_LOGIN_ERROR });
      }

      // Set session
      ctx.session.userId = user.id;
      ctx.session.userRole = user.role;
      ctx.session.email = user.email;

      // Persist last login (best-effort, don't block login on failure)
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id))
        .catch((err) => logger.warn({ msg: "lastLogin_update_failed", err: err?.message }));

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  /** Destroy the current session and clear the cookie. */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    await new Promise<void>((resolve) => {
      ctx.session.destroy(() => resolve());
    });
    ctx.res.clearCookie("area.sid");
    return { ok: true };
  }),

  /** Returns the currently logged-in user, or null. */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.userId) return null;
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.session.userId),
    });
    if (!user || !user.isActive) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }),

  /**
   * Public lookup of an invite by token — used by the Invite page to display
   * the user's name/email before they set a password. Does not consume the invite.
   */
  inviteInfo: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .query(async ({ input }) => {
      const invite = await db.query.invites.findFirst({
        where: eq(invites.token, input.token),
      });
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einladung nicht gefunden." });
      }
      if (invite.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Einladung bereits verwendet." });
      }
      if (invite.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Einladung abgelaufen." });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, invite.email),
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User nicht gefunden." });
      }

      return {
        email: user.email,
        name: user.name,
      };
    }),

  /**
   * Accept an invite: validates token, sets the password, marks invite used,
   * and logs the user in by setting the session.
   */
  acceptInvite: publicProcedure
    .input(z.object({
      token: z.string().length(64),
      password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben."),
    }))
    .mutation(async ({ ctx, input }) => {
      const invite = await db.query.invites.findFirst({
        where: eq(invites.token, input.token),
      });
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einladung nicht gefunden." });
      }
      if (invite.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Einladung bereits verwendet." });
      }
      if (invite.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Einladung abgelaufen." });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, invite.email),
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User nicht gefunden." });
      }

      const passwordHash = await hashPassword(input.password);
      const now = new Date();

      // Sequential updates — Drizzle/postgres-js doesn't expose easy transactions for query builder
      await db.update(users)
        .set({ passwordHash, lastLoginAt: now })
        .where(eq(users.id, user.id));
      await db.update(invites)
        .set({ usedAt: now })
        .where(eq(invites.id, invite.id));

      // Auto-login
      ctx.session.userId = user.id;
      ctx.session.userRole = user.role;
      ctx.session.email = user.email;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),
});
