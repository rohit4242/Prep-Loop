import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional().default(""),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(""),
  CLERK_SECRET_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  LIVEKIT_URL: z.string().optional().default(""),
  LIVEKIT_API_KEY: z.string().optional().default(""),
  LIVEKIT_API_SECRET: z.string().optional().default(""),
  AGENT_INTERNAL_TOKEN: z.string().optional().default("dev-agent-token"),
  GUEST_COOKIE_SECRET: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    AGENT_INTERNAL_TOKEN: process.env.AGENT_INTERNAL_TOKEN,
    GUEST_COOKIE_SECRET: process.env.GUEST_COOKIE_SECRET,
  });
}

export function requireDatabaseUrl(): string {
  const url = getEnv().DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

export function guestSigningSecret(): string {
  const env = getEnv();
  return env.GUEST_COOKIE_SECRET || env.AGENT_INTERNAL_TOKEN;
}

export function isLiveKitConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET);
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getEnv().OPENAI_API_KEY);
}
