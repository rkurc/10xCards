import { z } from "zod";

// Environment validation schema
const envSchema = z.object({
  supabase: z.object({
    url: z.string().url("Supabase URL must be a valid URL"),
    anonKey: z.string().min(1, "Supabase Anonymous Key is required"),
    serviceKey: z.string().optional(),
  }),
  isDevelopment: z.boolean(),
  isProduction: z.boolean(),
});

// Type derived from the schema
export type EnvConfig = z.infer<typeof envSchema>;

// Actual environment configuration
export const env: EnvConfig = {
  supabase: {
    url: import.meta.env.PUBLIC_SUPABASE_URL || "https://mock-supabase-url.com",
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "mock-key-for-development",
    serviceKey: import.meta.env.SUPABASE_SERVICE_KEY,
  },
  isDevelopment: import.meta.env.DEV === true,
  isProduction: import.meta.env.PROD === true,
};

// Validate required environment variables
export function validateEnvironment(): void {
  try {
    // Parse env with zod schema to validate
    const result = envSchema.safeParse(env);

    if (!result.success) {
      const formattedErrors = result.error.format();
      console.error("Environment validation failed:", formattedErrors);
      throw new Error("Invalid environment configuration");
    }

    // Additional check for required environment variables in production
    if (env.isProduction) {
      if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error(
          "Missing required environment variables in production: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY"
        );
      }
    }

    // Log for development environments
    if (env.isDevelopment) {
      console.log("Environment validated successfully");
    }
  } catch (error) {
    console.error("Environment validation error:", error);
    throw error;
  }
}
