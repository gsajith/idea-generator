import { z } from "zod";
import type { Model } from "@/model/model";

export const interviewMessageSchema = z.object({
  from: z.enum(["interviewer", "builder"]),
  text: z.string().max(5_000),
});

/** One line of the profile interview: a question from the interviewer or an answer from the builder. */
export type InterviewMessage = z.infer<typeof interviewMessageSchema>;

/** What the interviewer says next: another question, or the draft profile that ends the interview. */
export type InterviewTurn = { kind: "question" | "draft"; text: string };

export type InterviewInput = {
  conversation: InterviewMessage[];
  /** The profile to build on, or null to write one from scratch. */
  existingProfile: string | null;
};

const MIN_QUESTIONS = 6;
const MAX_QUESTIONS = 10;

const SYSTEM = `You interview a software builder to write their builder profile: a plain-text description that an idea generator reads so the product ideas it suggests are ones this builder could and would build.

Ask one short question at a time. Adapt each question to the answers so far: follow up on anything vague, and skip what an answer already covered. Between them, the questions must cover:
- their skills and the stacks they are fast in
- what they enjoy building
- the project sizes they want
- whether they care about revenue or just shipping something fun
- areas that are off-limits
- a past project or two they are proud of

Ask between ${MIN_QUESTIONS} and ${MAX_QUESTIONS} questions in total, then write the draft profile instead of another question.

The draft is a few short paragraphs in the second person ("You build..."), concrete and specific, using the builder's own details. No headings or bullet lists.

If the builder already has a profile, treat this as an update. Ask about what may have changed or what the profile leaves out, and write a draft that keeps what still holds and changes only what the answers changed.

Reply with kind "question" and the question, or kind "draft" and the full profile text.`;

/**
 * One turn of the profile interview. Stateless: the caller holds the conversation and
 * passes it back each turn, along with the profile to build on if there is one.
 */
export async function interviewTurn(model: Model, input: InterviewInput): Promise<InterviewTurn> {
  const answerCount = input.conversation.filter((m) => m.from === "builder").length;
  const { output } = await model.call({
    role: "reasoning",
    system: SYSTEM,
    messages: [{ role: "user", content: interviewPrompt(input, answerCount) }],
    schema: turnSchema(answerCount),
  });
  return output;
}

// The schema holds the interview to its question range: no draft before the minimum,
// and nothing but a draft once the maximum is reached.
function turnSchema(answerCount: number) {
  const kinds =
    answerCount < MIN_QUESTIONS
      ? (["question"] as const)
      : answerCount >= MAX_QUESTIONS
        ? (["draft"] as const)
        : (["question", "draft"] as const);
  return z.object({ kind: z.enum(kinds), text: z.string().min(1) });
}

function interviewPrompt({ conversation, existingProfile }: InterviewInput, answerCount: number): string {
  const profile = existingProfile
    ? `The builder's current profile:\n<profile>\n${existingProfile}\n</profile>`
    : "The builder has no profile yet.";
  const transcript = conversation.length
    ? conversation
        .map((m) => `${m.from === "interviewer" ? "Interviewer" : "Builder"}: ${m.text}`)
        .join("\n\n")
    : "(The interview hasn't started. Ask the first question.)";
  return `${profile}\n\nThe interview so far (${answerCount} answered):\n<transcript>\n${transcript}\n</transcript>`;
}
