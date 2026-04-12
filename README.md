# Homeroom

A visual workspace for building and running AI agents. You design a cast of characters — each with a role, personality, model, and set of permissions — and Homeroom gives them a place to live and work.

The core idea is that agent orchestration is much easier to reason about when you can see it: teammates in rooms, tasks in progress, approvals waiting, activity logged. Instead of editing YAML and grepping through logs, you configure agents the way you'd set up coworkers, and watch them operate.

---

## What it looks like

The interface is an office. Agents occupy rooms — a work area, a lounge, a server room, a quiet corner. Each agent has a name, a role, a model, and a disposition. You can see who is working, who is idle, and who needs your attention. Clicking an agent opens their inspector, where you can edit everything about them, run them manually, read their audit trail, and tune their behavior.

It is not a chat interface. You are the manager, not the user.

---

## What agents can actually do

Agents are backed by [Hermes](https://github.com/NousResearch/hermes), a CLI agent that supports tool use, memory, skills, and multi-turn sessions. When you run an agent, Homeroom calls:

```
hermes chat -q "<your input>" --quiet -m <your chosen model>
```

Your API keys are injected as environment variables at run time. Keys are encrypted at rest using AES-256-GCM and never leave your machine.

Supported runtimes:
- **Hermes** — default, requires the `hermes` CLI on PATH
- **Ollama** — fully local, no API keys needed
- **Cloud** — direct OpenAI / Anthropic / Google calls without Hermes
- **Mock** — simulates runs without real execution, useful for UI development

---

## The character layer

Every agent has:

- **Role** — what they are responsible for (e.g. "monitors email and writes daily digests")
- **Personality** — tone and communication style, fed into their system prompt
- **Model** — the specific model they run on (e.g. `anthropic/claude-3.5-sonnet`)
- **Smartness level** — quick, balanced, or deep; affects which model tier is suggested
- **Runtime mode** — local, cloud, or hybrid
- **Permissions** — which tools they can use, whether they need approval before acting, whether they run in the background
- **Schedule** — when they run automatically
- **Memory** — pinned facts they carry across runs
- **Rules** — constraints enforced before every run
- **Room** — where they sit in the office
- **Appearance** — cosmetic, but it makes people care more about them

None of this is decoration. Personality shapes the system prompt, permissions shape what Hermes is allowed to do, model selection shapes cost and capability. The visual layer makes those decisions feel legible and owned.

---

## Stack

```
src/                  React + Tailwind frontend (Vite)
apps/service/         Fastify + SQLite backend (port 5174)
packages/
  adapter-core/       RuntimeAdapter interface
  adapter-hermes/     Hermes CLI wrapper + MockAdapter
  adapter-ollama/     Ollama adapter
  adapter-cloud/      Direct cloud provider adapter
  contracts/          Zod schemas for all API requests and views
  domain/             Core domain types (AgentProfile, etc.)
  schemas/            Shared enums and primitives
```

The frontend talks exclusively to the local service. The service talks to whichever adapter is configured. Nothing phones home.

---

## Getting started

**Prerequisites:**
- Node.js 20+ and pnpm
- The `hermes` CLI installed and on PATH (run `hermes doctor` to verify)
- An API key for at least one provider (Anthropic, OpenAI, Google, or OpenRouter)

**Run:**

```bash
pnpm install
pnpm start
```

This starts the backend service on port 5174 and the frontend on port 5173.

**First time:**
1. Open Settings and connect an AI provider under Providers
2. Go to Agents and create your first agent
3. Describe what you want them to do — the UI will suggest a name, model, and smartness level
4. Open the agent, pick their model, set their permissions
5. Hit Run Now

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `ADAPTER` | `hermes` | Runtime: `hermes`, `ollama`, `cloud`, `mock` |
| `HERMES_CLI_PATH` | `hermes` | Path to the hermes binary |
| `HERMES_TIMEOUT_SECONDS` | `120` | Max seconds per agent turn |
| `DB_PATH` | `./homeroom.db` | SQLite database path |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `nous-hermes2` | Default Ollama model |
| `PORT` | `5174` | Service port |

---

## Status

The UI is complete and wired to the backend. Agent creation, editing, model selection, runs, audit trail, trust findings, and credential management all work end to end. Schedules are stored but not yet firing. Permission enforcement — passing tool restrictions to Hermes — is the next significant piece.

This is early software. The goal is a stable, forkable base: clone it, run it locally, build from it. Not a hosted service.

---

## License

MIT
