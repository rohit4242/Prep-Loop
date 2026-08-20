import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requirePageUserId(): Promise<string> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect("/sign-in");
  }
  try {
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }
    return userId;
  } catch {
    redirect("/sign-in");
  }
}
