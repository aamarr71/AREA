/**
 * Seed an initial admin user.
 *
 * Usage:
 *   ADMIN_EMAIL=amar@area.at ADMIN_NAME="Amar" ADMIN_PW=secret pnpm db:seed
 *
 * Or interactive: prompts for missing values via stdin.
 *
 * Idempotent: if a user with that email already exists, the password is
 * updated and the role is upgraded to "admin" (won't create duplicates).
 */
import "dotenv/config";
import readline from "node:readline";
import { eq } from "drizzle-orm";
import { db, client } from "./connection";
import { users } from "./schema";
import { hashPassword } from "../middleware/auth";
import { runMigrations } from "./migrate";

function prompt(question: string, opts: { silent?: boolean } = {}): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (opts.silent) {
    // Mute echoing for password input (best-effort; not perfect on all terminals)
    const stdout: any = process.stdout;
    const origWrite = stdout.write.bind(stdout);
    stdout.write = (chunk: any, ...rest: any[]) => {
      if (chunk.toString().includes(question)) return origWrite(chunk, ...rest);
      return true;
    };
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        stdout.write = origWrite;
        process.stdout.write("\n");
        rl.close();
        resolve(answer);
      });
    });
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("[seed] Running migrations…");
  await runMigrations();

  const email = (process.env.ADMIN_EMAIL || await prompt("Admin email: ")).trim().toLowerCase();
  if (!email) throw new Error("Admin email required.");

  const name = (process.env.ADMIN_NAME || await prompt("Admin name: ")).trim();
  if (!name) throw new Error("Admin name required.");

  const password = process.env.ADMIN_PW || await prompt("Admin password (min 8 chars): ", { silent: true });
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(password);
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    console.log(`[seed] User ${email} exists — updating password + ensuring admin role.`);
    await db.update(users)
      .set({ passwordHash, role: "admin", isActive: true, name })
      .where(eq(users.id, existing.id));
  } else {
    console.log(`[seed] Creating new admin user ${email}.`);
    await db.insert(users).values({
      email,
      name,
      passwordHash,
      role: "admin",
      isActive: true,
    });
  }

  console.log("[seed] Done.");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
