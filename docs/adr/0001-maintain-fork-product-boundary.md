# Maintain the fork's product boundary while syncing upstream

The fork will selectively integrate compatible upstream maintenance, correctness, performance, and small usability changes. Optional upstream features must be reviewed for personal usefulness before implementation. The fork permanently retains its removals of anonymous analytics, Kanna Cloud/pairing, chat sharing/export, and updater/nightly infrastructure. Voice recording and transcription remains excluded because it is a new product capability rather than maintenance. Transcript-media support may be integrated only without restoring the removed export viewer.

## Consequences

The fork may require manual adaptations when upstream changes cross a removed product area. Its history will represent fork-native integration rather than blindly reproducing upstream commits. A newer upstream release is not, by itself, a reason to port every intervening feature.

## Synchronization checkpoint

As of 2026-09-21, the fork's `main` is at `1b5f3e6` (`Apply selected upstream improvements`). The latest fetched `upstream/main` is `bec5028` (`Add generate_images, which saves and shows Nano Banana 2 Lite images`). The next upstream review should start from these refs, after refreshing `upstream`:

```sh
git log --oneline 1b5f3e6..upstream/main
git diff 1b5f3e6..upstream/main
```
