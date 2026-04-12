# Homeroom-Hermes

A local control plane for running AI agents. Homeroom is the visual layer that sits on top of [hermes-agent](https://github.com/NousResearch/hermes-agent) by NousResearch. Each agent you configure in Homeroom runs as a real hermes-agent process on your machine.

---

## What it is

Homeroom is not an AI framework. It is a management interface. The actual execution happens in hermes-agent. Homeroom handles:

- Creating and configuring agents (name, role, purpose, instructions, model)
- Triggering runs and collecting output
- Persisting run history, audit trails, trust findings, and settings
- Scheduling background execution
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

- Node.js 18 or later (or Bun)
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

## Getting started

```sh
# Clone
git clone https://github.com/cdf2170/Homeroom-Hermes.git
cd Homeroom-Hermes

# Install dependencies
npm install

# Start the backend service
cd apps/service
npm run dev

# In another terminal, start the frontend
cd ../..
npm run dev
```

Open `http://localhost:5173`.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5174` | Backend service port |
| `DB_PATH` | `homeroom.db` | SQLite database path |
| `ADAPTER` | `hermes` | Runtime adapter: `hermes`, `mock`, `ollama`, `cloud` |
| `HERMES_CLI_PATH` | `hermes` | Path to hermes binary |
| `HERMES_TIMEOUT_SECONDS` | `120` | Max seconds per agent turn |
| `VAULT_PATH` | `~/.homeroom/vault` | Local Obsidian-compatible vault path |
| `ALLOW_REMOTE_ORIGINS` | `false` | Set to `true` to allow non-localhost origins (preview hosts) |
| `LOG_LEVEL` | `info` | Fastify log level |

---

## Local docs vault

Every agent gets a folder at `$VAULT_PATH/Agents/<name>/` with these files:

- `AGENT.md` — identity, role, runtime settings
- `PROFILE.md` — instructions, behavior, notes
- `MEMORY.md` — memory items
- `RULES.md` — rules
- `SCHEDULE.md` — schedule configuration
- `TOOLS.md` — tool scopes and permissions
- `RUNS.md` — last 20 runs summary

Files are rewritten automatically when agent configuration changes. You can open `$VAULT_PATH` in Obsidian. The agent profile page shows sync status and lets you trigger a manual rebuild.

The vault is a generated export, not a two-way sync. If you edit vault files manually, those changes are not read back into the backend. The sync status indicator compares the backend's current state hash to the last-written hash, but does not diff on-disk file contents.

---

## What works now

- Create, edit, and delete agents — persisted in SQLite
- Run agents manually through the UI — calls hermes-agent, captures output
- Model selection per agent — passes `-m <model>` to hermes
- Provider API keys — stored encrypted locally, injected into hermes at runtime
- Run history — stored in DB, shown in Activity page
- Trust findings — computed from agent configuration, shown in Trust page
- Audit log — every create/update/delete/run recorded
- Settings — persisted in DB
- Local vault — markdown mirror of agent state, auto-updated on changes

## What is not yet implemented

- Approvals — the approvals UI exists but there is no backend route; runs do not block on approval
- Real scheduling — the schedule UI saves cron expressions to the DB but nothing executes them on a timer yet
- SSE push — run status updates use polling (2s interval); real-time push is not wired
- Ollama and cloud adapters — hermes is the only tested execution path

---

## Security

**Credential storage:** API keys are encrypted with AES-256-GCM and stored at `~/.homeroom/credentials.json.enc`. The encryption key is derived from the machine ID and a local salt. This protects against casual file inspection but not against a determined attacker with access to both the encrypted file and the machine ID. This is local privacy, not hardened secret management. Keys are never stored in the browser.

**Network isolation:** The backend only accepts connections from localhost by default. No authentication layer exists. If you set `ALLOW_REMOTE_ORIGINS=true`, remote preview hosts can reach the backend, which means any page on those hosts can call credential and agent management endpoints. Do not enable this on shared networks.

**Agent execution:** Keys are injected as environment variables when hermes starts. They are not included in prompts or agent output. Keys are masked in all API responses.

**No auth:** There is no user authentication on the backend API. Anyone who can reach localhost:5174 can manage agents, trigger runs, and read/write credentials. This is acceptable for single-user local use. It is not acceptable for multi-user or network-exposed deployments.
