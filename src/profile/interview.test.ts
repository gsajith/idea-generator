import { describe, expect, it } from "vitest";
import { createFakeModel } from "@/model/fake";
import { interviewTurn, type InterviewMessage } from "./interview";

describe("interviewTurn", () => {
  it("asks the next question", async () => {
    const model = createFakeModel([
      { role: "reasoning", reply: { kind: "question", text: "Which stacks are you fastest in?" } },
    ]);

    const turn = await interviewTurn(model, { conversation: [], existingProfile: null });

    expect(turn).toEqual({ kind: "question", text: "Which stacks are you fastest in?" });
  });

  it("ends with a draft profile once the builder has answered enough", async () => {
    const draft = "Fast in Next.js and Postgres. Likes weekend-sized tools.";
    const model = createFakeModel([
      { match: "A habit tracker I shipped in a weekend", reply: { kind: "draft", text: draft } },
      { reply: { kind: "question", text: "Anything else?" } },
    ]);

    const turn = await interviewTurn(model, {
      conversation: answered([
        "Next.js, Postgres, Tailwind",
        "Small tools for myself",
        "Weekend projects",
        "Fun first, revenue is a bonus",
        "Nothing crypto",
        "A habit tracker I shipped in a weekend",
      ]),
      existingProfile: null,
    });

    expect(turn).toEqual({ kind: "draft", text: draft });
  });

  it("builds the draft on the existing profile", async () => {
    const existing = "You build Chrome extensions in plain TypeScript.";
    const updated = `${existing} Lately you also build small Next.js apps.`;
    const model = createFakeModel([
      { match: existing, reply: { kind: "draft", text: updated } },
      { reply: { kind: "draft", text: "A profile written from scratch." } },
    ]);

    const turn = await interviewTurn(model, {
      conversation: answered(["Next.js now too", "Same", "Same", "Same", "Same", "Same"]),
      existingProfile: existing,
    });

    expect(turn).toEqual({ kind: "draft", text: updated });
  });
});

/** A conversation where the interviewer asked one question per answer. */
function answered(answers: string[]): InterviewMessage[] {
  return answers.flatMap((answer, i) => [
    { from: "interviewer" as const, text: `Question ${i + 1}?` },
    { from: "builder" as const, text: answer },
  ]);
}
