# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.1.0 — 2026-11-09

First published release. The plugin had been running on its author's host for
some time; this is the point at which it became an installable, tested repo.

### Added

- Sidebar panel with a bank selector listing every memory bank the Hindsight
  server reports for the `default` account, plus connection state: resolved
  endpoint, server mode, whether a token was found, and health latency.
- Memory graph view: memory units as nodes with their semantic, temporal and
  entity links as edges, on a pannable, zoomable canvas.
- Entity co-mention view: entities joined when they appear in the same memory.
- Server-side `q` and memory-type filters, and a `limit` cap, so a large bank
  stays responsive.
- Four-layer connection resolution — plugin row, then `HINDSIGHT_*`
  environment, then `~/.hindsight/coding-agent.json`, then cloud default — with
  the winning layer reported in `connection.source`.
- Two read-only routes, `GET /api/hindsight/banks` and `GET
  /api/hindsight/graph`, on the harness's authenticated `/api` channel. The
  plugin registers no write route of any kind.
- Node-based CI (lint, tests, packaging and metadata checks on Node 20/22/24)
  and a tag-driven release workflow.
