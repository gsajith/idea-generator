# Idea generator

A personal tool that listens to places where consumers talk, distills what they say into needs, and turns those needs into product ideas sized for one builder.

## Language

### Listening

**Source**:
One place the generator listens to, such as a single subreddit or a single RSS feed. Each source has its own fetch schedule.
_Avoid_: Pipeline, feed, channel

**Signal**:
One raw item pulled from a source, such as a post, comment, article or review.
_Avoid_: Post, item, datapoint

**Thread**:
A post and the comments under it. The post and each comment are separate signals that belong to the same thread.
_Avoid_: Conversation, discussion

**Fetch**:
Pulling new signals from one source, on that source's own schedule. A fetch stores signals and does not interpret them.
_Avoid_: Run, sync, crawl, scrape

**Tick**:
The hourly wake-up that starts all scheduled work: it fetches every source that is due, and starts or continues a distill when one is due. It stops before its deadline and leaves the rest for the next tick.
_Avoid_: Cron, job, heartbeat

### Distilling

**Distill**:
One pass over every signal fetched since the last distill, which updates needs and ideas. Distills run on their own schedule, separate from fetches.
_Avoid_: Run, process, analysis

**Need**:
A problem consumers have, backed by the signals that show it. A need persists across distills and grows as new signals attach to it.
_Avoid_: Pain point, problem, insight

**Emerging need**:
A need without enough backing to get ideas yet: fewer than 3 signals, or signals from fewer than 2 authors. It stops being emerging once it clears that bar.
_Avoid_: Weak need, candidate, early signal

**Idea**:
A product the builder could make that would solve one or more needs.
_Avoid_: Opportunity, concept, suggestion

**Build sketch**:
The part of an idea that says how the builder would make it: its rough shape, a fitting stack and an estimated size.
_Avoid_: Plan, spec, implementation

**Score**:
How strongly an idea is backed right now: its recent backing signals minus a penalty for each undercut.
_Avoid_: Rank, rating, confidence

**Dismissed idea**:
An idea the builder hid from the feed. It returns if its backing doubles, and it does not steer future distills.
_Avoid_: Rejected, archived, deleted

**Backing**:
Support for something further down the chain: a signal backs a need, and a need backs an idea it would solve.
_Avoid_: Validation, evidence, support

**Undercut**:
A signal that argues against an idea, such as an existing competitor or a price objection, recorded with a one-line reason.
_Avoid_: Invalidation, counter-evidence, rejection

### Relationships

- A **signal** backs zero or more **needs**.
- A **need** backs zero or more **ideas**, and an **idea** is backed by one or more **needs**.
- A **signal** can undercut an **idea**.
- Backing and undercuts change how an **idea** ranks. Neither one deletes anything.

### The builder

**Builder profile**:
A plain-text description of the builder's skills, tastes and preferred project size that idea generation reads to keep ideas buildable. Needs never read it.
_Avoid_: Preferences, settings, persona

**Profile interview**:
A conversation that asks the builder questions and writes or updates the builder profile from the answers.
_Avoid_: Onboarding, profile builder, wizard
