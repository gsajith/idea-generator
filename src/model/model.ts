import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

/**
 * Which kind of model a call needs. The filter role is cheap and runs on every signal;
 * the reasoning role handles matching, linking, generating and the profile interview.
 */
export type ModelRole = "filter" | "reasoning";

export type ModelRequest<T> = {
  role: ModelRole;
  system: string;
  messages: Anthropic.MessageParam[];
  /** The reply must match this schema. */
  schema: z.ZodType<T>;
  maxTokens?: number;
};

export type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type ModelResult<T> = {
  output: T;
  usage: ModelUsage;
};

/** Every model call in the app goes through this. Tests pass a fake; production wraps the Anthropic SDK. */
export interface Model {
  call<T>(request: ModelRequest<T>): Promise<ModelResult<T>>;
}
