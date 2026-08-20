import { auth } from "@clerk/nextjs/server";
import { ensureGuestId, readGuestId } from "@/lib/auth/guest";
import { isGuestOwnerId } from "@/lib/id";

async function getClerkUserId(): Promise<string | null> {
  if (!process.env.CLERK_SECRET_KEY) return null;
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

export type OwnerContext = {
  ownerId: string;
  isGuest: boolean;
  userId: string | null;
};

export async function getOptionalOwner(): Promise<OwnerContext | null> {
  const userId = await getClerkUserId();
  if (userId) {
    return { ownerId: userId, isGuest: false, userId };
  }
  const guestId = await readGuestId();
  if (!guestId) return null;
  return { ownerId: guestId, isGuest: true, userId: null };
}

export async function requireOwner(): Promise<OwnerContext> {
  const existing = await getOptionalOwner();
  if (existing) return existing;
  const guest = await ensureGuestId();
  return { ownerId: guest.id, isGuest: true, userId: null };
}

export async function requireSignedInOwner(): Promise<OwnerContext> {
  const userId = await getClerkUserId();
  if (!userId) {
    throw new Error("SIGN_IN_REQUIRED");
  }
  return { ownerId: userId, isGuest: false, userId };
}

export function assertOwnerAccess(recordOwnerId: string, requestOwnerId: string): void {
  if (recordOwnerId !== requestOwnerId) {
    throw new Error("OWNER_MISMATCH");
  }
}

export function canAccessOwnedRecord(recordOwnerId: string, requestOwnerId: string): boolean {
  return recordOwnerId === requestOwnerId && Boolean(requestOwnerId);
}

export { isGuestOwnerId };
