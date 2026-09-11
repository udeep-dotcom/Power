import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { OpenRouterProvider } from "@/lib/ai/providers/openrouter";

const schema = z.object({ fields: z.array(z.object({ fieldKey: z.string(), value: z.string() })) });

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

function toolCallResponse(args: unknown) {
  return {
    id: "gen-1",
    model: "google/gemini-2.5-flash",
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "emit_structured_result", arguments: JSON.stringify(args) },
            },
          ],
        },
        finish_reason: "tool_calls",
      },
    ],
    usage: { prompt_tokens: 120, completion_tokens: 40 },
  };
}

describe("OpenRouterProvider", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.OPENROUTER_API_KEY = originalKey;
  });

  it("throws immediately if OPENROUTER_API_KEY is not set", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => new OpenRouterProvider("google/gemini-2.5-flash")).toThrow(/OPENROUTER_API_KEY/);
  });

  it("sends an OpenAI-compatible request and parses a valid tool call", async () => {
    const validArgs = { fields: [{ fieldKey: "invoice_number", value: "INV-1" }] };
    const fetchMock = mockFetchOnce(200, toolCallResponse(validArgs));
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider("google/gemini-2.5-flash");
    const result = await provider.complete<z.infer<typeof schema>>({
      system: "extract fields",
      prompt: "DOCUMENT DATA: ...",
      schema,
    });

    expect(result.data).toEqual(validArgs);
    expect(result.promptTokens).toBe(120);
    expect(result.completionTokens).toBe(40);
    expect(result.provider).toBe("openrouter");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("google/gemini-2.5-flash");
    expect(body.tool_choice).toEqual({ type: "function", function: { name: "emit_structured_result" } });
    expect(body.messages[0]).toEqual({ role: "system", content: "extract fields" });
  });

  it("retries once with a correction message when the schema doesn't validate, then succeeds", async () => {
    const invalidArgs = { fields: [{ fieldKey: "invoice_number" /* missing value */ }] };
    const validArgs = { fields: [{ fieldKey: "invoice_number", value: "INV-1" }] };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => toolCallResponse(invalidArgs),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => toolCallResponse(validArgs),
        text: async () => "",
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider("google/gemini-2.5-flash");
    const result = await provider.complete<z.infer<typeof schema>>({
      system: "extract fields",
      prompt: "DOCUMENT DATA: ...",
      schema,
    });

    expect(result.data).toEqual(validArgs);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // The retry request must include the correction message explaining the failure.
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const lastMessage = retryBody.messages[retryBody.messages.length - 1];
    expect(lastMessage.role).toBe("user");
    expect(lastMessage.content).toMatch(/did not match the required schema/);
  });

  it("throws after the retry also fails validation", async () => {
    const invalidArgs = { fields: "not-an-array" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => toolCallResponse(invalidArgs),
      text: async () => "",
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider("google/gemini-2.5-flash");
    await expect(
      provider.complete<z.infer<typeof schema>>({ system: "x", prompt: "y", schema }),
    ).rejects.toThrow(/failed schema validation after retry/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws a clear error on a non-2xx HTTP response", async () => {
    const fetchMock = mockFetchOnce(401, { error: { message: "Invalid API key" } });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider("google/gemini-2.5-flash");
    await expect(
      provider.complete<z.infer<typeof schema>>({ system: "x", prompt: "y", schema }),
    ).rejects.toThrow(/401/);
  });

  it("sends an image_url content block for vision requests", async () => {
    const validArgs = { fields: [{ fieldKey: "supplier_name", value: "Acme" }] };
    const fetchMock = mockFetchOnce(200, toolCallResponse(validArgs));
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider("google/gemini-2.5-flash");
    await provider.completeVision<z.infer<typeof schema>>({
      system: "extract fields",
      prompt: "look at this image",
      imageBase64: "aGVsbG8=",
      mimeType: "image/png",
      schema,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const userMessage = body.messages[1];
    expect(userMessage.content).toEqual([
      { type: "text", text: "look at this image" },
      { type: "image_url", image_url: { url: "data:image/png;base64,aGVsbG8=" } },
    ]);
  });
});
