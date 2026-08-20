import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-3 p-6">
        <h1 className="text-2xl font-semibold">Sign up</h1>
        <p className="text-sm text-muted-foreground">
          Add Clerk keys to `.env.local` to create an account and save interview progress.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <SignUp />
    </div>
  );
}
