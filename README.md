# Homeroom-Hermes

A local-first workspace for personal AI agents. Homeroom is the human-facing layer that sits on top of [hermes-agent](https://github.com/NousResearch/hermes-agent) by NousResearch. Each agent you configure in Homeroom runs as a real hermes-agent process on your machine.

Homeroom is not trying to make agents magical. It is trying to make them legible.

---

## What it is

Homeroom is not an AI framework. It is a management interface. The actual execution happens in hermes-agent. Homeroom handles:

- Creating and configuring agents (name, role, purpose, instructions, model)
- Giving agents human-readable permissions and approval gates
- Triggering runs and collecting output
- Persisting run history, audit trails, trust findings, and settings in a durable event log
- A local Obsidian-compatible vault that mirrors agent configuration as markdown
- Scheduling background runs via node-cron

The backend is the single source of truth. Every visible thing the UI shows is reproducible from the backend's persisted state plus its ordered event log.

---

## How it works

```
Browser UI (React + Vite)
      |
      |  HTTP + SSE (localhost:5174)
      v
Homeroom Service (Fastify + SQLite + Drizzle)
      |
      |  spawns subprocess with policy-enforced env
      v
hermes-agent CLI
      |
      |  API key (env var; dead proxy if network=off)
      v
AI provider (Anthropic, OpenAI, OpenRouter, etc.)
```

When you click Run in the UI, the service calls:

```sh
hermes chat -q "<your input>" --quiet
```

With `-m <model>` appended if the agent has a specific model selected. API keys are injected as environment variables. They are stored AES-256-GCM encrypted at `~/.homeroom/credentials.json.enc` and never touch the browser. If the agent's network access is set to `off`, hermes is spawned with `HTTP_PROXY`/`HTTPS_PROXY` pointing at a dead port so every outbound connection fails at the socket layer.

---

## Architecture at a glance

- **One source of truth.** The SQLite database. Every entity (agents, runs, run steps, approvals, audit events) lives here.
- **Every event has a sequence number.** The backend appends every state-changing event to a durable `stream_events` log with a monotonic sequence. The UI can detect gaps and request replay.
- **Two endpoints for state recovery.**
  - `GET /api/snapshot` returns the full canonical state plus the current cursor — used on initial load.
  - `GET /api/events?since=N` returns events strictly after cursor `N` — used for gap replay.
- **SSE with cursor.** `GET /api/events/stream?since=N` catches up missed events, then streams live events with their sequence numbers.
- **Scene state is authoritative.** Every run lifecycle edge writes `sceneState` and `sceneRoomId` on the agent row and emits an `agent.transition` event. Only `run-service` writes these fields.
- **Permissions are enforced, not just stored.** `networkAccessMode: 'off'` actually blocks network access at the subprocess level. `requiresApprovalFor` actually holds runs in `awaiting_approval` until the user resolves an approval record.

---

## Requirements

- Node.js 18 or later
- pnpm (used for monorepo workspace management)
- [hermes-agent](https://github.com/NousResearch/hermes-agent) installed and on your PATH
- At least one configured AI provider API key

Install hermes-agent using the official installer:

```sh
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

Then reload your shell and verify:

```sh
source ~/.zshrc   # or: source ~/.bashrc
hermes --version
```

See the [hermes-agent repo](https://github.com/NousResearch/hermes-agent) for platform-specific notes (WSL2, Termux, etc.).

---

## Getting started (daily use)

```sh
# Clone
git clone https://github.com/cdf2170/Homeroom-Hermes.git
cd Homeroom-Hermes

# Install dependencies
pnpm install

# One-time: builds the UI and registers the background daemon
pnpm daemon:install

# Optional: create a Homeroom.app icon you can drag to your dock
pnpm app:install
```

From then on:

- **One process**, running in the background, automatically on login
- **One URL**: http://localhost:5174 serves both the UI and the API
- **No terminal needed**. Click the Homeroom app in your dock, or bookmark the URL
- **Always on**. Close the browser tab; scheduled agents keep running

When you update the code:

```sh
pnpm daemon:rebuild   # rebuilds the UI and restarts the daemon
```

### Daemon commands

```sh
pnpm daemon:status      # Check if the service is running
pnpm daemon:logs        # View recent logs
pnpm daemon:open        # Open the UI in your default browser
pnpm daemon:uninstall   # Stop and remove the service
```

### Development mode

If you want hot reload while hacking on the UI:

```sh
pnpm daemon:install   # backend runs as daemon
pnpm dev              # vite dev server on :8080 with HMR, talks to the daemon
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5174` | Backend service port |
| `HOST` | `127.0.0.1` | Backend bind address. Change only if you understand the security implications. |
| `DB_PATH` | `homeroom.db` | SQLite database path |
| `ADAPTER` | `hermes` | Runtime adapter: `hermes`, `ollama`, `cloud` |
| `HERMES_CLI_PATH` | `hermes` | Path to hermes binary |
| `HERMES_TIMEOUT_SECONDS` | `120` | Max seconds per agent turn |
| `VAULT_PATH` | `~/.homeroom/vault` | Local Obsidian-compatible vault path |
| `STATIC_ROOT` | `<repo>/dist` | Built frontend directory. The backend serves the UI from here. |
| `ALLOW_REMOTE_ORIGINS` | `false` | Allow non-localhost CORS origins. **Requires `NODE_ENV=development` to take effect.** See security section. |
| `NODE_ENV` | (unset) | Set to `development` to enable remote origin CORS when `ALLOW_REMOTE_ORIGINS=true` |
| `LOG_LEVEL` | `info` | Fastify log level |

---

## Local docs vault

Every agent gets a folder at `$VAULT_PATH/Agents/<name>/`:

- `AGENT.md` — identity, role, runtime settings
- `PROFILE.md` — instructions, behavior, notes
- `MEMORY.md` — memory items
- `RULES.md` — rules
- `SCHEDULE.md` — schedule configuration
- `TOOLS.md` — tool scopes and permissions
- `RUNS.md` — last 20 runs summary

Files are rewritten automatically when agent configuration changes. You can open `$VAULT_PATH` in Obsidian. The vault is a generated export, not a two-way sync. The sync status performs real on-disk comparison:

- **In sync** — backend state, last-written hash, and on-disk content all match
- **Backend changed** — backend state has changed since the last write; rebuild to update
- **Files edited** — on-disk files were modified outside Homeroom; rebuilding will overwrite
- **Not written** — vault files haven't been generated yet
- **Diverged** — both backend state and disk files changed independently

---

## What works today

### Agent lifecycle
- Create, edit, delete agents; all persisted in SQLite
- Character fields: name, role, purpose, personality, archetype, vibe
- Visual appearance (avatar color, hair, outfit) persisted per agent
- Enable / disable toggle gates autonomous execution

### Runs
- Manual runs trigger real hermes-agent subprocesses
- Per-agent model selection (`-m <model>` threaded through to hermes)
- Run records capture input, output, status, duration, trigger, and settle reason
- Explicit `timeout` status (not swallowed as a generic failure)
- Every run lifecycle edge emits sequence-numbered events on the stream
- Run steps table records each structured step (currently one `message` or `error` step per run; see "not yet" below)

### Scheduling
- Cron-based scheduler via node-cron
- Presets: manual, hourly, every 4 hours, twice daily, daily, weekdays, custom
- Boot-time registration; clean shutdown on SIGTERM/SIGINT
- Disabled agents auto-unregister their jobs

### Approvals (backend complete; UI pending)
- Per-agent `requiresApprovalFor` holds scheduled/background runs in `awaiting_approval`
- Approval records track runId, kind, reason, preview, resolution
- `POST /api/approvals/:id/resolve` (`approve` / `deny`) either dispatches the queued run or cancels it
- `approval.requested` and `approval.resolved` events on the stream

### Security (actually enforced)
- API keys encrypted at rest with AES-256-GCM; never in browser storage
- Backend bound to 127.0.0.1 by default
- CORS locked to localhost unless explicitly opened with dev-only flag
- `networkAccessMode: 'off'` spawns hermes with a dead HTTP proxy — the subprocess cannot reach the network

### Observability
- Durable event log with monotonic sequences
- SSE stream with gap detection support
- Targeted replay endpoint for catch-up
- Full snapshot endpoint for bootstrap
- Audit log of every create/update/delete/run/approval
- Trust findings computed from agent configuration

### Operations
- macOS launchd daemon installer (`pnpm daemon:install`)
- Auto-start on login, auto-restart on crash
- Single origin serving: backend hosts both UI and API at localhost:5174
- One-click `.app` shortcut for the dock

---

## What is not yet implemented

Being explicit about the gaps so you know what's real and what's still in flight.

### UI rebuild in progress
The current frontend is functional but does not yet reflect the canonical render rule from the v2 architecture plan. Specifically:
- Visuals aren't yet bound to the sequence-numbered event stream (still uses polling in places)
- The office metaphor exists but rooms are not yet tied to capability scopes
- Approvals have no UI yet — the backend is complete but there's no approval card or queue
- Run step trajectory view is not yet rendered

The v2 UI, built around real-time event-driven rendering, is being designed and will replace the current frontend. Until then, what you see is a transitional interface over a backend that is already v2-ready.

### Execution richness
- **Hermes streaming** — we currently capture the full output as a single `message` step per run. When hermes streaming is wired, the adapter will emit multiple `run.step` events (thoughts, tool calls, tool results) during a run. The backend contract already supports this; the adapter just needs the integration.
- **Capability-specific rooms** — agents always transition to/from the Focus room. Moves to Mail / Files / Web rooms require tool-level events from hermes that we don't intercept yet.
- **Approval kinds beyond `pre_dispatch`** — types for `send` and `network` gates exist but aren't wired; mid-run gates need hermes hooks we haven't added.

### Permissions
- `networkAccessMode: 'limited'` is accepted in the schema but currently behaves like `'open'`. Real allowlist support is future work.

### Adapters
- Ollama and cloud adapters exist but are not tested end-to-end. Hermes is the only verified execution path.

### Operations
- **Sleep awareness** — the launchd daemon is a `LaunchAgent`, so scheduled runs don't fire while the Mac is asleep. True always-on requires either a `LaunchDaemon` or a caffeinate wrapper.
- **Log rotation** — `~/.homeroom/logs/service.stdout.log` and `.stderr.log` grow unboundedly.
- **DB backup** — there is no snapshot/restore story for `homeroom.db`.
- **Auth** — none. Anyone on localhost can manage everything.

---

## Security

> **This is a local, single-user tool. It has no authentication.**

### Credential storage

API keys are encrypted with AES-256-GCM and stored at `~/.homeroom/credentials.json.enc`. The encryption key is derived from the machine ID and a local salt. This protects against casual file inspection but not against a determined attacker with access to both the encrypted file and the machine ID. This is local privacy, not hardened secret management. Keys are never stored in the browser.

### Network isolation

The backend binds to `127.0.0.1` by default and only accepts connections from localhost. **There is no authentication layer.** Anyone who can reach `localhost:5174` can:

- Manage agents, trigger runs, and view run output
- Read and write encrypted API credentials
- Modify all settings

This is acceptable for single-user local use. It is not acceptable for multi-user or network-exposed deployments.

### Per-agent network policy

Each agent's `networkAccessMode` is enforced at dispatch:

- `off` — hermes spawns with `HTTP_PROXY` and `HTTPS_PROXY` pointed at a dead port. Network calls fail at the socket layer.
- `limited` — accepted by the schema; currently behaves like `open` (allowlist support coming).
- `open` — no restriction.

### Remote origin CORS

Setting `ALLOW_REMOTE_ORIGINS=true` allows preview hosts (`*.lovable.app`, `*.lovableproject.com`) to reach the backend via CORS. This is gated behind two conditions:

1. `ALLOW_REMOTE_ORIGINS=true` must be set
2. `NODE_ENV=development` must also be set

If only `ALLOW_REMOTE_ORIGINS` is set without `NODE_ENV=development`, the service logs a warning and does **not** allow remote origins. **Do not enable this on shared networks.**

### Agent execution

Keys are injected as environment variables when hermes starts. They are not included in prompts or agent output. Keys are masked in all API responses.

---

## API surface

All endpoints are under `/api/`.

| Endpoint | Purpose |
|---|---|
| `GET /api/snapshot` | Full canonical state + current event cursor (bootstrap) |
| `GET /api/events/stream?since=N` | SSE with live events; replays after cursor `N` if provided |
| `GET /api/events?since=N[&through=M]` | Targeted replay of events (gap recovery) |
| `GET /api/agents` | List agents |
| `POST /api/agents` | Create agent |
| `GET/PATCH/DELETE /api/agents/:id` | Agent detail and mutations |
| `POST /api/agents/:id/run` | Start a manual run |
| `GET /api/agents/:id/runs` | Run history for one agent |
| `GET /api/agents/:id/activity` | Audit trail for one agent |
| `PUT /api/agents/:id/schedule` | Set schedule preset or cron |
| `GET /api/agents/:id/trust` | Trust findings |
| `GET /api/runs` | Global run history |
| `GET /api/runs/:id/steps` | Step-level trace for one run |
| `GET /api/approvals[?status=pending&agentId=<id>]` | Pending approvals |
| `POST /api/approvals/:id/resolve` | Approve or deny; resumes or cancels the run |
| `GET /api/audit` | Global audit log |
| `GET /api/trust/findings` | Trust findings across all agents |
| `GET /api/vault/status[/:id]` | Vault sync state with on-disk drift |
| `POST /api/vault/rebuild[/:id]` | Regenerate vault files |
| `GET /api/credentials` | Masked credential list |
| `POST /api/credentials/:provider` | Save an API key (encrypted) |
| `DELETE /api/credentials/:provider` | Remove a saved key |
| `GET /api/runtime/health` | Runtime health |
| `GET /api/runtime/models` | Available models |
| `GET/PATCH /api/settings` | App-wide settings |

---

## Project structure

```
Homeroom-Hermes/
  apps/service/       Fastify backend (SQLite, adapter layer, vault, scheduler, events)
  packages/
    adapter-hermes/   Wraps the hermes CLI
    adapter-ollama/   Ollama adapter (experimental, not fully tested)
    adapter-cloud/    Direct cloud API adapter (experimental, not fully tested)
    adapter-core/     Shared adapter interface, including AdapterRunPolicy
    domain/           Shared domain types
    schemas/          Zod schemas shared across packages
    contracts/        Request/response contracts for the HTTP API
  src/                React frontend (Vite) — current v1; v2 rebuild in progress
  scripts/            Daemon installer, app shortcut generator
```

---

## Tests

```sh
pnpm --filter @homeroom/service test
```

30 tests passing across 4 files covering agents, app integration, event bus, and vault drift detection.

---

## Design principles

The product is built on eight explicit principles:

1. Safe by default
2. Plug and play
3. Normal language first
4. Backend hidden by default
5. Audit always available, never forced
6. Visuals must map to reality
7. Human-readable permissions
8. Character creation is a usability device

And two load-bearing engineering rules:

- **The UI is a faithful translation of backend state.** No decorative motion. If the backend is silent, the UI is still.
- **Every visual state must be reproducible from persisted state plus ordered events plus wall-clock time.** If it isn't, it's a lie by construction.

The backend in this repo is v2-ready with respect to both rules. The v2 UI that enforces them end-to-end is the next piece of work.

---

## License

See LICENSE file.
