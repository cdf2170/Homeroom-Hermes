# Homeroom-Hermes

**Homeroom is a local-first workspace for personal AI agents. It helps regular people create, supervise, and trust real agents running on their own computer.**

Each agent in Homeroom runs through [`hermes-agent`](https://github.com/NousResearch/hermes-agent). Homeroom is the human-facing layer on top: you describe what you want in plain language, choose what tools and permissions the agent has, and watch real work happen in a way that makes sense.

Homeroom is not trying to make agents magical. It is trying to make them legible.

---

## Why use it

Most agent tools expect you to be comfortable with terminals, logs, configs, and a lot of trial and error.

Homeroom is for people who want something simpler:

- Create agents in plain language
- Choose what they can and cannot do
- Run them locally on your own machine
- Review approvals before anything sensitive goes out
- Inspect the audit trail if you want, without being forced into it

It is built to feel calm, understandable, and safe by default.

---

## What you can do

With Homeroom, you can:

- Create an agent with a name, role, purpose, instructions, and model
- Give it human-readable permissions and approval rules
- Run it manually or on a schedule
- Review output, audit logs, and trust findings
- Keep a local markdown copy of agent configuration for reference and backup

Examples:

- *"Summarize my unread emails every morning"*
- *"Review pull requests and flag risky ones"*
- *"Watch a folder and organize new files"*
- *"Research a topic and write a short brief"*

---

## Safe by default

Homeroom is designed as a **personal localhost tool**, not a cloud SaaS dashboard.

By default:

- The backend binds to `127.0.0.1`
- API keys are stored encrypted on disk
- Agents can be restricted from network access, and that restriction is actually enforced
- Approval gates can hold actions before they leave your machine
- The backend is the source of truth for runs, approvals, events, and audit history

This is meant for one person on one computer.

---

## Getting started

### 1. Install Hermes

Homeroom uses `hermes-agent` as the execution engine.

```sh
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.zshrc   # or ~/.bashrc
hermes --version
```

See the [hermes-agent repo](https://github.com/NousResearch/hermes-agent) for platform-specific notes (WSL2, Termux, etc.).

### 2. Install Homeroom

```sh
git clone https://github.com/cdf2170/Homeroom-Hermes.git
cd Homeroom-Hermes
pnpm install
```

### 3. Install the background service

```sh
pnpm daemon:install
```

This builds the UI, registers the local daemon, and starts Homeroom in the background.

Optional: create a dock app shortcut on macOS:

```sh
pnpm app:install
```

### 4. Open Homeroom

Once installed:

- UI: http://localhost:5174
- API: same origin, same port
- No terminal required for daily use

Close the browser tab if you want. The daemon keeps scheduled agents running.

---

## Daily use

After setup, Homeroom is meant to feel simple:

1. Open the app
2. Create or select an agent
3. Tell it what to do
4. Review output or approvals if needed
5. Check the audit trail only when you want proof

When you update the codebase:

```sh
pnpm daemon:rebuild
```

Useful daemon commands:

```sh
pnpm daemon:status
pnpm daemon:logs
pnpm daemon:open
pnpm daemon:uninstall
```

---

## What works today

### Agent management
- Create, edit, and delete agents
- Set name, role, purpose, instructions, model, and visual appearance
- Enable or disable agents
- Persist all agent state in SQLite

### Runs
- Manual runs dispatch real hermes-agent subprocesses
- Per-agent model selection is passed through to Hermes
- Run records store input, output, status, duration, trigger, and settle reason
- Every lifecycle edge emits sequence-numbered events

### Scheduling
- Cron-based schedules via node-cron
- Presets for manual, hourly, daily, weekdays, and custom schedules
- Disabled agents unregister automatically

### Security and enforcement
- API keys encrypted at rest, and `/api/settings` reads provider connection state from the encrypted store (the same source the adapter uses at dispatch). The two views cannot drift.
- Backend locked to localhost by default
- Per-agent `networkAccessMode: 'off'` is actually enforced via a dead HTTP proxy at subprocess spawn time
- **Scheduled / background runs** can require approval before dispatch. When the agent's `requiresApprovalFor` list contains `schedule`, `background`, or `autonomous`, the run is held in `awaiting_approval` until the user resolves it. This is the only approval path the backend enforces today.

### Observability
- Durable event log with monotonic sequence numbers
- SSE stream with gap recovery support
- Full snapshot endpoint for bootstrap
- Audit log of create / update / delete / run / approval activity
- Trust findings computed from configuration

### Operations
- macOS launchd daemon support
- Auto-start on login, auto-restart on crash
- Single origin serving both UI and API from localhost:5174

---

## What is not finished yet

Being explicit so you know what is real and what is still in progress.

### The v2 UI is still in progress

The current frontend works, but it does not yet fully enforce the v2 render model. In particular:

- Some views still poll instead of being fully event-driven
- The office metaphor exists, but rooms are not yet fully tied to capability scopes
- Approvals are implemented in the backend but do not yet have the full approval UI
- Run-step trajectory rendering is still incomplete

The backend is ahead of the frontend right now.

### Execution richness
- Hermes output is currently captured mostly as a single message step
- Richer multi-step traces need tighter Hermes streaming integration
- Room-specific transitions like Mail / Files / Web need finer-grained tool events

### Permissions
- Tool-level approval gates (`send`, `network`, `file:write`, `shell:exec`, etc.) are NOT enforced. The backend does not intercept adapter tool calls. An agent configured with these approval scopes will log a trust finding (`UNSUPPORTED_APPROVAL_SCOPE`) so the UI doesn't silently imply enforcement that doesn't exist.
- `networkAccessMode: 'limited'` is accepted by the schema but currently behaves like `open`. Agents set to `limited` trigger a trust finding (`NETWORK_MODE_LIMITED_UNENFORCED`). Treat `limited` as experimental; for real network blocking, use `off`.
- Real allowlist behavior and tool-level gates are future work, pending hermes hook integration.

### Adapters
- Hermes is the verified path
- Ollama and cloud adapters exist but are not yet fully proven end to end

### Operational gaps
- Scheduled runs do not fire while the Mac is asleep
- Log rotation is not implemented yet
- DB backup / restore is not implemented yet
- There is no authentication layer, because this is intended for localhost single-user use

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

When you click Run, the service calls:

```sh
hermes chat -q "<your input>" --quiet
```

If the agent has a selected model, Homeroom appends:

```
-m <model>
```

API keys are injected as environment variables at runtime and never stored in the browser.

If an agent's network access is set to `off`, Hermes is launched with `HTTP_PROXY` and `HTTPS_PROXY` pointed at a dead port so outbound calls fail at the socket layer.

---

## Architecture at a glance

- **SQLite is the source of truth.**
- **Every state-changing event has a monotonic sequence number.**
- **The UI can detect gaps and request replay.**
- **Scene state is authoritative** — written only by run-service on lifecycle transitions.
- **Permissions are enforced at dispatch**, not just stored as metadata.

Key endpoints:

- `GET /api/snapshot` — full canonical state plus the event cursor
- `GET /api/events?since=N[&through=M]` — targeted replay after cursor `N`
- `GET /api/events/stream?since=N` — live SSE stream with optional catch-up

### Storage split

*Your agents are files you own. Their work is runtime data the system records.*

- **Agent config** (identity, role, purpose, permissions, schedule, rules, memory) — SQLite today, with a one-way markdown mirror for human legibility. Planned to flip to files-first for the core profile (see [Planned: files-first config](#planned-files-first-config)).
- **Runtime data** (runs, run steps, approvals, audit events, stream events) — SQLite, permanently. Flat files cannot provide the transactional guarantees this layer requires.

---

## Local markdown mirror

Homeroom maintains a local markdown mirror at:

```
~/.homeroom/vault/Agents/<name>/
```

Files:

- `AGENT.md` — identity, role, runtime settings
- `PROFILE.md` — instructions, behavior, notes
- `MEMORY.md` — memory items
- `RULES.md` — rules
- `SCHEDULE.md` — schedule configuration
- `TOOLS.md` — tool scopes and permissions
- `RUNS.md` — last 20 runs summary

**Every file declares its authority in YAML frontmatter.** Today every file is `authority: export`, meaning it is a one-way mirror from SQLite. You can open the folder in Obsidian, grep it, diff it, back it up with any tool. Edits you make in your editor are not read back into the backend; they will be overwritten on the next sync.

Mirror sync states:

- **In sync** — backend and disk match
- **Backend changed** — backend changed since last write
- **Files edited** — disk changed outside Homeroom
- **Not written** — files not generated yet
- **Diverged** — backend and disk changed independently

### Planned: files-first config

The deliberate direction is that agent config becomes authoritative on disk for the core profile files, while runtime data stays in SQLite. Phased:

1. **v1 (now) — language fix.** Call this a markdown mirror, not a vault with two-way authority. Every generated file declares `authority: export`. Done.
2. **v2 — authority flip for the core profile.** `AGENT.md`, `PROFILE.md`, `TOOLS.md`, `SCHEDULE.md` become `authority: file`. The backend reads them on change. `MEMORY.md` and `RULES.md` stay in SQLite until the pattern is proven.
3. **v3 — file watcher + parser + validation.** A watcher detects edits, parses frontmatter and body, validates against schemas, surfaces errors in the UI, emits `agent.updated` events.
4. **v4 — conflict policy.** When both the app and a file editor modify the same field, show a merge banner instead of silently overwriting.

Runtime data (runs, run steps, approvals, audit events, stream events) will permanently stay in SQLite.

---

## Security model

Homeroom is a local, single-user tool. It has no authentication.

### Credential storage

API keys are encrypted with AES-256-GCM and stored at:

```
~/.homeroom/credentials.json.enc
```

Keys are derived from machine-local material plus a salt. This protects against casual inspection; it does not protect against a determined attacker with full machine access. Keys are never stored in the browser.

### Localhost-only default

The backend binds to `127.0.0.1`. Anyone who can reach `localhost:5174` can:

- Manage agents
- Trigger runs
- Read run output
- Write credentials
- Modify settings

That is acceptable for personal local use. It is not acceptable for shared or exposed deployments.

### Per-agent network policy

At dispatch time, the adapter honors the agent's `networkAccessMode`:

- `off` — Hermes is spawned with `HTTP_PROXY` / `HTTPS_PROXY` pointed at a dead port. Outbound connections fail at the socket layer. **This is real enforcement.**
- `limited` — experimental. Accepted by the schema, currently behaves like `open`. Agents set to `limited` trigger a `NETWORK_MODE_LIMITED_UNENFORCED` trust finding so the UI doesn't misrepresent it as a safety boundary.
- `open` — no restriction.

### Remote-origin CORS

`ALLOW_REMOTE_ORIGINS=true` only takes effect when `NODE_ENV=development` is also set. This is for preview and development environments only and should not be enabled on shared networks.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5174` | Backend service port |
| `HOST` | `127.0.0.1` | Backend bind address |
| `DB_PATH` | `homeroom.db` | SQLite database path |
| `ADAPTER` | `hermes` | Runtime adapter |
| `HERMES_CLI_PATH` | `hermes` | Path to Hermes binary |
| `HERMES_TIMEOUT_SECONDS` | `120` | Max runtime per turn |
| `VAULT_PATH` | `~/.homeroom/vault` | Markdown mirror path |
| `STATIC_ROOT` | `<repo>/dist` | Built frontend directory |
| `ALLOW_REMOTE_ORIGINS` | `false` | Allow non-localhost CORS in dev only |
| `NODE_ENV` | (unset) | Must be `development` to allow remote origins |
| `LOG_LEVEL` | `info` | Fastify log level |

---

## API surface

All endpoints live under `/api/`.

| Endpoint | Purpose |
|---|---|
| `GET /api/recent-state` | Recent slice of canonical state (last 200 runs + audit, all agents, pending approvals) plus current cursor. For full history, use `/api/events`. `GET /api/snapshot` is a legacy alias. |
| `GET /api/events/stream?since=N` | SSE live stream with replay support |
| `GET /api/events?since=N[&through=M]` | Targeted event replay |
| `GET /api/agents` | List agents |
| `POST /api/agents` | Create agent |
| `GET/PATCH/DELETE /api/agents/:id` | Agent detail and updates |
| `POST /api/agents/:id/run` | Start a manual run |
| `GET /api/agents/:id/runs` | Agent run history |
| `GET /api/agents/:id/activity` | Agent audit trail |
| `PUT /api/agents/:id/schedule` | Set schedule |
| `GET /api/agents/:id/trust` | Trust findings |
| `GET /api/runs` | Global run history |
| `GET /api/runs/:id/steps` | Step-level trace |
| `GET /api/approvals` | Pending approvals |
| `POST /api/approvals/:id/resolve` | Approve or deny |
| `GET /api/audit` | Global audit log |
| `GET /api/trust/findings` | Trust findings across agents |
| `GET /api/vault/status[/:id]` | Markdown mirror sync state |
| `POST /api/vault/rebuild[/:id]` | Rebuild markdown mirror |
| `GET /api/credentials` | Masked credential list |
| `POST /api/credentials/:provider` | Save encrypted credential |
| `DELETE /api/credentials/:provider` | Remove credential |
| `GET /api/runtime/health` | Runtime health |
| `GET /api/runtime/models` | Available models |
| `GET/PATCH /api/settings` | App-wide settings |

---

## Project structure

```
Homeroom-Hermes/
  apps/service/       Fastify backend (SQLite, adapter layer, markdown mirror, scheduler, events)
  packages/
    adapter-hermes/   Wraps the hermes CLI
    adapter-ollama/   Ollama adapter (experimental)
    adapter-cloud/    Direct cloud adapter (experimental)
    adapter-core/     Shared adapter interface
    domain/           Shared domain types
    schemas/          Shared Zod schemas
    contracts/        Request/response contracts
  src/                React frontend (current UI; v2 rebuild in progress)
  scripts/            Daemon installer, app shortcut generator
```

---

## Tests

```sh
pnpm --filter @homeroom/service test
```

Current backend test coverage: agents, app integration, event bus, vault drift detection. 30 tests passing across 4 files.

---

## Design principles

Homeroom is built around eight product principles:

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

The backend is v2-ready with respect to both rules. The v2 UI is the next piece of work.

---

## License

See LICENSE file.
