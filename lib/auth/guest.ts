import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { GUEST_COOKIE_NAME, GUEST_TTL_HOURS } from "@/lib/constants";
import { guestSigningSecret } from "@/lib/env";
import { createGuestId } from "@/lib/id";

export type GuestCookiePayload = {
  id: string;
  exp: number;
};

export function guestExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + GUEST_TTL_HOURS * 60 * 60 * 1000);
}

export function isGuestExpired(expiresAt: Date | string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return date.getTime() <= now.getTime();
}

export function signGuestValue(value: string, secret = guestSigningSecret()): string {
  const sig = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${sig}`;
}

export function verifyGuestValue(
  signed: string,
  secret = guestSigningSecret(),
): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = createHmac("sha256", secret).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

export function encodeGuestPayload(payload: GuestCookiePayload, secret?: string): string {
  return signGuestValue(`${payload.id}|${payload.exp}`, secret);
}

export function decodeGuestPayload(
  signed: string,
  secret?: string,
  now = Date.now(),
): GuestCookiePayload | null {
  const value = verifyGuestValue(signed, secret);
  if (!value) return null;
  const [id, expRaw] = value.split("|");
  const exp = Number(expRaw);
  if (!id?.startsWith("guest_") || !Number.isFinite(exp) || exp <= now) {
    return null;
  }
  return { id, exp };
}

export async function readGuestId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(GUEST_COOKIE_NAME)?.value;
  if (!raw) return null;
  return decodeGuestPayload(raw)?.id ?? null;
}

export async function ensureGuestId(): Promise<{ id: string; expiresAt: Date; created: boolean }> {
  const existing = await readGuestId();
  if (existing) {
    return { id: existing, expiresAt: guestExpiryDate(), created: false };
  }

  const id = createGuestId();
  const expiresAt = guestExpiryDate();
  const store = await cookies();
  store.set(GUEST_COOKIE_NAME, encodeGuestPayload({ id, exp: expiresAt.getTime() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { id, expiresAt, created: true };
}
