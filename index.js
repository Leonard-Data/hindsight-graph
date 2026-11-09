/**
 * Host half of the Hindsight memory graph viewer.
 *
 * Read-only: the browser reaches Hindsight only through the two
 * `/api/hindsight/*` routes below, both GET, both forwarding to GET endpoints
 * of the Hindsight HTTP API. Nothing here can mutate a bank.
 *
 * Connection resolution mirrors the hindsight-coding-agents plugin's own chain
 * so the viewer always talks to the same server:
 *   plugin row config → HINDSIGHT_* env → ~/.hindsight/coding-agent.json
 *   → daemon default http://127.0.0.1:9077
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'hindsight-graph'
export const inject = ['connection']

const API_BASE = '/api/hindsight'
const CLOUD_URL = 'https://api.hindsight.vectorize.io'
const DEFAULT_PORT = 9077
const TIMEOUT_MS = 20000

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

function str(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function pick(...values) {
  for (const value of values) {
    const text = str(value)
    if (text) return text
  }
  return ''
}

function clampInt(value, min, max, fallback) {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function readJsonFile(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Resolve base URL and token from the plugin row, the environment and
 * `~/.hindsight/coding-agent.json` (whose top level is the only layer that can
 * be read without knowing the resolved bank).
 *
 * @param {Record<string, unknown>} config loader row `config`
 * @param {Record<string, string | undefined>} env
 */
export function resolveConnection(config = {}, env = process.env) {
  const settings = config && typeof config === 'object' ? config : {}
  const filePath = pick(env.HINDSIGHT_CONFIG) || join(homedir(), '.hindsight', 'coding-agent.json')
  const file = readJsonFile(filePath) || {}

  const mode = pick(settings.serverMode, env.HINDSIGHT_SERVER_MODE, file.serverMode) || 'cloud'
  // apiPort is a number in the JSON file and a string in the environment.
  const portSource = [settings.apiPort, env.HINDSIGHT_API_PORT, file.apiPort]
    .find((value) => value !== undefined && value !== null && String(value).trim() !== '')
  const port = clampInt(portSource, 1, 65535, DEFAULT_PORT)
  const explicit = pick(settings.apiUrl, settings.url, env.HINDSIGHT_API_URL, file.apiUrl)
  const baseUrl = (explicit || (mode === 'cloud' ? CLOUD_URL : `http://127.0.0.1:${port}`))
    .replace(/\/+$/, '')
  const apiToken = pick(settings.apiToken, env.HINDSIGHT_API_TOKEN, file.apiToken)

  return {
    baseUrl,
    apiToken,
    hasToken: Boolean(apiToken),
    serverMode: mode,
    source: explicit ? 'explicit' : mode === 'cloud' ? 'cloud default' : 'daemon port',
    configFile: file && Object.keys(file).length ? filePath.replace(homedir(), '~') : null,
  }
}

