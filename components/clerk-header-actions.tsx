import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClerkHeaderActions() {
  return (
    <>
      <Show when="signed-in">
        <Button nativeButton={false} variant="ghost" render={<Link href="/dashboard" />}>
          Dashboard
        </Button>
        <Button nativeButton={false} variant="ghost" render={<Link href="/progress" />}>
          Progress
        </Button>
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost">Sign in</Button>
        </SignInButton>
      </Show>
    </>
  );
}
