import { z } from "zod";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenRouterProvider } from "./providers/openrouter";

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
 * an environment-variable change (AI_PROVIDER=anthropic|openrouter|openai|gemini).
 *
 * `openrouter` is the recommended default for multi-model flexibility: one
 * adapter, and AI_MODEL selects any model OpenRouter serves (e.g.
 * "google/gemini-2.5-flash", "openai/gpt-4o-mini", "anthropic/claude-haiku-4.5")
 * with no code change. `anthropic` talks to Anthropic's API directly instead
 * of routing through OpenRouter.
 */
export function getAIProvider(): AIProvider {
  const kind = process.env.AI_PROVIDER ?? "anthropic";

  switch (kind) {
    case "anthropic":
      return new AnthropicProvider(process.env.AI_MODEL ?? "claude-sonnet-5");
    case "openrouter":
      return new OpenRouterProvider(process.env.AI_MODEL ?? "google/gemini-2.5-flash");
    case "openai":
      throw new Error(
        "AI_PROVIDER=openai is not implemented as a direct integration. Use AI_PROVIDER=openrouter " +
          'with AI_MODEL="openai/<model>" instead, or add src/lib/ai/providers/openai.ts against the ' +
          "official OpenAI SDK if you specifically need OpenAI's own API (not via OpenRouter).",
      );
    case "gemini":
      throw new Error(
        "AI_PROVIDER=gemini is not implemented as a direct integration. Use AI_PROVIDER=openrouter " +
          'with AI_MODEL="google/<model>" instead, or add src/lib/ai/providers/gemini.ts against the ' +
          "official Google GenAI SDK if you specifically need Google's own API (not via OpenRouter).",
      );
    default:
      throw new Error(`Unknown AI_PROVIDER "${kind}"`);
  }
}

/**
 * Cost estimate helper for Section 29 (admin cost visibility). Prices are USD
 * per 1M tokens. Keyed by the exact model ID/slug used in AI_MODEL, since
 * that's what AIUsage rows record — includes both direct Anthropic model IDs
 * and common OpenRouter slugs. OpenRouter pricing passes through vendor
 * rates with no markup as of the last check (Sept 2026); verify current
 * rates at openrouter.ai/models before relying on this for real budgeting —
 * this table is a reasonable estimate, not a billing source of truth.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic direct
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "claude-fable-5-1": { input: 10, output: 50 },
  // OpenRouter slugs (provider/model)
  "google/gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "google/gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
  "openai/gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "anthropic/claude-haiku-4.5": { input: 1, output: 5 },
  "anthropic/claude-sonnet-5": { input: 2, output: 10 },
};

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (promptTokens / 1_000_000) * pricing.input + (completionTokens / 1_000_000) * pricing.output;
}
