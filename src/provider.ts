import type { Extractor } from "./extract.js";

export interface ProviderConfig {
  endpoint: string;
  model: string;
  apiKey?: string;
  timeoutMs?: number;
  maxTokens?: number;
}
export interface Completion {
  text: string;
  usage: unknown;
  latency_ms: number;
  model: string;
}

/** Explicit opt-in transport; accepts an exact OpenAI-compatible chat-completions URL. */
export function createChatProvider(config: ProviderConfig): {
  complete: (messages: Parameters<Extractor>[0]) => Promise<Completion>;
  extract: Extractor;
} {
  const url = new URL(config.endpoint);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
  )
    throw new Error(
      "Endpoint requires HTTPS, or loopback HTTP, without URL credentials/query/fragment.",
    );
  if (!config.model.trim()) throw new Error("A model name is required.");
  for (const n of [config.timeoutMs ?? 60000, config.maxTokens ?? 4096])
    if (!Number.isSafeInteger(n) || n <= 0)
      throw new Error("Provider limits must be positive integers.");
  const complete = async (
    messages: Parameters<Extractor>[0],
  ): Promise<Completion> => {
    const started = performance.now();
    const response = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(config.timeoutMs ?? 60000),
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        max_tokens: config.maxTokens ?? 4096,
        stream: false,
        messages,
      }),
    });
    // Never echo remote error bodies: they may repeat prompts or secrets.
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Model endpoint returned HTTP ${response.status}.`);
    }
    if (!response.body)
      throw new Error("Model endpoint returned an empty response.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 1024 * 1024) throw new Error("Model response exceeds 1 MiB.");
      chunks.push(chunk);
    }
    let data;
    try {
      data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new Error("Model endpoint returned invalid JSON.");
    }
    if (!data || typeof data !== "object")
      throw new Error("Model endpoint returned an invalid envelope.");
    const choice = data.choices?.[0];
    if (choice?.finish_reason && choice.finish_reason !== "stop")
      throw new Error("Model response did not finish normally.");
    if (
      typeof choice?.message?.content !== "string" ||
      !choice.message.content.trim()
    )
      throw new Error("Model endpoint did not return text content.");
    return {
      text: choice.message.content,
      usage: data.usage ?? null,
      latency_ms: Math.round(performance.now() - started),
      model: data.model ?? config.model,
    };
  };
  return {
    complete,
    extract: async (messages) => (await complete(messages)).text,
  };
}
