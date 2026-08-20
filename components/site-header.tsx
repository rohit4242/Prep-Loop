import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { ClerkHeaderActions } from "@/components/clerk-header-actions";

export function SiteHeader() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-2">
          {hasClerk ? (
            <ClerkHeaderActions />
          ) : (
            <Button nativeButton={false} variant="ghost" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
