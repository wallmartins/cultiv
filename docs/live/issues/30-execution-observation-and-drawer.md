---
title: Execution Observation and Drawer
doc_type: issue
status: in-review
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# Execution Observation and Drawer

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)
- Screen spec: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md) §5–6

## User stories covered

17, 18, 19, 20, 30

## What to build

Wire **Execution Watch**, live **Active Execution List** updates, **Active Execution Drawer**, and **Completion Notification** for in-flight **Async Runs**.

This vertical slice proves end-to-end that:

- each in-flight execution starts `executions.watch`; `ObservationHandle.stop()` on unmount
- list items show status: queued, running (percent), done, failed
- **ProgressSteps** (or equivalent) reflects `Execution Transition` progress
- on `completed`, **Completion Notification** toast fires when user is not viewing that execution's drawer
- clicking completed item opens **Active Execution Drawer** with `result.content`, copy, regenerate CTA, link to history detail
- failed items show error message and retry path to generate
- **Observation Failure** uses separate toast (not modeled as execution failure)
- user can navigate freely while watches continue (shell persists)

## Acceptance criteria

- [ ] In-flight execution shows live progress in active list.
- [ ] Completed execution triggers toast when user is elsewhere in app.
- [ ] Drawer displays generated text and copy action works.
- [ ] Watch cleans up on route unmount (no duplicate watches).
- [ ] Observation transport failure shows typed recovery message.

## Blocked by

- [29-generation-screen-end-to-end.md](./29-generation-screen-end-to-end.md)
