import { z } from 'zod'

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('Takewise ERP'),
  VITE_API_BASE_URL: z.string().min(1),
  VITE_USE_MOCKS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues)
  throw new Error('Invalid environment config. Compare your .env with .env.example.')
}

export const env = {
  appName: parsed.data.VITE_APP_NAME,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  useMocks: parsed.data.VITE_USE_MOCKS,
  isDev: import.meta.env.DEV,
} as const