import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { type Model, ModelOutputError, type ModelRequest, type ModelResult, type ModelRole } from "./model";

type Price = { input: number; output: number };

// USD per million tokens, from Anthropic's pricing table as of 2026-10.
const PRICES: Record<string, Price> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
};

const DEFAULT_MODELS: Record<ModelRole, string> = {
  filter: "claude-haiku-5-5",
  reasoning: "claude-sonnet-5-5",
};

// Filtering is a simple keep-or-drop call per signal, so it runs at low effort.
const EFFORT: Record<ModelRole, "low" | undefined> = {
  filter: "low",
  reasoning: undefined,
};

const MAX_TOKENS = 16000;

/**
 * The production model. Model IDs come from FILTER_MODEL and REASONING_MODEL. A model
 * missing from PRICES needs FILTER_MODEL_PRICE or REASONING_MODEL_PRICE set as
 * "<input>,<output>" USD per million tokens. The SDK reads ANTHROPIC_API_KEY and
 * ANTHROPIC_BASE_URL itself, so a compatible endpoint only needs those set. Leave the options
 * out to use the SDK's own timeout and retries.
 */
export function createAnthropicModel(options: { timeoutMs?: number; maxRetries?: number } = {}): Model {
  const client = new Anthropic({ timeout: options.timeoutMs, maxRetries: options.maxRetries });
  const models: Record<ModelRole, { id: string; price: Price }> = {
    filter: resolveModel("filter"),
    reasoning: resolveModel("reasoning"),
  };

  return {
    async call<T>(request: ModelRequest<T>): Promise<ModelResult<T>> {
      const { id, price } = models[request.role];
      const effort = EFFORT[request.role];
      const maxTokens = request.maxTokens ?? MAX_TOKENS;
      const response = await client.messages.parse({
        model: id,
        max_tokens: maxTokens,
        system: request.system,
        messages: request.messages,
        output_config: { format: zodOutputFormat(request.schema), ...(effort && { effort }) },
      });

      const { input_tokens, output_tokens } = response.usage;
      const usage = {
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        costUsd: (input_tokens * price.input + output_tokens * price.output) / 1_000_000,
      };
      if (response.stop_reason === "refusal") {
        const reason = response.stop_details?.explanation ?? "no reason given";
        throw new ModelOutputError(`${id} refused: ${reason}`, usage);
      }
      if (response.stop_reason === "max_tokens") {
        throw new ModelOutputError(`${id} hit max_tokens (${maxTokens}) before finishing`, usage);
      }
      if (response.parsed_output === null) {
        throw new ModelOutputError(`${id} returned output that doesn't match the schema`, usage);
      }
      return { output: response.parsed_output, usage };
    },
  };
}

function resolveModel(role: ModelRole): { id: string; price: Price } {
  const prefix = role === "filter" ? "FILTER_MODEL" : "REASONING_MODEL";
  const id = process.env[prefix] || DEFAULT_MODELS[role];
  const envPrice = process.env[`${prefix}_PRICE`];
  if (envPrice) {
    const [input, output] = envPrice.split(",").map(Number);
    if (!Number.isFinite(input) || !Number.isFinite(output)) {
      throw new Error(`${prefix}_PRICE must be "<input>,<output>" USD per million tokens`);
    }
    return { id, price: { input, output } };
  }
  // Without a price the daily budget cap can't count spend, so fail at startup.
  const price = PRICES[id];
  if (!price) throw new Error(`No price for model "${id}". Set ${prefix}_PRICE.`);
  return { id, price };
}
