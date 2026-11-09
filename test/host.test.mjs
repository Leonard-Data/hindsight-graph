/**
 * One runnable check for the Host half: connection resolution precedence and
 * the two routes' real behaviour against the live Hindsight server when one is
 * reachable (skipped, not failed, when it is not).
 *
 * Run: node test/host.test.mjs
 */
import assert from 'node:assert/strict'
import { resolveConnection, createRoutes } from '../index.js'

// --- resolveConnection -------------------------------------------------------

// This machine has a real ~/.hindsight/coding-agent.json, which is a legitimate
// layer; the precedence cases point HINDSIGHT_CONFIG at nothing to isolate them.
const NO_FILE = { HINDSIGHT_CONFIG: '/nonexistent/hindsight-graph-test.json' }

{
  // Cloud is the default when nothing names an endpoint.
  const c = resolveConnection({}, NO_FILE)
  assert.equal(c.baseUrl, 'https://api.hindsight.vectorize.io')
  assert.equal(c.serverMode, 'cloud')
  assert.equal(c.hasToken, false)
}
{
  // Daemon mode derives the loopback URL from apiPort.
  const c = resolveConnection({}, { ...NO_FILE, HINDSIGHT_SERVER_MODE: 'daemon', HINDSIGHT_API_PORT: '9099' })
  assert.equal(c.baseUrl, 'http://127.0.0.1:9099')
}
{
  // The plugin row wins over the environment, and a trailing slash is trimmed.
  const c = resolveConnection(
    { apiUrl: 'http://example.test:1234/', apiToken: 'row' },
    { ...NO_FILE, HINDSIGHT_API_URL: 'http://env.test', HINDSIGHT_API_TOKEN: 'env' },
  )
  assert.equal(c.baseUrl, 'http://example.test:1234')
  assert.equal(c.apiToken, 'row')
  assert.equal(c.hasToken, true)
}
{
  // Env beats the config file; an absent file must not throw.
  const c = resolveConnection({}, { HINDSIGHT_CONFIG: '/nonexistent/x.json', HINDSIGHT_API_URL: 'http://env.test' })
  assert.equal(c.baseUrl, 'http://env.test')
  assert.equal(c.configFile, null)
}

// --- routes ------------------------------------------------------------------

const routes = createRoutes({}, { HINDSIGHT_SERVER_MODE: 'daemon', HINDSIGHT_API_PORT: '9077' })
assert.deepEqual(routes.map((r) => r.path), ['/api/hindsight/banks', '/api/hindsight/graph'])
for (const route of routes) assert.deepEqual(route.methods, ['GET'])

const call = async (path, query = '') => {
  const route = routes.find((r) => r.path === path)
  const response = await route.fetch(new Request(`http://local${path}${query}`))
  return { status: response.status, body: await response.json() }
}

// A missing bank is a client error, never an upstream call.
{
  const { status, body } = await call('/api/hindsight/graph')
  assert.equal(status, 400)
  assert.equal(body.ok, false)
  assert.match(body.error, /bank id is required/)
}

// Live server checks, skipped when the daemon is down.
const banks = await call('/api/hindsight/banks')
assert.equal(banks.status, 200)
assert.equal(banks.body.ok, true)
if (!banks.body.data.reachable) {
  console.log('host.test: Hindsight unreachable — live graph checks skipped')
} else {
  const list = banks.body.data.banks
  assert.ok(Array.isArray(list))
  if (list.length === 0) {
    console.log('host.test: no banks on this server — live graph checks skipped')
  } else {
    const bank = list[0].id
    const graph = await call('/api/hindsight/graph', `?bank=${encodeURIComponent(bank)}&limit=50`)
    assert.equal(graph.status, 200, JSON.stringify(graph.body))
    const data = graph.body.data
    assert.equal(data.bank, bank)
    assert.equal(data.mode, 'memories')
    assert.ok(Array.isArray(data.nodes) && Array.isArray(data.edges))
    const ids = new Set(data.nodes.map((n) => n.id))
    for (const node of data.nodes) assert.equal(typeof node.label, 'string')
    for (const edge of data.edges) {
      // Projection drops self-loops and dangling endpoints.
      assert.notEqual(edge.source, edge.target)
      assert.ok(ids.has(edge.source) && ids.has(edge.target))
    }

    const entities = await call('/api/hindsight/graph', `?bank=${encodeURIComponent(bank)}&mode=entities&limit=50`)
    assert.equal(entities.status, 200, JSON.stringify(entities.body))
    assert.equal(entities.body.data.mode, 'entities')
    for (const node of entities.body.data.nodes) {
      assert.ok(node.mentions === null || typeof node.mentions === 'number')
    }

    // A bank that does not exist must not look like an empty graph.
    const missing = await call('/api/hindsight/graph', '?bank=no-such-bank-xyz&limit=10')
    assert.ok(missing.status === 404 || missing.status === 502, `got ${missing.status}`)
    assert.equal(missing.body.ok, false)
  }
}

console.log('host.test: ok')
