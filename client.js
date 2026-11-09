window.__ModuleLoader__.load({
  id: '@local/hindsight-graph',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useCallback } = React

    const NS = 'hindsight-graph'
    const PANEL_ID = 'hindsight-graph'
    const API_BASE = '/api/hindsight'
    const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    const LIMITS = [100, 300, 600, 1200]
    const MODES = [
      { value: 'memories', labelKey: 'modeMemories' },
      { value: 'entities', labelKey: 'modeEntities' },
    ]

    const EN = {
      panel: 'Hindsight graph',
      title: 'Hindsight memory graph',
      desc: 'Every node is one memory unit; edges are the semantic, temporal and entity links Hindsight recorded between them. Switch to the entity view to see which entities are mentioned together. Read-only.',
      refresh: 'Refresh',
      loading: 'Loading Hindsight…',
      loadFailed: 'Could not load the Hindsight connection status.',
      retry: 'Try again',
      unknown: 'Unknown',
      yes: 'Yes',
      no: 'No',
      statusConnected: 'Connected',
      statusOffline: 'Offline',
      statusChecking: 'Checking…',
      setupTitle: 'Hindsight is not reachable',
      setupDesc: 'The harness cannot reach the Hindsight server, so there is no memory graph to draw. Start the daemon or point the viewer at a running server, then retry.',
      setupEndpoint: 'Resolved endpoint',
      setupMode: 'Server mode',
      setupSource: 'Endpoint source',
      setupToken: 'API token configured',
      setupConfigFile: 'Configuration file',
      setupHealth: 'Health check failed',
      setupHow: 'How to connect',
      setupHowDaemon: 'In daemon mode the server runs locally; check it with: curl http://127.0.0.1:9077/health',
      setupHowFile: 'Or set apiUrl and apiToken in ~/.hindsight/coding-agent.json, then restart the harness.',
      bankLabel: 'Bank',
      modeLabel: 'View',
      modeMemories: 'Memory units',
      modeEntities: 'Entities',
      limitLabel: 'Nodes',
      filterLabel: 'Filter',
      filterPlaceholder: 'Substring in memory text',
      apply: 'Apply',
      noBanksTitle: 'No memory banks yet',
      noBanksDesc: 'Hindsight is reachable but holds no bank for this server. Open a session in a project so memory gets seeded.',
      banksError: 'Could not list the banks:',
      graphLoading: 'Building the graph…',
      graphFailed: 'Could not load the graph.',
      graphEmptyTitle: 'Nothing to draw',
      graphEmptyDesc: 'This bank returned no memory units for the current filter.',
      statNodes: '{count} nodes',
      statEdges: '{count} edges',
      statTotal: '{count} units in bank',
      statElapsed: '{ms} ms',
      legendSemantic: 'semantic',
      legendTemporal: 'temporal',
      legendEntity: 'entity',
      legendOther: 'other',
      detailEmptyTitle: 'Select a node',
      detailEmptyDesc: 'Click a node in the graph to read the memory it holds.',
      detailClose: 'Close',
      detailMentions: 'Mentioned {count} times',
      detailContext: 'Context',
      detailEntities: 'Entities',
      detailNeighbours: 'Linked nodes ({count})',
      detailCopy: 'Copy text',
      detailCopied: 'Copied',
      detailCopyFailed: 'Copy failed',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      zoomReset: 'Reset view',
      graphAria: 'Hindsight memory graph. Use the node list below to read nodes with the keyboard.',
      nodeListLabel: 'Nodes as a list',
      footerNote: 'Read-only view: it reads the Hindsight graph endpoints. Nothing here modifies memory.',
    }

    const ZH = {
      panel: 'Hindsight 图谱',
      title: 'Hindsight 记忆图谱',
      desc: '每个节点是一条记忆单元，连线是 Hindsight 记录的语义、时间与实体关联。切换到实体视图可查看哪些实体被一起提及。此视图为只读。',
      refresh: '刷新',
      loading: '正在加载 Hindsight…',
      loadFailed: '无法加载 Hindsight 连接状态。',
      retry: '重试',
      unknown: '未知',
      yes: '是',
      no: '否',
      statusConnected: '已连接',
      statusOffline: '离线',
      statusChecking: '检查中…',
      setupTitle: '无法连接 Hindsight',
      setupDesc: 'Harness 无法访问 Hindsight 服务器，因此没有可绘制的记忆图谱。请启动守护进程或将查看器指向运行中的服务器，然后重试。',
      setupEndpoint: '实际使用的地址',
      setupMode: '服务模式',
      setupSource: '地址来源',
      setupToken: '已配置 API 令牌',
      setupConfigFile: '配置文件',
      setupHealth: '健康检查失败',
      setupHow: '如何连接',
      setupHowDaemon: 'daemon 模式下服务在本机运行，可用以下命令检查：curl http://127.0.0.1:9077/health',
      setupHowFile: '或在 ~/.hindsight/coding-agent.json 中设置 apiUrl 与 apiToken，然后重启 Harness。',
      bankLabel: '记忆库',
      modeLabel: '视图',
      modeMemories: '记忆单元',
      modeEntities: '实体',
      limitLabel: '节点数',
      filterLabel: '过滤',
      filterPlaceholder: '记忆文本包含的片段',
      apply: '应用',
      noBanksTitle: '暂无记忆库',
      noBanksDesc: 'Hindsight 可以访问，但该服务器上还没有任何记忆库。请在某个项目中开启一次会话以生成记忆。',
      banksError: '无法列出记忆库：',
      graphLoading: '正在构建图谱…',
      graphFailed: '无法加载图谱。',
      graphEmptyTitle: '没有可绘制的内容',
      graphEmptyDesc: '当前过滤条件下，该记忆库没有返回任何记忆单元。',
      statNodes: '{count} 个节点',
      statEdges: '{count} 条连线',
      statTotal: '记忆库共 {count} 条',
      statElapsed: '{ms} 毫秒',
      legendSemantic: '语义',
      legendTemporal: '时间',
      legendEntity: '实体',
      legendOther: '其他',
      detailEmptyTitle: '请选择节点',
      detailEmptyDesc: '点击图谱中的节点即可阅读其记忆内容。',
      detailClose: '关闭',
      detailMentions: '被提及 {count} 次',
      detailContext: '上下文',
      detailEntities: '实体',
      detailNeighbours: '关联节点（{count}）',
      detailCopy: '复制文本',
      detailCopied: '已复制',
      detailCopyFailed: '复制失败',
      zoomIn: '放大',
      zoomOut: '缩小',
      zoomReset: '重置视图',
      graphAria: 'Hindsight 记忆图谱。可使用下方的节点列表以键盘方式阅读节点。',
      nodeListLabel: '节点列表',
      footerNote: '只读视图：仅读取 Hindsight 图谱接口，不会修改记忆内容。',
    }

    // ---------------------------------------------------------------- helpers

    function translateFactory(raw) {
      const lookup = (key) => (EN[key] !== undefined ? EN[key] : key)
      return function t(key, params) {
        let text
        if (typeof raw === 'function') {
          try {
            text = raw(key, params)
          } catch {
            text = lookup(key)
          }
        } else {
          text = lookup(key)
        }
        if (typeof text !== 'string') text = lookup(key)
        if (params && typeof params === 'object') {
          text = text.replace(/\{(\w+)\}/g, (match, nm) =>
            params[nm] === undefined || params[nm] === null ? match : String(params[nm]),
          )
        }
        return text
      }
    }

    function apiUrl(path) {
      const full = API_BASE + path
      try {
        const base = new URL(document.baseURI)
        if (!base.pathname.endsWith('/')) base.pathname += '/'
        return new URL(full.replace(/^\//, ''), base.href).href
      } catch {
        return full
      }
    }

    async function apiGet(path) {
      const response = await fetch(apiUrl(path), {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      if (!response.ok) {
        throw new Error(
          payload && typeof payload.error === 'string' ? payload.error : 'HTTP ' + response.status,
        )
      }
      if (!payload || payload.ok !== true) {
        throw new Error(
          payload && typeof payload.error === 'string' ? payload.error : 'Unexpected response',
        )
      }
      return payload.data
    }

    function errorText(error) {
      if (error === null || error === undefined) return 'Unknown error'
      if (typeof error === 'string') return error
      if (typeof error.message === 'string' && error.message) return error.message
      return String(error)
    }

    function formatDateTime(value) {
      if (typeof value !== 'string') return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      try {
        return date.toLocaleString()
      } catch {
        return ''
      }
    }

    function copyText(text) {
      const value = typeof text === 'string' ? text : ''
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === 'function'
        ) {
          const result = navigator.clipboard.writeText(value)
          if (result && typeof result.then === 'function') return result.then(() => true, () => false)
          return Promise.resolve(true)
        }
      } catch {
        // Clipboard rejected; report failure rather than guessing.
      }
      return Promise.resolve(false)
    }

    // ------------------------------------------------------------------ layout

    // ponytail: fixed-iteration Fruchterman-Reingold on a uniform grid, run once
    // per payload. Ceiling ~2000 nodes (the Host route's own limit); above that,
    // upgrade to a Barnes-Hut quadtree or move layout into a worker.
    function layoutGraph(nodes, edges, width, height) {
      const n = nodes.length
      const points = nodes.map((node, index) => {
        // Deterministic spiral seed: the same payload always lays out the same way.
        const angle = index * 2.399963
        const radius = Math.sqrt(index + 1) / Math.sqrt(n + 1)
        return {
          node,
          x: width / 2 + Math.cos(angle) * radius * width * 0.42,
          y: height / 2 + Math.sin(angle) * radius * height * 0.42,
          vx: 0,
          vy: 0,
          degree: 0,
        }
      })
      if (n === 0) return points
      const index = new Map()
      for (let i = 0; i < points.length; i += 1) index.set(points[i].node.id, i)
      const links = []
      for (const edge of edges) {
        const a = index.get(edge.source)
        const b = index.get(edge.target)
        if (a === undefined || b === undefined || a === b) continue
        links.push([a, b, typeof edge.weight === 'number' ? Math.max(0.1, Math.min(1, edge.weight)) : 0.5])
        points[a].degree += 1
        points[b].degree += 1
      }

      const area = width * height
      const k = Math.sqrt(area / Math.max(1, n)) * 0.72
      const iterations = n > 800 ? 120 : n > 300 ? 200 : 320
      let temperature = Math.min(width, height) * 0.12

      for (let step = 0; step < iterations; step += 1) {
        for (const p of points) {
          p.vx = 0
          p.vy = 0
        }
        // Repulsion. O(n^2) — bounded by the 2000-node ceiling above.
        for (let i = 0; i < n; i += 1) {
          const a = points[i]
          for (let j = i + 1; j < n; j += 1) {
            const b = points[j]
            let dx = a.x - b.x
            let dy = a.y - b.y
            let distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < 0.01) {
              dx = (i % 7) - 3 + 0.5
              dy = (j % 7) - 3 + 0.5
              distance = Math.sqrt(dx * dx + dy * dy) || 1
            }
            const force = (k * k) / distance
            const fx = (dx / distance) * force
            const fy = (dy / distance) * force
            a.vx += fx
            a.vy += fy
            b.vx -= fx
            b.vy -= fy
          }
        }
        // Attraction along links.
        for (const [ai, bi, weight] of links) {
          const a = points[ai]
          const b = points[bi]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.01
          const force = ((distance * distance) / k) * weight
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          a.vx -= fx
          a.vy -= fy
          b.vx += fx
          b.vy += fy
        }
        // Weak gravity keeps disconnected components on screen.
        for (const p of points) {
          p.vx += (width / 2 - p.x) * 0.012
          p.vy += (height / 2 - p.y) * 0.012
        }
        for (const p of points) {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1
          const limit = Math.min(speed, temperature) / speed
          p.x += p.vx * limit
          p.y += p.vy * limit
          p.x = Math.max(20, Math.min(width - 20, p.x))
          p.y = Math.max(20, Math.min(height - 20, p.y))
        }
        temperature *= 0.975
      }
      return points
    }

    function nodeRadius(point, mode) {
      if (mode === 'entities') {
        const mentions = typeof point.node.mentions === 'number' ? point.node.mentions : 1
        return Math.min(18, 4.5 + Math.sqrt(Math.max(1, mentions)) * 1.9)
      }
      return Math.min(13, 4 + Math.sqrt(point.degree + 1) * 1.1)
    }

    const EDGE_COLORS = {
      semantic: 'rgba(236, 110, 173, 0.42)',
      temporal: 'rgba(0, 188, 212, 0.34)',
      entity: 'rgba(255, 183, 77, 0.40)',
    }

    function edgeColor(edge) {
      const type = edge && typeof edge.linkType === 'string' ? edge.linkType : ''
      return EDGE_COLORS[type] || 'rgba(140, 140, 160, 0.30)'
    }

    // ------------------------------------------------------------------- icons

    function GraphGlyph(props) {
      const size = (props && props.size) || 16
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinecap: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', { d: 'M8 3.3 3.6 6.4M8 3.3l4.4 3.1M3.6 6.4l4.4 6.3M12.4 6.4 8 12.7M3.6 6.4h8.8' }),
        h('circle', { cx: '8', cy: '3.3', r: '1.9', fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: '3.6', cy: '6.4', r: '1.5', fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: '12.4', cy: '6.4', r: '1.5', fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: '8', cy: '12.7', r: '1.9', fill: 'currentColor', stroke: 'none' }),
      )
    }

    function RefreshGlyph(props) {
      const size = (props && props.size) || 14
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', { d: 'M13.2 8a5.2 5.2 0 1 1-1.6-3.7' }),
        h('path', { d: 'M13.4 2.8v3.9H9.5' }),
      )
    }

    // ------------------------------------------------------------------ styles

    const CSS = `
.hsg-page { position:relative; display:flex; flex-direction:column; height:100%; min-height:0; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font:inherit; }
.hsg-scroll { flex:1 1 auto; min-height:0; overflow:auto; padding:26px 28px 44px; }
.hsg-inner { width:100%; max-width:1280px; margin:0 auto; }
.hsg-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; flex-wrap:wrap; }
.hsg-title { margin:0; font-size:20px; line-height:28px; font-weight:600; letter-spacing:-0.01em; }
.hsg-desc { margin:6px 0 0; font-size:13px; line-height:20px; color:var(--dsw-alias-label-secondary); max-width:720px; }
.hsg-head-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.hsg-btn { display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:4px 10px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:18px; cursor:pointer; white-space:nowrap; }
.hsg-btn:hover { background:var(--dsw-alias-bg-layer-2); border-color:var(--dsw-alias-border-l2); }
.hsg-btn:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.hsg-btn[disabled] { opacity:.5; cursor:default; }
.hsg-btn-primary { background:var(--dsw-alias-brand-primary); border-color:transparent; color:var(--dsw-alias-bg-base); }
.hsg-status { display:inline-flex; align-items:center; gap:6px; padding:3px 9px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; white-space:nowrap; }
.hsg-status-dot { flex:none; width:7px; height:7px; border-radius:50%; background:currentColor; }
.hsg-status-success { color:var(--dsw-alias-state-success-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 36%, var(--dsw-alias-border-l1)); }
.hsg-status-error { color:var(--dsw-alias-state-error-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 36%, var(--dsw-alias-border-l1)); }
.hsg-card { margin-top:16px; padding:16px 18px; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); }
.hsg-card-head { display:flex; align-items:center; gap:8px; }
.hsg-card-title { margin:0; font-size:14px; line-height:21px; font-weight:600; }
.hsg-card-desc { margin:6px 0 0; max-width:720px; color:var(--dsw-alias-label-secondary); font-size:12.5px; line-height:19px; }
.hsg-dot { flex:none; width:8px; height:8px; border-radius:50%; background:var(--dsw-alias-state-warn-primary); }
.hsg-kv { display:grid; grid-template-columns:minmax(130px,180px) minmax(0,1fr); gap:6px 14px; margin:14px 0 0; font-size:12.5px; line-height:19px; }
.hsg-k { color:var(--dsw-alias-label-secondary); }
.hsg-v { overflow-wrap:anywhere; }
.hsg-mono { font-family:${MONO}; font-size:11.5px; }
.hsg-how { margin:16px 0 0; font-size:12.5px; line-height:19px; font-weight:600; }
.hsg-how-p { margin:6px 0 0; color:var(--dsw-alias-label-secondary); font-size:12.5px; line-height:19px; overflow-wrap:anywhere; }
.hsg-error-box { margin:10px 0 0; padding:8px 10px; border-radius:8px; border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 34%, var(--dsw-alias-border-l1)); color:var(--dsw-alias-state-error-primary); font-size:12px; line-height:18px; overflow-wrap:anywhere; }
.hsg-toolbar { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; margin:16px 0 12px; }
.hsg-field { display:flex; flex-direction:column; gap:4px; min-width:0; }
.hsg-field-label { color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:16px; }
.hsg-select, .hsg-input { min-height:28px; padding:3px 8px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:18px; }
.hsg-select:focus-visible, .hsg-input:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.hsg-bank-select { max-width:360px; }
.hsg-filter { flex:1 1 220px; min-width:0; }
.hsg-filter-form { display:flex; align-items:flex-end; gap:6px; flex:1 1 260px; min-width:0; }
.hsg-stats { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; }
.hsg-chip { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); }
.hsg-legend-swatch { flex:none; width:16px; height:0; border-top:2px solid currentColor; }
.hsg-legend-semantic { color:#ec6ead; }
.hsg-legend-temporal { color:#00bcd4; }
.hsg-legend-entity { color:#ffb74d; }
.hsg-spacer { flex:1 1 auto; }
.hsg-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(280px, 340px); gap:14px; align-items:start; }
.hsg-canvas-wrap { position:relative; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); overflow:hidden; }
.hsg-canvas { display:block; width:100%; height:560px; touch-action:none; cursor:grab; }
.hsg-canvas-dragging { cursor:grabbing; }
.hsg-zoom { position:absolute; right:10px; bottom:10px; display:flex; flex-direction:column; gap:6px; }
.hsg-zoom .hsg-btn { min-width:30px; justify-content:center; }
.hsg-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent); }
.hsg-loading { display:flex; align-items:center; gap:8px; color:var(--dsw-alias-label-secondary); font-size:12.5px; }
.hsg-spinner { flex:none; width:14px; height:14px; border-radius:50%; border:2px solid var(--dsw-alias-border-l2); border-top-color:var(--dsw-alias-brand-primary); animation:hsg-spin .8s linear infinite; }
@keyframes hsg-spin { to { transform:rotate(360deg); } }
.hsg-empty { margin-top:12px; padding:28px 20px; text-align:center; border:1px dashed var(--dsw-alias-border-l2); border-radius:12px; background:var(--dsw-alias-bg-layer-1); }
.hsg-empty-title { margin:0; font-size:13.5px; line-height:21px; font-weight:600; }
.hsg-empty-desc { margin:6px auto 0; max-width:520px; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:19px; }
.hsg-empty .hsg-btn { margin-top:12px; }
.hsg-detail { padding:14px 16px 16px; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); max-height:620px; overflow:auto; }
.hsg-detail-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.hsg-detail-title { margin:0; font-size:13.5px; line-height:20px; font-weight:600; overflow-wrap:anywhere; }
.hsg-detail-meta { display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin:8px 0 0; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; }
.hsg-detail-text { margin:12px 0 0; padding:10px 12px; border:1px solid var(--dsw-alias-border-l1); border-radius:9px; background:var(--dsw-alias-bg-base); font-size:12.5px; line-height:19px; white-space:pre-wrap; overflow-wrap:anywhere; }
.hsg-detail-sub { margin:12px 0 4px; font-size:11.5px; line-height:17px; font-weight:600; color:var(--dsw-alias-label-secondary); text-transform:uppercase; letter-spacing:.04em; }
.hsg-tags { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.hsg-tag { display:inline-flex; padding:1px 7px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-secondary); font-size:11px; line-height:16px; }
.hsg-neighbours { display:flex; flex-direction:column; gap:2px; }
.hsg-neighbour { display:flex; align-items:center; gap:6px; width:100%; padding:5px 7px; border:0; border-radius:7px; background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:18px; text-align:left; cursor:pointer; }
.hsg-neighbour:hover { background:var(--dsw-alias-bg-layer-2); }
.hsg-neighbour:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }
.hsg-neighbour-label { flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.hsg-nodelist { margin-top:14px; }
.hsg-nodelist summary { cursor:pointer; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; }
.hsg-nodelist-items { display:flex; flex-direction:column; gap:2px; margin-top:8px; max-height:280px; overflow:auto; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; padding:6px; }
.hsg-footer { margin-top:18px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; }
@media (max-width: 980px) {
  .hsg-layout { grid-template-columns:minmax(0,1fr); }
  .hsg-detail { max-height:none; }
}
@media (max-width: 720px) {
  .hsg-scroll { padding:18px 14px 36px; }
  .hsg-canvas { height:420px; }
  .hsg-kv { grid-template-columns:1fr; gap:2px; }
  .hsg-kv .hsg-k { margin-top:6px; }
}
`

    // -------------------------------------------------------------- small parts

    function loadingNode(text) {
      return h(
        'div',
        { className: 'hsg-loading', role: 'status' },
        h('span', { className: 'hsg-spinner', 'aria-hidden': 'true' }),
        text,
      )
    }

    function statusChipNode(t, status, loading) {
      if (!status) {
        return h(
          'span',
          { className: 'hsg-status' + (loading ? '' : ' hsg-status-error') },
          h('span', { className: 'hsg-status-dot', 'aria-hidden': 'true' }),
          loading ? t('statusChecking') : t('statusOffline'),
        )
      }
      const ok = status.reachable === true
      return h(
        'span',
        { className: 'hsg-status ' + (ok ? 'hsg-status-success' : 'hsg-status-error') },
        h('span', { className: 'hsg-status-dot', 'aria-hidden': 'true' }),
        ok ? t('statusConnected') : t('statusOffline'),
      )
    }

    function SetupCard(props) {
      const { t, status, onRetry } = props
      const connection = status && status.connection && typeof status.connection === 'object' ? status.connection : {}
      const health = status && status.health && typeof status.health === 'object' ? status.health : null
      const rows = [
        { key: 'endpoint', label: t('setupEndpoint'), value: connection.baseUrl || t('unknown'), mono: true },
        { key: 'mode', label: t('setupMode'), value: connection.serverMode || t('unknown'), mono: false },
        { key: 'source', label: t('setupSource'), value: connection.source || t('unknown'), mono: false },
        { key: 'token', label: t('setupToken'), value: connection.hasToken === true ? t('yes') : t('no'), mono: false },
      ]
      if (typeof connection.configFile === 'string' && connection.configFile) {
        rows.push({ key: 'file', label: t('setupConfigFile'), value: connection.configFile, mono: true })
      }
      const kv = []
      for (const row of rows) {
        kv.push(h('dt', { key: row.key + '-k', className: 'hsg-k' }, row.label))
        kv.push(h('dd', { key: row.key + '-v', className: 'hsg-v' + (row.mono ? ' hsg-mono' : '') }, row.value))
      }
      return h(
        'section',
        { className: 'hsg-card', 'aria-label': t('setupTitle') },
        h(
          'div',
          { className: 'hsg-card-head' },
          h('span', { className: 'hsg-dot', 'aria-hidden': 'true' }),
          h('h3', { className: 'hsg-card-title' }, t('setupTitle')),
        ),
        h('p', { className: 'hsg-card-desc' }, t('setupDesc')),
        h('dl', { className: 'hsg-kv' }, kv),
        health && health.error
          ? h('p', { className: 'hsg-error-box', role: 'alert' }, t('setupHealth') + ': ' + health.error)
          : null,
        h('h4', { className: 'hsg-how' }, t('setupHow')),
        h('p', { className: 'hsg-how-p' }, t('setupHowDaemon')),
        h('p', { className: 'hsg-how-p' }, t('setupHowFile')),
        h(
          'div',
          { style: { marginTop: '14px' } },
          h('button', { type: 'button', className: 'hsg-btn hsg-btn-primary', onClick: onRetry }, t('retry')),
        ),
      )
    }

    // ------------------------------------------------------------- graph canvas

    function GraphCanvas(props) {
      const { t, graph, mode, selectedId, onSelect } = props
      const canvasRef = useRef(null)
      const layoutRef = useRef({ key: '', points: [], index: new Map() })
      const viewRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 })
      const dragRef = useRef(null)
      const hoverRef = useRef(null)
      const [dragging, setDragging] = useState(false)
      const [, setTick] = useState(0)
      const redraw = useCallback(() => setTick((value) => value + 1), [])

      const nodes = graph && Array.isArray(graph.nodes) ? graph.nodes : []
      const edges = graph && Array.isArray(graph.edges) ? graph.edges : []
      const layoutKey = [graph && graph.bank, mode, nodes.length, edges.length, graph && graph.q].join('|')

      // Layout once per payload; a resize only rescales the existing geometry.
      if (layoutRef.current.key !== layoutKey) {
        const points = layoutGraph(nodes, edges, 1000, 700)
        const index = new Map()
        for (const point of points) index.set(point.node.id, point)
        layoutRef.current = { key: layoutKey, points, index }
        viewRef.current = { scale: 1, offsetX: 0, offsetY: 0 }
      }

      const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const ratio = window.devicePixelRatio || 1
        const width = Math.max(1, Math.round(rect.width))
        const height = Math.max(1, Math.round(rect.height))
        if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
          canvas.width = width * ratio
          canvas.height = height * ratio
        }
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        ctx.clearRect(0, 0, width, height)

        const points = layoutRef.current.points
        const index = layoutRef.current.index
        if (points.length === 0) return

        const base = Math.min(width / 1000, height / 700)
        const view = viewRef.current
        const scale = base * view.scale
        const toScreen = (point) => ({
          x: (point.x - 500) * scale + width / 2 + view.offsetX,
          y: (point.y - 350) * scale + height / 2 + view.offsetY,
        })

        const highlighted = new Set()
        if (selectedId) {
          highlighted.add(selectedId)
          for (const edge of edges) {
            if (edge.source === selectedId) highlighted.add(edge.target)
            else if (edge.target === selectedId) highlighted.add(edge.source)
          }
        }

        ctx.lineWidth = Math.max(0.6, scale * 0.9)
        for (const edge of edges) {
          const a = index.get(edge.source)
          const b = index.get(edge.target)
          if (!a || !b) continue
          const dim = selectedId && !(highlighted.has(edge.source) && highlighted.has(edge.target))
          const pa = toScreen(a)
          const pb = toScreen(b)
          ctx.strokeStyle = dim ? 'rgba(130,130,145,0.10)' : edgeColor(edge)
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.stroke()
        }

        const hoverId = hoverRef.current
        const labelFloor = points.length > 420 ? 9 : 0
        for (const point of points) {
          const screen = toScreen(point)
          const radius = Math.max(2.2, nodeRadius(point, mode) * scale)
          const isSelected = point.node.id === selectedId
          const isHover = point.node.id === hoverId
          const dim = selectedId && !highlighted.has(point.node.id)
          ctx.beginPath()
          ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
          ctx.fillStyle = dim
            ? 'rgba(130,130,145,0.26)'
            : point.node.color || 'var(--dsw-alias-brand-primary)'
          if (!dim && !point.node.color) ctx.fillStyle = '#42a5f5'
          ctx.fill()
          if (isSelected || isHover) {
            ctx.lineWidth = 2
            ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.65)'
            ctx.stroke()
            ctx.lineWidth = Math.max(0.6, scale * 0.9)
          }
          const showLabel = isSelected || isHover || radius >= labelFloor
          if (showLabel && point.node.label) {
            ctx.font = '11px system-ui, sans-serif'
            ctx.fillStyle = dim ? 'rgba(150,150,160,0.5)' : 'rgba(228,228,236,0.92)'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            const label = point.node.label.length > 34 ? point.node.label.slice(0, 33) + '…' : point.node.label
            ctx.fillText(label, screen.x, screen.y + radius + 3)
          }
        }
      }, [edges, mode, selectedId])

      useEffect(() => {
        draw()
      })

      useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || typeof ResizeObserver !== 'function') {
          window.addEventListener('resize', redraw)
          return () => window.removeEventListener('resize', redraw)
        }
        const observer = new ResizeObserver(redraw)
        observer.observe(canvas)
        return () => observer.disconnect()
      }, [redraw])

      const pickAt = (clientX, clientY) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        const base = Math.min(width / 1000, height / 700)
        const view = viewRef.current
        const scale = base * view.scale
        const x = clientX - rect.left
        const y = clientY - rect.top
        let best = null
        let bestDistance = Infinity
        for (const point of layoutRef.current.points) {
          const sx = (point.x - 500) * scale + width / 2 + view.offsetX
          const sy = (point.y - 350) * scale + height / 2 + view.offsetY
          const radius = Math.max(5, nodeRadius(point, mode) * scale)
          const distance = Math.sqrt((sx - x) * (sx - x) + (sy - y) * (sy - y))
          if (distance <= radius + 3 && distance < bestDistance) {
            best = point.node
            bestDistance = distance
          }
        }
        return best
      }

      const onPointerDown = (event) => {
        const canvas = canvasRef.current
        if (!canvas) return
        dragRef.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
        }
        if (typeof canvas.setPointerCapture === 'function') {
          try {
            canvas.setPointerCapture(event.pointerId)
          } catch {
            // Capture is a convenience; dragging still works without it.
          }
        }
        setDragging(true)
      }

      const onPointerMove = (event) => {
        const drag = dragRef.current
        if (drag && drag.id === event.pointerId) {
          const dx = event.clientX - drag.x
          const dy = event.clientY - drag.y
          drag.x = event.clientX
          drag.y = event.clientY
          if (Math.abs(event.clientX - drag.startX) > 3 || Math.abs(event.clientY - drag.startY) > 3) {
            drag.moved = true
          }
          viewRef.current.offsetX += dx
          viewRef.current.offsetY += dy
          draw()
          return
        }
        const hit = pickAt(event.clientX, event.clientY)
        const nextId = hit ? hit.id : null
        if (nextId !== hoverRef.current) {
          hoverRef.current = nextId
          draw()
        }
      }

      const onPointerUp = (event) => {
        const drag = dragRef.current
        dragRef.current = null
        setDragging(false)
        if (drag && !drag.moved) {
          const hit = pickAt(event.clientX, event.clientY)
          onSelect(hit ? hit.id : null)
        }
      }

      const onWheel = (event) => {
        event.preventDefault()
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
        viewRef.current.scale = Math.max(0.25, Math.min(8, viewRef.current.scale * factor))
        draw()
      }

      const zoom = (factor) => {
        viewRef.current.scale = Math.max(0.25, Math.min(8, viewRef.current.scale * factor))
        draw()
      }

      const reset = () => {
        viewRef.current = { scale: 1, offsetX: 0, offsetY: 0 }
        draw()
      }

      return h(
        'div',
        { className: 'hsg-canvas-wrap' },
        h('canvas', {
          ref: canvasRef,
          className: 'hsg-canvas' + (dragging ? ' hsg-canvas-dragging' : ''),
          role: 'img',
          'aria-label': t('graphAria'),
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: () => {
            dragRef.current = null
            setDragging(false)
          },
          onPointerLeave: () => {
            if (hoverRef.current !== null) {
              hoverRef.current = null
              draw()
            }
          },
          onWheel,
        }),
        h(
          'div',
          { className: 'hsg-zoom' },
          h('button', { type: 'button', className: 'hsg-btn', title: t('zoomIn'), 'aria-label': t('zoomIn'), onClick: () => zoom(1.25) }, '+'),
          h('button', { type: 'button', className: 'hsg-btn', title: t('zoomOut'), 'aria-label': t('zoomOut'), onClick: () => zoom(1 / 1.25) }, '−'),
          h('button', { type: 'button', className: 'hsg-btn', title: t('zoomReset'), 'aria-label': t('zoomReset'), onClick: reset }, '⌖'),
        ),
      )
    }

    // --------------------------------------------------------------- detail pane

    function DetailPane(props) {
      const { t, graph, selectedId, mode, onSelect } = props
      const [copied, setCopied] = useState('')
      const nodes = graph && Array.isArray(graph.nodes) ? graph.nodes : []
      const edges = graph && Array.isArray(graph.edges) ? graph.edges : []
      const node = selectedId ? nodes.find((entry) => entry.id === selectedId) : null

      useEffect(() => {
        setCopied('')
      }, [selectedId])

      if (!node) {
        return h(
          'aside',
          { className: 'hsg-detail' },
          h('h3', { className: 'hsg-detail-title' }, t('detailEmptyTitle')),
          h('p', { className: 'hsg-card-desc' }, t('detailEmptyDesc')),
        )
      }

      const neighbours = []
      const seen = new Set()
      for (const edge of edges) {
        let otherId = null
        if (edge.source === node.id) otherId = edge.target
        else if (edge.target === node.id) otherId = edge.source
        if (!otherId || seen.has(otherId)) continue
        seen.add(otherId)
        const other = nodes.find((entry) => entry.id === otherId)
        if (other) neighbours.push({ node: other, linkType: edge.linkType })
      }

      const entityTags = typeof node.entities === 'string' && node.entities
        ? node.entities.split(',').map((part) => part.trim()).filter(Boolean).slice(0, 24)
        : []

      const copy = () => {
        void copyText(node.text || node.label || '').then((ok) => setCopied(ok ? 'ok' : 'fail'))
      }

      return h(
        'aside',
        { className: 'hsg-detail' },
        h(
          'div',
          { className: 'hsg-detail-head' },
          h('h3', { className: 'hsg-detail-title' }, node.label || node.id),
          h('button', { type: 'button', className: 'hsg-btn', onClick: () => onSelect(null) }, t('detailClose')),
        ),
        h(
          'div',
          { className: 'hsg-detail-meta' },
          mode === 'entities' && typeof node.mentions === 'number'
            ? h('span', { className: 'hsg-chip' }, t('detailMentions', { count: node.mentions }))
            : null,
          node.date ? h('span', { className: 'hsg-chip' }, formatDateTime(node.date) || node.date) : null,
          h('span', { className: 'hsg-chip hsg-mono', title: node.id }, node.id.slice(0, 8)),
        ),
        node.text ? h('div', { className: 'hsg-detail-text' }, node.text) : null,
        node.text
          ? h(
              'div',
              { style: { marginTop: '8px' } },
              h(
                'button',
                { type: 'button', className: 'hsg-btn', onClick: copy },
                copied === 'ok' ? t('detailCopied') : copied === 'fail' ? t('detailCopyFailed') : t('detailCopy'),
              ),
            )
          : null,
        node.context
          ? h(
              React.Fragment,
              null,
              h('p', { className: 'hsg-detail-sub' }, t('detailContext')),
              h('p', { className: 'hsg-card-desc', style: { margin: 0 } }, node.context),
            )
          : null,
        entityTags.length > 0
          ? h(
              React.Fragment,
              null,
              h('p', { className: 'hsg-detail-sub' }, t('detailEntities')),
              h(
                'div',
                { className: 'hsg-tags' },
                entityTags.map((tag, i) => h('span', { key: tag + i, className: 'hsg-tag' }, tag)),
              ),
            )
          : null,
        neighbours.length > 0
          ? h(
              React.Fragment,
              null,
              h('p', { className: 'hsg-detail-sub' }, t('detailNeighbours', { count: neighbours.length })),
              h(
                'div',
                { className: 'hsg-neighbours' },
                neighbours.slice(0, 40).map((item) =>
                  h(
                    'button',
                    {
                      key: item.node.id,
                      type: 'button',
                      className: 'hsg-neighbour',
                      onClick: () => onSelect(item.node.id),
                    },
                    h('span', { className: 'hsg-neighbour-label', title: item.node.label }, item.node.label),
                    item.linkType ? h('span', { className: 'hsg-tag' }, item.linkType) : null,
                  ),
                ),
              ),
            )
          : null,
      )
    }

    // ---------------------------------------------------------------- the panel

    function HindsightGraphPanel(props) {
      const t = typeof props.t === 'function' ? props.t : translateFactory(null)
      const [statusData, setStatusData] = useState(null)
      const [statusLoading, setStatusLoading] = useState(true)
      const [statusError, setStatusError] = useState(null)
      const [nonce, setNonce] = useState(0)
      const [bank, setBank] = useState('')
      const [mode, setMode] = useState('memories')
      const [limit, setLimit] = useState(300)
      const [filterInput, setFilterInput] = useState('')
      const [filter, setFilter] = useState('')
      const [graphState, setGraphState] = useState({ loading: false, error: null, data: null })
      const [selectedId, setSelectedId] = useState(null)

      useEffect(() => {
        let alive = true
        setStatusLoading(true)
        const load = async () => {
          try {
            const data = await apiGet('/banks')
            if (!alive) return
            setStatusData(data)
            setStatusError(null)
            const banks = data && Array.isArray(data.banks) ? data.banks : []
            setBank((previous) => {
              if (previous && banks.some((entry) => entry.id === previous)) return previous
              return banks.length > 0 ? banks[0].id : ''
            })
          } catch (caught) {
            if (!alive) return
            setStatusError(errorText(caught))
          } finally {
            if (alive) setStatusLoading(false)
          }
        }
        void load()
        return () => {
          alive = false
        }
      }, [nonce])

      useEffect(() => {
        if (!bank) {
          setGraphState({ loading: false, error: null, data: null })
          return undefined
        }
        let alive = true
        setGraphState({ loading: true, error: null, data: null })
        setSelectedId(null)
        const load = async () => {
          try {
            const query =
              '/graph?bank=' + encodeURIComponent(bank)
              + '&mode=' + encodeURIComponent(mode)
              + '&limit=' + String(limit)
              + (filter && mode === 'memories' ? '&q=' + encodeURIComponent(filter) : '')
            const data = await apiGet(query)
            if (!alive) return
            setGraphState({ loading: false, error: null, data })
          } catch (caught) {
            if (!alive) return
            setGraphState({ loading: false, error: errorText(caught), data: null })
          }
        }
        void load()
        return () => {
          alive = false
        }
      }, [bank, mode, limit, filter, nonce])

      const refresh = () => setNonce((value) => value + 1)
      const status = statusData
      const reachable = Boolean(status && status.reachable === true)
      const banks = status && Array.isArray(status.banks) ? status.banks : []
      const graph = graphState.data

      const head = h(
        'div',
        { className: 'hsg-head' },
        h('div', null, h('h2', { className: 'hsg-title' }, t('title')), h('p', { className: 'hsg-desc' }, t('desc'))),
        h(
          'div',
          { className: 'hsg-head-actions' },
          statusChipNode(t, status, statusLoading),
          h(
            'button',
            { type: 'button', className: 'hsg-btn', onClick: refresh, disabled: statusLoading },
            h(RefreshGlyph, { size: 14 }),
            t('refresh'),
          ),
        ),
      )

      let body
      if (!status) {
        body = statusLoading
          ? loadingNode(t('loading'))
          : h(
              'div',
              { className: 'hsg-empty', role: 'alert' },
              h('p', { className: 'hsg-empty-title' }, t('loadFailed')),
              h('p', { className: 'hsg-empty-desc' }, statusError || t('unknown')),
              h('button', { type: 'button', className: 'hsg-btn', onClick: refresh }, t('retry')),
            )
      } else if (!reachable) {
        body = h(SetupCard, { t, status, onRetry: refresh })
      } else if (banks.length === 0) {
        body = h(
          'div',
          { className: 'hsg-empty' },
          h('p', { className: 'hsg-empty-title' }, t('noBanksTitle')),
          h(
            'p',
            { className: 'hsg-empty-desc' },
            status.banksError ? t('banksError') + ' ' + status.banksError : t('noBanksDesc'),
          ),
          h('button', { type: 'button', className: 'hsg-btn', onClick: refresh }, t('retry')),
        )
      } else {
        const toolbar = h(
          'div',
          { className: 'hsg-toolbar' },
          h(
            'label',
            { className: 'hsg-field' },
            h('span', { className: 'hsg-field-label' }, t('bankLabel')),
            h(
              'select',
              {
                className: 'hsg-select hsg-bank-select',
                value: bank,
                onChange: (event) => setBank(event.target.value),
              },
              banks.map((entry) => h('option', { key: entry.id, value: entry.id }, entry.name || entry.id)),
            ),
          ),
          h(
            'label',
            { className: 'hsg-field' },
            h('span', { className: 'hsg-field-label' }, t('modeLabel')),
            h(
              'select',
              { className: 'hsg-select', value: mode, onChange: (event) => setMode(event.target.value) },
              MODES.map((entry) => h('option', { key: entry.value, value: entry.value }, t(entry.labelKey))),
            ),
          ),
          h(
            'label',
            { className: 'hsg-field' },
            h('span', { className: 'hsg-field-label' }, t('limitLabel')),
            h(
              'select',
              {
                className: 'hsg-select',
                value: String(limit),
                onChange: (event) => setLimit(Number(event.target.value) || 300),
              },
              LIMITS.map((value) => h('option', { key: value, value: String(value) }, String(value))),
            ),
          ),
          mode === 'memories'
            ? h(
                'form',
                {
                  className: 'hsg-filter-form',
                  onSubmit: (event) => {
                    event.preventDefault()
                    setFilter(filterInput.trim())
                  },
                },
                h(
                  'label',
                  { className: 'hsg-field hsg-filter' },
                  h('span', { className: 'hsg-field-label' }, t('filterLabel')),
                  h('input', {
                    className: 'hsg-input',
                    type: 'text',
                    value: filterInput,
                    placeholder: t('filterPlaceholder'),
                    autoComplete: 'off',
                    spellCheck: false,
                    onChange: (event) => setFilterInput(event.target.value),
                  }),
                ),
                h('button', { type: 'submit', className: 'hsg-btn' }, t('apply')),
              )
            : null,
        )

        const stats = graph
          ? h(
              'div',
              { className: 'hsg-stats' },
              h('span', { className: 'hsg-chip' }, t('statNodes', { count: graph.nodes.length })),
              h('span', { className: 'hsg-chip' }, t('statEdges', { count: graph.edges.length })),
              typeof graph.totalUnits === 'number'
                ? h('span', { className: 'hsg-chip' }, t('statTotal', { count: graph.totalUnits }))
                : null,
              typeof graph.latencyMs === 'number'
                ? h('span', { className: 'hsg-chip' }, t('statElapsed', { ms: graph.latencyMs }))
                : null,
              h('span', { className: 'hsg-spacer' }),
              mode === 'memories'
                ? h(
                    React.Fragment,
                    null,
                    h(
                      'span',
                      { className: 'hsg-chip hsg-legend-semantic' },
                      h('span', { className: 'hsg-legend-swatch', 'aria-hidden': 'true' }),
                      t('legendSemantic'),
                    ),
                    h(
                      'span',
                      { className: 'hsg-chip hsg-legend-temporal' },
                      h('span', { className: 'hsg-legend-swatch', 'aria-hidden': 'true' }),
                      t('legendTemporal'),
                    ),
                    h(
                      'span',
                      { className: 'hsg-chip hsg-legend-entity' },
                      h('span', { className: 'hsg-legend-swatch', 'aria-hidden': 'true' }),
                      t('legendEntity'),
                    ),
                  )
                : null,
            )
          : null

        let main
        if (graphState.error) {
          main = h(
            'div',
            null,
            h('p', { className: 'hsg-error-box', role: 'alert' }, t('graphFailed') + ' ' + graphState.error),
            h(
              'div',
              { style: { marginTop: '10px' } },
              h('button', { type: 'button', className: 'hsg-btn', onClick: refresh }, t('retry')),
            ),
          )
        } else if (graphState.loading) {
          main = loadingNode(t('graphLoading'))
        } else if (!graph || graph.nodes.length === 0) {
          main = h(
            'div',
            { className: 'hsg-empty' },
            h('p', { className: 'hsg-empty-title' }, t('graphEmptyTitle')),
            h('p', { className: 'hsg-empty-desc' }, t('graphEmptyDesc')),
          )
        } else {
          main = h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'hsg-layout' },
              h(GraphCanvas, { t, graph, mode, selectedId, onSelect: setSelectedId }),
              h(DetailPane, { t, graph, mode, selectedId, onSelect: setSelectedId }),
            ),
            // Keyboard and screen-reader path to the same nodes the canvas draws.
            h(
              'details',
              { className: 'hsg-nodelist' },
              h('summary', null, t('nodeListLabel')),
              h(
                'div',
                { className: 'hsg-nodelist-items' },
                graph.nodes.map((node) =>
                  h(
                    'button',
                    {
                      key: node.id,
                      type: 'button',
                      className: 'hsg-neighbour',
                      onClick: () => setSelectedId(node.id),
                    },
                    h('span', { className: 'hsg-neighbour-label', title: node.label }, node.label),
                  ),
                ),
              ),
            ),
          )
        }

        body = h('div', null, toolbar, stats, main)
      }

      return h(
        'div',
        { className: 'hsg-page' },
        h('style', { key: 'style' }, CSS),
        h(
          'div',
          { className: 'hsg-scroll', key: 'scroll' },
          h(
            'div',
            { className: 'hsg-inner' },
            head,
            statusError && status
              ? h('p', { className: 'hsg-error-box', role: 'alert' }, statusError)
              : null,
            body,
            h('p', { className: 'hsg-footer' }, t('footerNote')),
          ),
        ),
      )
    }

    // ---------------------------------------------------------------- activate

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const offEnglish = ctx.locale.register(NS, 'en', EN)
          const offChinese = ctx.locale.register(NS, 'zh', ZH)
          return () => {
            try {
              offEnglish()
            } catch {
              // Already disposed with the locale service.
            }
            try {
              offChinese()
            } catch {
              // Already disposed with the locale service.
            }
          }
        }, 'hindsight-graph: locale dictionaries')

        const bound = typeof ctx.locale.bind === 'function' ? ctx.locale.bind(NS) : null

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: PANEL_ID,
              locale: NS,
              inject: () => ({ t: bound || translateFactory(null) }),
            },
            HindsightGraphPanel,
          ),
        )

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 31,
              locale: NS,
              label: () => (bound ? bound('panel') : EN.panel),
            },
            GraphGlyph,
          ),
        )
      },
    }
  },
})
