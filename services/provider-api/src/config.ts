import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('8080').transform(Number),
  PAY_TO_PUBKEY: z.string().min(1, 'PAY_TO_PUBKEY is required'),
  USDC_MINT: z.string().min(1, 'USDC_MINT is required'),
  FACILITATOR_URL: z.string().url().default('http://localhost:8787'),
});

type EnvInput = z.input<typeof envSchema>;
type EnvOutput = z.output<typeof envSchema>;

export function loadConfig(): EnvOutput {
  const rawEnv: EnvInput = {
    PORT: process.env.PORT,
    PAY_TO_PUBKEY: process.env.PAY_TO_PUBKEY,
    USDC_MINT: process.env.USDC_MINT,
    FACILITATOR_URL: process.env.FACILITATOR_URL,
  };

  try {
    return envSchema.parse(rawEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(e => e.code === 'too_small')
        .map(e => e.path.join('.'));
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        `Please set these in your .env file or environment.`
      );
    }
    throw error;
  }
}

