export function createId(prefix?: string): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function createGuestId(): string {
  return `guest_${crypto.randomUUID()}`;
}

export function isGuestOwnerId(ownerId: string): boolean {
  return ownerId.startsWith("guest_");
}
