/** One post or comment as a source returns it, before it's stored as a signal. */
export type FetchedSignal = {
  /** Unique within the source, so a re-fetch can skip signals already stored. */
  externalId: string;
  author: string;
  url: string;
  publishedAt: Date;
  text: string;
  /** Comments directly under this signal. */
  replies: FetchedSignal[];
};

/** A post and the comments under it. */
export type FetchedThread = {
  title: string;
  post: FetchedSignal;
};

/** One place the generator listens to. Each source has its own fetching code. */
export type Source = {
  id: string;
  name: string;
  kind: "fixture";
  fetchIntervalHours: number;
  /** Returns the source's current threads. Signals the database already has are skipped. */
  fetch(now: Date): Promise<FetchedThread[]>;
};
