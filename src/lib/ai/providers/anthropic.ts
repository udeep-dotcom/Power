import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  AIProvider,
  AICompletionRequest,
  AIVisionCompletionRequest,
  AICompletionResult,
} from "../provider";

const TOOL_NAME = "emit_structured_result";

type UserContent = string | Anthropic.Messages.ContentBlockParam[];

/**
 * Anthropic implementation of AIProvider. Structured output is enforced by
 * forcing a single tool call whose input schema is the caller's Zod schema
 * converted to JSON Schema, then validating the tool input with Zod again
 * before returning it. Section 57 requires this: never trust unstructured
 * AI text as if it were data.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor(readonly model: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env to enable AI extraction.");
    }
    this.client = new Anthropic({ apiKey });
  }

  async complete<T>(request: AICompletionRequest): Promise<AICompletionResult<T>> {
    return this.runStructured<T>(request.system, request.prompt, request.schema, request.maxTokens);
  }

  async completeVision<T>(request: AIVisionCompletionRequest): Promise<AICompletionResult<T>> {
    const content: Anthropic.Messages.ContentBlockParam[] = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: request.mimeType as "image/jpeg" | "image/png",
          data: request.imageBase64,
        },
      },
      { type: "text", text: request.prompt },
    ];
    return this.runStructured<T>(request.system, content, request.schema, request.maxTokens);
  }

  private async runStructured<T>(
    system: string,
    userContent: UserContent,
    schema: z.ZodTypeAny,
    maxTokens?: number,
  ): Promise<AICompletionResult<T>> {
    const jsonSchema = z.toJSONSchema(schema, { target: "draft-7" });
    const tools: Anthropic.Messages.Tool[] = [
      {
        name: TOOL_NAME,
        description: "Return the extraction result matching the required schema exactly.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input_schema: jsonSchema as any,
      },
    ];

    let response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens ?? 4096,
      system,
      messages: [{ role: "user", content: userContent }],
      tools,
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    let parsed = this.tryParse<T>(response, schema);

    if (!parsed.ok) {
      // Section 57: one automatic structured repair/retry, telling the model
      // exactly what was wrong, before giving up.
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens ?? 4096,
        system,
        messages: [
          { role: "user", content: userContent },
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: `Your previous tool call did not match the required schema. Validation error: ${parsed.error}. Call ${TOOL_NAME} again with corrected input that matches the schema exactly.`,
          },
        ],
        tools,
        tool_choice: { type: "tool", name: TOOL_NAME },
      });
      parsed = this.tryParse<T>(response, schema);
    }

    if (!parsed.ok) {
      throw new Error(`AI response failed schema validation after retry: ${parsed.error}`);
    }

    return {
      data: parsed.data,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      provider: this.name,
      model: this.model,
    };
  }

  private tryParse<T>(
    response: Anthropic.Messages.Message,
    schema: z.ZodTypeAny,
  ): { ok: true; data: T } | { ok: false; error: string } {
    const toolUse = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) {
      return { ok: false, error: "Model did not call the required tool" };
    }
    const result = schema.safeParse(toolUse.input);
    if (!result.success) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: result.data as T };
  }
}
