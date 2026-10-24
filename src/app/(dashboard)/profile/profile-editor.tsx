"use client";

import { useState, useTransition } from "react";
import { saveProfileAction } from "./actions";
import { InterviewChat } from "./interview-chat";

/**
 * The profile text with a save button. A finished interview drops its draft into the
 * same textarea, so the builder edits the draft before saving it like any other change.
 */
export function ProfileEditor({ savedText, updatedAt }: { savedText: string; updatedAt: Date | null }) {
  const [text, setText] = useState(savedText);
  const [fromDraft, setFromDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const dirty = text !== savedText;

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        await saveProfileAction(text);
        setFromDraft(false);
      } catch {
        setError("Saving failed. Try again.");
      }
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <InterviewChat
        hasProfile={savedText !== ""}
        onDraft={(draft) => {
          setText(draft);
          setFromDraft(true);
        }}
      />

      <div className="flex flex-col gap-2">
        {fromDraft && (
          <p className="text-sm text-amber-400">Draft from the interview. Edit it, then save.</p>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Your skills, the stacks you're fast in, what you like building, project sizes, revenue or fun, off-limits areas, past projects."
          className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm leading-relaxed focus:border-neutral-600 focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={!dirty || !text.trim() || saving}
            className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {dirty && (
            <button
              onClick={() => {
                setText(savedText);
                setFromDraft(false);
              }}
              className="text-sm text-neutral-400 hover:text-neutral-100"
            >
              Discard changes
            </button>
          )}
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            updatedAt && (
              // Formatted in the browser's time zone, which can differ from the server's render.
              <p className="text-xs text-neutral-500" suppressHydrationWarning>
                Saved {updatedAt.toLocaleString()}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
