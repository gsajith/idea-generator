const utcTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
}).format;

/** A time for the dashboard, in UTC because that's how the server and the spend cap count days. */
export const formatTime = (time: Date) => `${utcTime(time)} UTC`;

export const formatUsd = (usd: number) => `$${usd.toFixed(2)}`;
