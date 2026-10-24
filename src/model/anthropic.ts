import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Model, ModelRequest, ModelResult, ModelRole } from "./model";

// USD per million tokens. Add a row here when pointing a role at another model.
const PRICES: Record<string, { input: number; output: number }> = {
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

/**
 * The production model. Model IDs come from FILTER_MODEL and REASONING_MODEL.
 * The SDK reads ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL itself, so a compatible
 * endpoint only needs those set.
 */
export function createAnthropicModel(client = new Anthropic()): Model {
  const models: Record<ModelRole, string> = {
    filter: process.env.FILTER_MODEL || DEFAULT_MODELS.filter,
    reasoning: process.env.REASONING_MODEL || DEFAULT_MODELS.reasoning,
  };
  for (const model of Object.values(models)) {
    // Without a price the daily budget cap can't count spend, so fail at startup.
    if (!PRICES[model]) throw new Error(`No price for model "${model}". Add it to PRICES.`);
  }

  return {
    async call<T>(request: ModelRequest<T>): Promise<ModelResult<T>> {
      const model = models[request.role];
      const effort = EFFORT[request.role];
      const response = await client.messages.parse({
        model,
        max_tokens: request.maxTokens ?? 16000,
        system: request.system,
        messages: request.messages,
        output_config: { format: zodOutputFormat(request.schema), ...(effort && { effort }) },
      });

      if (response.stop_reason === "refusal") {
        throw new Error(`${model} refused: ${response.stop_details?.explanation ?? "no reason given"}`);
      }
      if (response.stop_reason === "max_tokens") {
        throw new Error(`${model} hit max_tokens (${request.maxTokens ?? 16000}) before finishing`);
      }
      if (response.parsed_output === null) {
        throw new Error(`${model} returned output that doesn't match the schema`);
      }

      const price = PRICES[model];
      const { input_tokens, output_tokens } = response.usage;
      return {
        output: response.parsed_output,
        usage: {
          inputTokens: input_tokens,
          outputTokens: output_tokens,
          costUsd: (input_tokens * price.input + output_tokens * price.output) / 1_000_000,
        },
      };
    },
  };
}