/** One upstream GET. Never throws; transport failure is `{ ok: false, status: 0 }`. */
async function hsFetch(connection, path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const startedAt = Date.now()
  try {
    const headers = { accept: 'application/json' }
    if (connection.apiToken) headers.authorization = `Bearer ${connection.apiToken}`
    const response = await fetch(`${connection.baseUrl}${path}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'manual',
    })
    const text = await response.text()
    let payload = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = null
    }
    if (!response.ok) {
      const detail = payload && typeof payload === 'object'
        ? str(payload.detail) || str(payload.error) || str(payload.message)
        : ''
      return {
        ok: false,
        status: response.status,
        payload: null,
        error: detail || `Hindsight answered HTTP ${response.status}`,
        latencyMs: Date.now() - startedAt,
      }
    }
    return { ok: true, status: response.status, payload, error: null, latencyMs: Date.now() - startedAt }
  } catch (error) {
    const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
    return {
      ok: false,
      status: 0,
      payload: null,
      error: aborted
        ? `Hindsight did not answer within ${TIMEOUT_MS} ms (${connection.baseUrl})`
        : `Could not reach Hindsight at ${connection.baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
      latencyMs: Date.now() - startedAt,
    }
  } finally {
    clearTimeout(timer)
  }
}

function publicConnection(connection) {
  return {
    baseUrl: connection.baseUrl,
    serverMode: connection.serverMode,
    source: connection.source,
    hasToken: connection.hasToken,
    configFile: connection.configFile,
  }
}

async function banksPayload(connection) {
  const health = await hsFetch(connection, '/health')
  const banks = health.ok ? await hsFetch(connection, '/v1/default/banks') : null
  const list = banks && banks.ok && banks.payload && Array.isArray(banks.payload.banks)
    ? banks.payload.banks.map((bank) => ({
        id: str(bank && bank.bank_id),
        name: str(bank && bank.name) || str(bank && bank.bank_id),
      })).filter((bank) => bank.id)
    : []
  return {
    at: new Date().toISOString(),
    connection: publicConnection(connection),
    reachable: health.ok,
    health: { ok: health.ok, status: health.status, error: health.error, latencyMs: health.latencyMs },
    banks: list,
    banksError: banks && !banks.ok ? banks.error : null,
  }
}

/** Keep only the fields the canvas renders; a bank graph payload can be large. */
function projectGraph(payload, mode) {
  const rawNodes = payload && Array.isArray(payload.nodes) ? payload.nodes : []
  const rawEdges = payload && Array.isArray(payload.edges) ? payload.edges : []
  const nodes = []
  const ids = new Set()
  for (const item of rawNodes) {
    const d = item && typeof item === 'object' && item.data && typeof item.data === 'object' ? item.data : item
    const id = str(d && d.id)
    if (!id || ids.has(id)) continue
    ids.add(id)
    const node = {
      id,
      label: str(d.label) || id.slice(0, 8),
      color: str(d.color) || null,
    }
    if (mode === 'entities') {
      const count = Number(d.mentionCount)
      node.mentions = Number.isFinite(count) ? count : null
    } else {
      node.text = str(d.text) || null
      node.date = str(d.date) || null
      node.context = str(d.context) || null
      node.entities = str(d.entities) || null
    }
    nodes.push(node)
  }
  const edges = []
  for (const item of rawEdges) {
    const d = item && typeof item === 'object' && item.data && typeof item.data === 'object' ? item.data : item
    const source = str(d && d.source)
    const target = str(d && d.target)
    // Self-loops carry no layout or reading value in this view.
    if (!source || !target || source === target) continue
    if (!ids.has(source) || !ids.has(target)) continue
    const weight = Number(d.weight)
    edges.push({
      source,
      target,
      linkType: str(d.linkType) || str(d.relation) || null,
      weight: Number.isFinite(weight) ? weight : null,
      color: str(d.color) || null,
      entityName: str(d.entityName) || null,
    })
  }
  const total = Number(payload && payload.total_units)
  return { nodes, edges, totalUnits: Number.isFinite(total) ? total : null }
}

async function graphPayload(connection, url) {
  const bank = str(url.searchParams.get('bank'))
  if (!bank) throw new HttpError(400, 'A bank id is required.')
  if (bank.length > 200) throw new HttpError(400, 'That bank id is too long.')
  const mode = url.searchParams.get('mode') === 'entities' ? 'entities' : 'memories'
  const limit = clampInt(url.searchParams.get('limit'), 10, 2000, 300)
  const q = str(url.searchParams.get('q')).slice(0, 200)
  const type = str(url.searchParams.get('type'))

  const path = mode === 'entities'
    ? `/v1/default/banks/${encodeURIComponent(bank)}/entities/graph?limit=${limit}`
    : `/v1/default/banks/${encodeURIComponent(bank)}/graph?limit=${limit}`
      + (q ? `&q=${encodeURIComponent(q)}` : '')
      + (type ? `&type=${encodeURIComponent(type)}` : '')

  const result = await hsFetch(connection, path)
  if (!result.ok) throw new HttpError(result.status === 404 ? 404 : 502, result.error)
  const graph = projectGraph(result.payload, mode)
  return { bank, mode, limit, q, type: type || null, latencyMs: result.latencyMs, ...graph }
}

function jsonResponse(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

async function handle(handler) {
  try {
    return jsonResponse(200, { ok: true, data: await handler() })
  } catch (error) {
    if (error instanceof HttpError) return jsonResponse(error.status, { ok: false, error: error.message })
    return jsonResponse(500, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/** Exported so the verification harness can exercise the routes without Cordis. */
export function createRoutes(config = {}, env = process.env) {
  const route = (path, handler) => ({
    path,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: (request) => handle(() => handler(resolveConnection(config, env), new URL(request.url))),
  })
  return [
    route(`${API_BASE}/banks`, (connection) => banksPayload(connection)),
    route(`${API_BASE}/graph`, (connection, url) => graphPayload(connection, url)),
  ]
}

export function apply(ctx, config = {}) {
  ctx.effect(() => {
    const disposers = createRoutes(config).map((route) => ctx.connection.fetch.register(route))
    return () => {
      for (const dispose of disposers) {
        try {
          void dispose()
        } catch {
          // A route already removed with the transport needs no cleanup.
        }
      }
    }
  }, 'hindsight-graph: read-only graph API routes')
}
