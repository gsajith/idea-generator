import { getDb } from "@/db/client";
import { getDistillStatus } from "@/distill/status";
import { formatTime, formatUsd } from "@/lib/format";
import { getSettings } from "@/settings";

/** Shows that the pipeline is alive: the last distill, any pass in progress, and today's spend. */
export async function DistillStatus() {
  const status = await getDistillStatus(getDb(), getSettings(), new Date());
  const capReached = status.spentTodayUsd >= status.capUsd;

  return (
    <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 rounded-md border border-neutral-800 px-4 py-3 text-sm">
      <div>
        <dt className="text-neutral-500">Last distill</dt>
        <dd>{status.lastFinishedAt ? formatTime(status.lastFinishedAt) : "Never"}</dd>
      </div>
      <div>
        <dt className="text-neutral-500">In progress</dt>
        <dd>{status.inProgressSince ? `Since ${formatTime(status.inProgressSince)}` : "No"}</dd>
      </div>
      <div>
        <dt className="text-neutral-500">Spent today</dt>
        <dd className={capReached ? "text-amber-400" : undefined}>
          {formatUsd(status.spentTodayUsd)} of {formatUsd(status.capUsd)}
          {capReached && ", cap reached"}
        </dd>
      </div>
    </dl>
  );
}
