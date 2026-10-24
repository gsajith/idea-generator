import type Anthropic from "@anthropic-ai/sdk";
import type { Model, ModelRequest, ModelResult, ModelRole } from "./model";

export type FakeReply = {
  /** Only match calls for this role. Omit to match either role. */
  role?: ModelRole;
  /** Only match calls whose system prompt or messages contain this text or match this pattern. */
  match?: string | RegExp;
  /** The model's output, or a function that builds it from the request. */
  reply: unknown;
};

type FakeModel = Model & {
  /** Every request the fake received, in order. */
  calls: ModelRequest<unknown>[];
};

/**
 * A scripted model for tests. Each call uses the first reply whose role and match fit.
 * Replies go through the request's schema, so a reply the real model couldn't send fails
 * the test. A call with no matching reply throws.
 */
export function createFakeModel(replies: FakeReply[], { costUsd = 0.01 } = {}): FakeModel {
  const calls: ModelRequest<unknown>[] = [];

  return {
    calls,
    async call<T>(request: ModelRequest<T>): Promise<ModelResult<T>> {
      calls.push(request);
      const text = requestText(request);
      const found = replies.find(
        (r) =>
          (!r.role || r.role === request.role) &&
          (r.match === undefined ||
            (typeof r.match === "string" ? text.includes(r.match) : r.match.test(text))),
      );
      if (!found) {
        throw new Error(`No fake reply for a ${request.role} call:\n${text.slice(0, 500)}`);
      }
      const raw = typeof found.reply === "function" ? found.reply(request) : found.reply;
      return {
        output: request.schema.parse(raw),
        usage: { inputTokens: 0, outputTokens: 0, costUsd },
      };
    },
  };
}

function requestText(request: ModelRequest<unknown>): string {
  return [request.system, ...request.messages.map(messageText)].join("\n");
}

function messageText(message: Anthropic.MessageParam): string {
  if (typeof message.content === "string") return message.content;
  return message.content.map((block) => (block.type === "text" ? block.text : "")).join("\n");
}
