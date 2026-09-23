# Kanna Fork Context

This context describes the product boundary maintained by this fork and the conversation data it owns.

## Product boundary

**Fork**:
The independently maintained Kanna variant published from this repository, with product choices that may intentionally differ from upstream.
_Avoid_: Upstream, mirror

**Upstream**:
The `jakemor/kanna` repository used as a source of compatible maintenance and performance improvements.
_Avoid_: Origin, fork

**Removed product area**:
A capability intentionally excluded from this fork, even when upstream code still contains integration points for it.
_Avoid_: Dead feature, temporary omission

## Conversation data

**Transcript**:
The durable record of a chat's messages, tool activity, and provider state.
_Avoid_: Chat log, session dump

**Transcript window**:
The portion of a long transcript presented initially, with earlier conversation available on demand.
_Avoid_: Pagination, virtual list

**Transcript media**:
Images associated with tool results that are part of a transcript but are stored and loaded independently from its message text.
_Avoid_: Attachment, export asset

**Slim transcript**:
A transcript representation that retains the information needed for normal browsing while deferring large tool payloads and raw provider data.
_Avoid_: Truncated transcript, incomplete transcript

**Compatible upstream change**:
An upstream maintenance, correctness, performance, or small usability change that fits this fork's product boundary.
_Avoid_: Automatic sync, blind port

**Optional upstream feature**:
An upstream product capability that is not required for this fork to work and must be reviewed for personal usefulness before implementation.
_Avoid_: Required upgrade, free feature

**Codex model**:
A model Kanna can select through its Codex provider. Availability depends on the signed-in Codex account.
