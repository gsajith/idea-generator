import { getDb } from "@/db/client";
import { sources } from "@/sources/registry";
import { getSourceStatuses } from "@/sources/status";

const formatTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
}).format;

export default async function SourcesPage() {
  const statuses = await getSourceStatuses(getDb(), sources);

  return (
    <>
      <h1 className="text-xl font-semibold">Sources</h1>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-neutral-800 text-neutral-400">
          <tr>
            <th className="py-2 pr-4 font-medium">Source</th>
            <th className="py-2 pr-4 font-medium">Kind</th>
            <th className="py-2 pr-4 font-medium">Schedule</th>
            <th className="py-2 pr-4 font-medium">Last fetch</th>
            <th className="py-2 text-right font-medium">Signals</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map(({ source, lastFetchedAt, signalCount }) => (
            <tr key={source.id} className="border-b border-neutral-900">
              <td className="py-2 pr-4">{source.name}</td>
              <td className="py-2 pr-4 text-neutral-400">{source.kind}</td>
              <td className="py-2 pr-4 text-neutral-400">
                Every {source.fetchIntervalHours === 1 ? "hour" : `${source.fetchIntervalHours} hours`}
              </td>
              <td className="py-2 pr-4 text-neutral-400">
                {lastFetchedAt ? `${formatTime(lastFetchedAt)} UTC` : "Never"}
              </td>
              <td className="py-2 text-right tabular-nums">{signalCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
