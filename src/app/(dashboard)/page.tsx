import { StatusArea } from "./status-area";

export default function IdeasPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Ideas</h1>
      <StatusArea />
      <p className="mt-6 text-sm text-neutral-400">Ideas ranked by score will show up here.</p>
    </>
  );
}
