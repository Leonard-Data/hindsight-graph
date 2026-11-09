# Hindsight memory graph

[![CI](https://github.com/Leonard-Data/hindsight-graph/actions/workflows/ci.yml/badge.svg)](https://github.com/Leonard-Data/hindsight-graph/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Leonard-Data/hindsight-graph?sort=semver)](https://github.com/Leonard-Data/hindsight-graph/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [DeepSeek Harness](https://github.com/Leonard-Data/deepseek-harness) Web UI
plugin that renders a project's [Hindsight](https://hindsight.vectorize.io)
coding-agent memory as a graph: the memory units the agent has accumulated, the
semantic, temporal and entity links between them, and a separate view of which
entities get mentioned together.

The `hindsight_*` agent tools can tell you what memory *says*. This plugin shows
you its *shape* — which clusters exist, which memories are isolated, which
entities hold the graph together — so you can see what the agent will retrieve
before it retrieves it.

## What it does

- **A sidebar panel** with a bank selector: every memory bank the Hindsight
  server reports for the `default` account, plus live connection state (resolved
  endpoint, server mode, whether a token was found, health latency).
- **Memory graph view** — memory units as nodes, their semantic/temporal/entity
  relationships as edges, rendered on a canvas you can pan, zoom and click.
- **Entity co-mention view** — entities as nodes, joined when they appear in the
  same memory, which is the fastest way to find the hubs of a project's memory.
- **Filters** — free-text query (`q`) and memory type, applied server-side so a
  large bank stays responsive.
- **Strictly read-only.** The plugin registers two `GET` routes and nothing
  else. There is no write, delete or re-index action anywhere in it, so browsing
  the graph cannot damage the memory the agent depends on.

## Requirements

- DeepSeek Harness with the Web UI, on Node.js 20 or newer.
- A reachable Hindsight API — either the hosted service or a local daemon. The
  [`@vectorize-io/hindsight-coding-agents`](https://www.npmjs.com/package/@vectorize-io/hindsight-coding-agents)
  plugin is the usual source of that endpoint, but this plugin does not depend
  on it: it resolves the connection independently.

Without a reachable server the panel still loads; it reports the endpoint it
resolved and the error it got, rather than showing an empty canvas.

## Installation

The plugin is a DSH bundle. Install it from a release tarball, from a clone, or
through the agent's own `plugin_manager` tool.

### From a release

```bash
curl -fLO https://github.com/Leonard-Data/hindsight-graph/releases/latest/download/local-hindsight-graph-0.1.0.tgz
dsh plugin install ./local-hindsight-graph-0.1.0.tgz
```

### From a clone

```bash
git clone https://github.com/Leonard-Data/hindsight-graph.git
cd hindsight-graph
npm test                       # optional: the checks are dependency-free
dsh plugin install .
```

### Through the agent

Ask the agent to run `plugin_manager` with `install_bundle` against the
directory you cloned into, for example `/root/plugins/hindsight-graph`.

Then restart the harness process so the Web UI picks up the new client bundle,
and open the graph icon in the sidebar.

## Configuration

The plugin row in the profile's `cordis.yml` accepts four optional keys:

| Key | Type | Meaning |
| --- | --- | --- |
| `apiUrl` | string | Full base URL of the Hindsight API. Overrides everything else; a trailing slash is trimmed. |
| `apiToken` | string | Bearer token sent as `Authorization: Bearer …`. |
| `serverMode` | `cloud` \| `daemon` | `cloud` uses `https://api.hindsight.vectorize.io`; `daemon` builds `http://127.0.0.1:<apiPort>`. |
| `apiPort` | number | Loopback port in `daemon` mode. Default `9077`. |

```yaml
- insert:
    - id: hindsight-graph
      name: '@local/hindsight-graph'
      config:
        serverMode: daemon
        apiPort: 9077
```

With no config, the connection is resolved in this order, first hit winning:

1. the plugin row above;
2. the environment: `HINDSIGHT_API_URL`, `HINDSIGHT_API_TOKEN`,
   `HINDSIGHT_SERVER_MODE`, `HINDSIGHT_API_PORT`, `HINDSIGHT_CONFIG`;
3. the top level of `~/.hindsight/coding-agent.json` — the same file the
   `hindsight-coding-agents` plugin writes, so pointing that plugin at a server
   points this one at the same server;
4. the default: cloud mode, no token.

This is deliberate: there is no separate credential to keep in sync. `GET
/api/hindsight/banks` reports which layer won in its `connection.source` field,
which is the quickest way to debug an unexpected endpoint.

## HTTP routes

Both routes live on the harness's authenticated `/api` channel, so only the
harness owner's browser session reaches them.

| Route | Query | Returns |
| --- | --- | --- |
| `GET /api/hindsight/banks` | — | connection state, health, and the bank list |
| `GET /api/hindsight/graph` | `bank`, `mode=memories\|entities`, `limit`, `q`, `type` | nodes and edges, trimmed to the fields the canvas renders |

## Package layout

| File | Role |
| --- | --- |
| `index.js` | Host plugin: connection resolution and the two read-only API routes |
| `client.js` | Web client module: sidebar entry, bank selector, graph canvas |
| `cordis.patch.yml` | Inserts the plugin row into the profile |
| `locale/*.json` | Plugin Manager title and description (`en`, `zh`) |
| `icon.svg` | Panel artwork |
| `test/host.test.mjs` | Connection-precedence checks, plus live-server checks that skip when no server answers |

## Development

No dependencies, so there is nothing to install:

```bash
npm run lint    # node --check on both modules
npm test        # node:test
npm run build   # npm pack --dry-run: what a release would ship
```

## License

[MIT](LICENSE)
