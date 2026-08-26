# Diary

The Diary preserves user-specific history so agents can remain consistent across conversations without requiring the user to restate prior context.

## Language

**Diary**:
The user's personal long-term record store consulted by agents.
_Avoid_: Memory, knowledge base, pi-diary

**Diary package**:
The installable Pi capability that records information in and retrieves information from the Diary.
_Avoid_: Diary, extension

**Daily file**:
The Diary container grouping Records from one local calendar date.
_Avoid_: Note, entry

**Record**:
A titled, tagged unit of durable information with conversation provenance.
_Avoid_: Note, entry, memory

**Durable information**:
A fact, decision, outcome, follow-up, or reminder likely to matter in a later conversation.
_Avoid_: Context, memory

**Proactive retrieval**:
An agent-initiated Diary search performed without an explicit search request because prior user history may change correctness, recommendations, commitments, or consistency.
_Avoid_: Automatic retrieval

**Must-search request**:
A request that explicitly asks for prior history or whose response requires unavailable user-specific history.
_Avoid_: Relevant request

**Bounded probe**:
A small Diary search used when named projects, services, infrastructure, setups, recommendations, plans, or continuity cues make history dependence plausible but uncertain.
_Avoid_: Full search

**Self-contained request**:
A request whose necessary inputs are present and whose correctness cannot be materially changed by personal history.
_Avoid_: Generic request

**Correction**:
A current user statement that replaces information which was once true while preserving the historical Record as superseded.
_Avoid_: Retraction, forgetting, deletion

**Retraction**:
A user statement that recorded information was never true. The false claim is removed and the correction is recorded.
_Avoid_: Correction, forgetting

**Forgetting request**:
An explicit user request to remove specified information from the Diary rather than preserve it as superseded history. It does not include linked Pi conversation transcripts.
_Avoid_: Correction, retraction
