# Maintain the fork's product boundary while syncing upstream

The fork will selectively integrate compatible upstream maintenance, correctness, and performance changes through `upstream/main` at `0.65.1`, while permanently retaining its removals of anonymous analytics, Kanna Cloud/pairing, chat sharing/export, and updater/nightly infrastructure. Voice recording and transcription is also excluded from this sync because it is a new product capability rather than maintenance; transcript-media support may be integrated only without restoring the removed export viewer.

## Consequences

The fork may require manual adaptations when upstream changes cross a removed product area, and its history will represent fork-native integration rather than blindly reproducing upstream commits.
