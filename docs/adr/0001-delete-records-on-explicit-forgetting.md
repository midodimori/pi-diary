# Delete Diary information on explicit forgetting requests

The Diary distinguishes change, error, and forgetting. A Correction preserves information that was once true as superseded history. A Retraction removes a claim that was never true and records the correction. When the user explicitly asks to forget or delete information, the dedicated `diary-forget` skill removes it instead of preserving it through supersession. Ambiguous intent preserves temporarily and requires clarification. Forgetting excludes linked Pi conversation transcripts, whose ownership and retention are separate.

Deletion is least-scope: remove the requested facts, affected tags, and duplicate occurrences; remove an entire Record only when nothing useful remains. Execute narrow unambiguous requests directly, ask for clarification on ambiguous matches, and confirm broad requests by showing only matching Record titles and count. Leave no tombstone or backup, and report changed Daily files without repeating deleted information.

This sacrifices historical provenance deliberately because retaining recoverable information after an explicit forgetting request would violate the user's privacy intent, and deletion cannot be reconstructed later.
