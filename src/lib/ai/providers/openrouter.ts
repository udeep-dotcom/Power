import { z } from "zod";
import type {
  AIProvider,
  AICompletionRequest,
  AIVisionCompletionRequest,
  AICompletionResult,
} from "../provider";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TOOL_NAME = "emit_structured_result";

type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "user"; content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> }
  | { role: "assistant"; content: string | null; tool_calls: OpenRouterToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenRouterChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: OpenRouterToolCall[];
  };
  finish_reason: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: { message: string; code?: string | number };
}

/**
 * OpenRouter implementation of AIProvider (Section 27). OpenRouter speaks the
 * OpenAI-compatible chat-completions format regardless of which underlying
 * model (Anthropic, OpenAI, Google, ...) `model` names — so this one adapter
 * covers every model OpenRouter serves. There's no official OpenRouter SDK;
 * this uses plain `fetch` against their documented REST endpoint, which is
 * the correct approach for an OpenAI-compatible third-party API (as opposed
 * to reaching for an OpenAI SDK against Anthropic's own API, which we don't
 * do — see providers/anthropic.ts for that one).
 *
 * Structured output is enforced the same way as the Anthropic provider: a
 * forced tool/function call whose schema is the caller's Zod schema, with
 * the result re-validated by Zod and one automatic repair retry on failure
 * (Section 57).
 */
export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";
  private apiKey: string;

  constructor(readonly model: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set. Add it to .env to enable AI extraction via OpenRouter.");
    }
    this.apiKey = apiKey;
  }

  async complete<T>(request: AICompletionRequest): Promise<AICompletionResult<T>> {
    const messages: ChatMessage[] = [
      { role: "system", content: request.system },
      { role: "user", content: request.prompt },
    ];
    return this.runStructured<T>(messages, request.schema, request.maxTokens);
  }

  async completeVision<T>(request: AIVisionCompletionRequest): Promise<AICompletionResult<T>> {
    const messages: ChatMessage[] = [
      { role: "system", content: request.system },
      {
        role: "user",
        content: [
          { type: "text", text: request.prompt },
          { type: "image_url", image_url: { url: `data:${request.mimeType};base64,${request.imageBase64}` } },
        ],
      },
    ];
    return this.runStructured<T>(messages, request.schema, request.maxTokens);
  }

  private async runStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodTypeAny,
    maxTokens?: number,
  ): Promise<AICompletionResult<T>> {
    const jsonSchema = z.toJSONSchema(schema, { target: "draft-7" });
    const tools = [
      {
        type: "function" as const,
        function: {
          name: TOOL_NAME,
          description: "Return the extraction result matching the required schema exactly.",
          parameters: jsonSchema,
        },
      },
    ];
    const toolChoice = { type: "function" as const, function: { name: TOOL_NAME } };

    let response = await this.callApi(messages, tools, toolChoice, maxTokens);
    let parsed = this.tryParse<T>(response, schema);

    if (!parsed.ok) {
      // Section 57: one automatic structured repair/retry, telling the model
      // exactly what was wrong, before giving up.
      const choice = response.choices[0];
      const retryMessages: ChatMessage[] = [
        ...messages,
        {
          role: "assistant",
          content: choice?.message.content ?? null,
          tool_calls: choice?.message.tool_calls ?? [],
        },
        {
          role: "user",
          content: `Your previous tool call did not match the required schema. Validation error: ${parsed.error}. Call ${TOOL_NAME} again with corrected input that matches the schema exactly.`,
        },
      ];
      response = await this.callApi(retryMessages, tools, toolChoice, maxTokens);
      parsed = this.tryParse<T>(response, schema);
    }

    if (!parsed.ok) {
      throw new Error(`AI response failed schema validation after retry: ${parsed.error}`);
    }

    return {
      data: parsed.data,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      provider: this.name,
      model: response.model || this.model,
    };
  }

  private async callApi(
    messages: ChatMessage[],
    tools: unknown,
    toolChoice: unknown,
    maxTokens?: number,
  ): Promise<OpenRouterResponse> {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        // Optional but recommended by OpenRouter for attribution/rate-limit tracking.
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "FormFill",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        tool_choice: toolChoice,
        max_tokens: maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter request failed (${res.status} ${res.statusText}): ${body.slice(0, 500)}`);
    }

    const data = (await res.json()) as OpenRouterResponse;
    if (data.error) {
      throw new Error(`OpenRouter returned an error: ${data.error.message}`);
    }
    return data;
  }

  private tryParse<T>(
    response: OpenRouterResponse,
    schema: z.ZodTypeAny,
  ): { ok: true; data: T } | { ok: false; error: string } {
    const toolCall = response.choices[0]?.message.tool_calls?.find((tc) => tc.function.name === TOOL_NAME);
    if (!toolCall) {
      return { ok: false, error: "Model did not call the required tool" };
    }

    let args: unknown;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      return { ok: false, error: "Tool call arguments were not valid JSON" };
    }

    const result = schema.safeParse(args);
    if (!result.success) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: result.data as T };
  }
}
