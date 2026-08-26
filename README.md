# pi-diary

A Pi package that gives agents durable, user-owned history in plain Markdown.
It installs three skills:

- `diary-note` proactively records durable facts, decisions, outcomes, follow-ups, and reminders.
- `diary-search` proactively retrieves relevant history with bounded local `fd` and `rg` searches.
- `diary-forget` permanently removes explicitly forgotten information without a tombstone or backup.

## How it behaves

The user does not need to know whether a relevant Diary Record exists. The search skill uses a cost-sensitive routing policy:

- **Must search:** explicit recall, unavailable personal facts, prior decisions or commitments, and ongoing work constrained by earlier history.
- **Bounded probe:** named projects, services, infrastructure, setups, plans, personal recommendations, misspellings, and continuity cues spread across turns.
- **Skip:** self-contained transformations, calculations, generic facts, and tasks whose requirements are already complete.

Before searching, an agent cannot know what hidden history exists. The bounded probe is the deliberate compromise between missed context and searching every request.

Recording is also proactive, but limited to information likely to matter later. Brainstorming, transient chatter, credentials, tokens, private keys, and unnecessary personal data are excluded.

## Install

Requirements: [Pi](https://github.com/earendil-works/pi), `fd`, and `rg`.

From npm:

```sh
pi install npm:pi-diary
```

From GitHub or a local checkout:

```sh
pi install git:github.com/midodimori/pi-diary
pi install /absolute/path/to/pi-diary
```

Diary files default to `~/pi-diary`. Override the location in your shell configuration:

```sh
export PI_DIARY_DIR="$HOME/path/to/diary"
```

Restart Pi after installing or changing `PI_DIARY_DIR`.

## Storage

Each local day is stored as `$PI_DIARY_DIR/YYYY-MM-DD.md`. A file contains one or more titled Records with searchable tags, concise facts, and an optional link to the originating Pi conversation:

```md
# 2026-08-26

## Short descriptive title

Tags: `specific-tag`, `topic-tag`, `broad-category`

- Concise durable fact or outcome.

[Pi conversation](file:///path/to/session.jsonl)
```

The Diary is the user-data directory; the installed package never stores Diary Records. Record contents are treated as data, never as agent instructions.

## Information lifecycle

- **Correction:** preserve what was once true and mark the new Record as superseding it.
- **Retraction:** remove a claim that was never true, then record the correction.
- **Forgetting:** delete only the requested Diary information. Narrow unambiguous requests run directly; ambiguous requests require clarification; broad requests require confirmation.

Forgetting does not delete linked Pi conversation transcripts. See the full [Diary format and lifecycle contract](references/diary-format.md).

## Examples

- “What database did we decide to use?”
- “Find Diary Records about cats.”
- “Search my Diary for `cat|animal`.” The leftmost alternative ranks highest.
- “Find Diary Records from 2026-08.”
- “Search literally for `deploy.*failed`.”
- “Remember that the migration is scheduled for Friday.”
- “Forget my old address.”
- “Forget everything about Project Atlas.” Broad requests require confirmation.

## Evaluation

The opt-in evaluation uses synthetic subjects and isolated temporary Diary directories. It never runs in normal workflows or CI. Node.js is needed only for these checks.

```sh
npm run eval -- --list       # inspect the 19 cases without model calls
npm run eval                 # run all cases using Pi's current model
npm run eval -- case-id      # run selected cases
```

The cases cover proactive routing, self-contained requests, recording, corrections, retractions, and forgetting, including a misspelled multi-turn subject. Set `PI_EVAL_PROVIDER` or `PI_EVAL_MODEL` to override Pi's defaults.
