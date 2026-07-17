import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Stateless admin sessions: the cookie is "expiry.hmac(expiry)". No database,
// no external packages — just node:crypto.

const COOKIE_NAME = "nextcms_session";
const SESSION_HOURS = 12;

function secret() {
  return process.env.SESSION_SECRET || "nextcms-dev-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createSession() {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const token = `${expires}.${sign(String(expires))}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isLoggedIn(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig) return false;
  const expected = sign(expires);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(expires) > Date.now();
}

/** Guard for admin pages and server actions. */
export async function requireAdmin() {
  if (!(await isLoggedIn())) redirect("/admin/login");
}
