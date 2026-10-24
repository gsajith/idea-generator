"use client";

import { useState, useTransition } from "react";
import type { InterviewMessage } from "@/profile/interview";
import { interviewTurnAction } from "./actions";

/**
 * The profile interview. It holds the conversation, builds on `profileText` (the editor's
 * current text), and hands the final draft to `onDraft`.
 */
export function InterviewChat({ profileText, onDraft }: { profileText: string; onDraft: (draft: string) => void }) {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTurn] = useTransition();

  function reset() {
    setMessages([]);
    setAnswer("");
    setError(false);
  }

  // Sends the conversation so far and appends the next question, or ends with the draft.
  // A failed turn changes nothing, so the answer stays in the box to send again.
  function takeTurn(conversation: InterviewMessage[]) {
    setError(false);
    startTurn(async () => {
      try {
        const turn = await interviewTurnAction(conversation, profileText);
        if (turn.kind === "draft") {
          reset();
          onDraft(turn.text);
        } else {
          setMessages([...conversation, { from: "interviewer", text: turn.text }]);
          setAnswer("");
        }
      } catch {
        setError(true);
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || pending) return;
    takeTurn([...messages, { from: "builder", text: answer.trim() }]);
  }

  const started = messages.length > 0 || pending;
  const asked = messages.filter((m) => m.from === "interviewer").length;
  const errorLine = error && <p className="text-sm text-red-400">The interviewer didn&apos;t answer. Try again.</p>;

  if (!started) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => takeTurn([])}
          className="rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
        >
          {profileText.trim() ? "Update with the interview" : "Write it with the interview"}
        </button>
        {errorLine}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-md border border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Interview{asked > 0 && <span className="font-normal text-neutral-500"> · question {asked}</span>}
        </h2>
        <button
          onClick={reset}
          disabled={pending}
          className="text-sm text-neutral-400 hover:text-neutral-100 disabled:opacity-40"
        >
          Cancel
        </button>
      </div>

      <ol className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <li
            key={i}
            className={
              m.from === "interviewer"
                ? "text-sm text-neutral-100"
                : "self-end whitespace-pre-wrap rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-200"
            }
          >
            {m.text}
          </li>
        ))}
        {pending && <li className="text-sm text-neutral-500">Thinking...</li>}
      </ol>

      {errorLine}

      <form onSubmit={submit} className="flex gap-2">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          // Locked while a turn is pending, so an edit can't be lost when the reply clears the box.
          disabled={pending}
          maxLength={5_000}
          rows={2}
          autoFocus
          placeholder="Your answer"
          className="flex-1 rounded-md border border-neutral-800 bg-neutral-950 p-2 text-sm focus:border-neutral-600 focus:outline-none disabled:opacity-60"
        />
        <button
          disabled={!answer.trim() || pending}
          className="rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
