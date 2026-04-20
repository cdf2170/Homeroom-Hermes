# Homeroom-Hermes

A local control plane for running AI agents. Homeroom is the visual layer that sits on top of [hermes-agent](https://github.com/NousResearch/hermes-agent) by NousResearch. Each agent you configure in Homeroom runs as a real hermes-agent process on your machine.

---

## What it is

Homeroom is not an AI framework. It is a management interface. The actual execution happens in hermes-agent. Homeroom handles:

- Creating and configuring agents (name, role, purpose, instructions, model)
- Triggering runs and collecting output
- Persisting run history, audit trails, trust findings, and settings
- A local Obsidian-compatible vault that mirrors agent configuration as markdown

---

## How it works

```
Browser UI (React + Vite)
      |
      | HTTP (localhost:5174)
      v
Homeroom Service (Fastify + SQLite)
      |
      | spawns process
      v
hermes-agent CLI
      |
      | API key (env var)
      v
AI provider (Anthropic, OpenAI, OpenRouter, etc.)
```

When you click Run in the UI, the service calls:

```sh
hermes chat -q "<your input>" --quiet
```

With `-m <model>` appended if you have selected a specific model for the agent. API keys are injected as environment variables. They are stored AES-256-GCM encrypted at `~/.homeroom/credentials.json.enc`.

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

# Install dependencies (pnpm is required for the monorepo workspace)
pnpm install

# One-time install: builds the UI and registers the background daemon
pnpm daemon:install

# Optional: create a Homeroom.app icon you can drag to your dock
pnpm app:install
```

From now on, Homeroom is a daily-use app:

- **One process**, running in the background, automatically on login
- **One URL**: http://localhost:5174 serves both the UI and the API
- **No terminal needed**. Just click the Homeroom app in your dock, or bookmark the URL
- **Always on**. Close the browser tab; agents keep running on schedule

When you update the code:

```sh
pnpm daemon:rebuild   # rebuilds the UI and restarts the daemon
```

### Other daemon commands

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

Every agent gets a folder at `$VAULT_PATH/Agents/<name>/` with these files:

- `AGENT.md` -- identity, role, runtime settings
- `PROFILE.md` -- instructions, behavior, notes
- `MEMORY.md` -- memory items
- `RULES.md` -- rules
- `SCHEDULE.md` -- schedule configuration
- `TOOLS.md` -- tool scopes and permissions
- `RUNS.md` -- last 20 runs summary

Files are rewritten automatically when agent configuration changes. You can open `$VAULT_PATH` in Obsidian. The agent profile page shows sync status and lets you trigger a manual rebuild.

The vault is a generated export, not a two-way sync. If you edit vault files manually, those changes are not read back into the backend. The sync status indicator now performs real on-disk file comparison:

- **In sync** -- backend state, last-written hash, and on-disk content all match
- **Backend changed** -- backend state has changed since the last write; rebuild to update
- **Files edited** -- on-disk files were modified outside Homeroom; rebuilding will overwrite
- **Not written** -- vault files haven't been generated yet
- **Diverged** -- both backend state and disk files changed independently

---

## What works now

- Create, edit, and delete agents -- persisted in SQLite
- Run agents manually through the UI -- calls hermes-agent, captures output
- Model selection per agent -- passes `-m <model>` to hermes
- Provider API keys -- stored encrypted locally, injected into hermes at runtime
- Run history -- stored in DB, shown in Activity page
- Trust findings -- computed from agent configuration, shown in Trust page
- Audit log -- every create/update/delete/run recorded
- Settings -- persisted in DB
- Local vault -- markdown mirror of agent state, with on-disk drift detection
- Agent appearance -- visual customization persisted across sessions
- Schedule execution -- cron-based scheduling with node-cron; runs fire automatically while the service is active
- SSE live updates -- backend pushes run lifecycle events to the frontend via EventSource
- Connections page -- real AI provider credential management

## What is not yet implemented

- **Approvals** -- the approvals concept is designed but has no backend route; runs do not block on approval
- **Ollama and cloud adapters** -- present in code but not fully tested; hermes is the primary execution path
- **Plugin integrations** -- AI provider connections work (API keys stored and used); other integrations (Calendar, Slack, etc.) are coming soon

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

### Remote origin CORS

Setting `ALLOW_REMOTE_ORIGINS=true` allows preview hosts (`*.lovable.app`, `*.lovableproject.com`) to reach the backend via CORS. This is gated behind two conditions:

1. `ALLOW_REMOTE_ORIGINS=true` must be set
2. `NODE_ENV=development` must also be set

If only `ALLOW_REMOTE_ORIGINS` is set without `NODE_ENV=development`, the service logs a warning and does **not** allow remote origins. When active, the service logs a prominent warning at startup.

**Do not enable this on shared networks.** Any page on an allowed origin can call credential and agent management endpoints.

### Agent execution

Keys are injected as environment variables when hermes starts. They are not included in prompts or agent output. Keys are masked in all API responses.

---

## Project structure

```
Homeroom-Hermes/
  apps/service/       Fastify backend (SQLite, adapter layer, vault)
  packages/
    adapter-hermes/   Wraps the hermes CLI
    adapter-ollama/   Ollama adapter (experimental)
    adapter-cloud/    Direct cloud API adapter (experimental)
    adapter-core/     Shared adapter interface
    domain/           Shared domain types
  src/                React frontend (Vite)
```

---

## License

See LICENSE file.
