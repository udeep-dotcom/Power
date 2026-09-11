import { z } from "zod";
import { AnthropicProvider } from "./providers/anthropic";

export interface AICompletionRequest {
  /** Instructions the model must follow. Never derived from uploaded document content. */
  system: string;
  /** The user-turn content, including any untrusted document text, clearly fenced. */
  prompt: string;
  /** JSON schema the response must conform to (enforced by re-prompting on failure). */
  schema: z.ZodTypeAny;
  maxTokens?: number;
}

export interface AIVisionCompletionRequest {
  system: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
  schema: z.ZodTypeAny;
  maxTokens?: number;
}

export interface AICompletionResult<T> {
  data: T;
  promptTokens: number;
  completionTokens: number;
  provider: string;
  model: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  /** Runs a structured-extraction call and validates the result against `schema`. */
  complete<T>(request: AICompletionRequest): Promise<AICompletionResult<T>>;
  /** Same as `complete`, but the input is an image (Section 28: LLM vision as an OCR option). */
  completeVision<T>(request: AIVisionCompletionRequest): Promise<AICompletionResult<T>>;
}

/**
 * AI provider abstraction (Section 27). The rest of the app only depends on
 * this interface, never on a specific vendor SDK, so swapping providers is
 * an environment-variable change (AI_PROVIDER=anthropic|openai|gemini).
 */
export function getAIProvider(): AIProvider {
  const kind = process.env.AI_PROVIDER ?? "anthropic";

  switch (kind) {
    case "anthropic":
      return new AnthropicProvider(process.env.AI_MODEL ?? "claude-sonnet-5");
    case "openai":
      throw new Error(
        "AI_PROVIDER=openai is not implemented yet. Add src/lib/ai/providers/openai.ts " +
          "implementing the AIProvider interface, mirroring providers/anthropic.ts.",
      );
    case "gemini":
      throw new Error(
        "AI_PROVIDER=gemini is not implemented yet. Add src/lib/ai/providers/gemini.ts " +
          "implementing the AIProvider interface, mirroring providers/anthropic.ts.",
      );
    default:
      throw new Error(`Unknown AI_PROVIDER "${kind}"`);
  }
}

/** Cost estimate helper for Section 29 (admin cost visibility). Prices are USD per 1M tokens. */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-opus-5": { input: 15, output: 75 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  "claude-fable-5-1": { input: 1, output: 5 },
};

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (promptTokens / 1_000_000) * pricing.input + (completionTokens / 1_000_000) * pricing.output;
}
