
# Homeroom UX Polish — Making It Feel Calm and Confident

This is a broad UX enhancement pass across the entire app. The work groups into 6 implementation batches plus 5 cross-cutting architectural requirements.

---

## Cross-Cutting Requirement A: State Coverage Matrix

Every major screen MUST handle these 9 states explicitly:

| State | What it means | UI treatment |
|-------|--------------|--------------|
| **Loading** | Data is being fetched | Skeleton placeholders matching final layout shape |
| **Empty** | No data exists yet | Friendly guidance + first action CTA |
| **Success** | Action completed | Toast or inline confirmation with next step |
| **Error** | Something failed | Retry button + plain-English explanation |
| **Disconnected** | No backend/runtime | Banner: "Running in demo mode — connect models to go live" |
| **Demo mode** | No real runtime configured | Subtle badge on affected components, all features explorable |
| **Unsaved changes** | User edited but didn't save | Dot indicator on save button, confirm-before-leave dialog |
| **First-run** | User's first time on this screen | Contextual onboarding hint or welcome card |
| **Returning user** | User has history | Show recent activity, skip onboarding hints |

Screens that must implement all 9: Front Desk, Agent Profile, Agents List, Trust Center, Settings, Connections.
Screens with subset: Office (loading, empty, demo), Templates (loading, empty), Activity (loading, empty, error).

---

## Cross-Cutting Requirement B: Post-Create Success Loop

After agent creation, the app guides users through their first win:

1. **Success screen** — "Meet [Agent Name]" with their sprite, a congratulations moment, and a single CTA: "Run your first task"
2. **Suggested first task** — Pre-filled input based on agent purpose (e.g., "Summarize this article" for a Research agent). One-click to run.
3. **Run result** — Show output inline with "Here's what [Agent] did" framing. Include trust signals: "Ran locally", "No external calls made"
4. **Next setup suggestions** — After first successful run, show 3 cards: "Add a memory", "Set a safety rule", "Try a harder task"
5. **Ownership moment** — After 2+ interactions, show: "You and [Agent] are getting started. Visit their profile to fine-tune."

This flow lives in a new `PostCreateFlow.tsx` component, triggered after `CreateAgentPage` completes. Progress tracked in localStorage.

---

## Cross-Cutting Requirement C: Connections Hub Scope

The Connections/Plugins page (`PluginsPage.tsx`) must be a full product surface:

**What the page shows:**
- Connection status dashboard: X connected, Y available, Z coming soon
- Category sections: AI Providers, Productivity, Communication, Data & Web, Dev Tools
- Each plugin card: name, icon, one-line purpose, setup method badge (API Key / OAuth / Built-in), safety tier badge

**Safety tier badges on every plugin:**
- 🟢 Safe (local-only, no data leaves device): Ollama, local file tools
- 🟡 Review recommended (cloud, sends data externally): OpenAI, Google Calendar, Gmail
- 🔴 Advanced (powerful, high-access): Slack workspace, Notion full access, webhooks

**First 15 plugins (priority order):**
1. Ollama (Safe, Built-in)
2. OpenRouter (Review, API Key)
3. OpenAI (Review, API Key)
4. Anthropic (Review, API Key)
5. Google Calendar (Review, OAuth)
6. Gmail (Review, OAuth)
7. Notion (Advanced, OAuth)
8. Slack (Advanced, OAuth)
9. GitHub (Review, OAuth)
10. Webhook (Advanced, API Key)
11–15: Brave Search, Tavily, Linear, Jira, Discord (coming soon)

**How connections appear in agent profiles:**
- Tools tab shows which connections are available to this agent
- Each connected plugin shows as a toggleable capability card
- Safety rail updates to reflect connected external services

**Docs links:** Each plugin card links to setup documentation (placeholder URLs initially)

---

## Cross-Cutting Requirement D: Microcopy Trust System

Every screen must answer four questions through inline copy:

| Question | Implementation |
|----------|---------------|
| **What is this?** | Section header subtitle (1 line, always visible) |
| **Why would I use it?** | Tooltip or "Learn more" expandable (on demand) |
| **Is this safe?** | Trust badge or safety note on anything involving data/cloud/permissions |
| **What happens next?** | Action button labels include consequence ("Save and apply", "Run now — takes ~10s") |

**Microcopy inventory (must be added):**

- Agent Profile Overview: "This is [Agent]'s identity — how they introduce themselves."
- Memory section: "Memories help [Agent] remember things between conversations."
- Rules section: "Rules are hard limits [Agent] will always follow."
- Tools section: "Tools control what [Agent] can access. Fewer tools = safer agent."
- Schedule section: "Schedules let [Agent] work without you being here."
- Intelligence selector: "Higher = smarter but slower and more expensive."
- Background toggle: "ON: [Agent] works even when Homeroom is closed. OFF: only when you're here."
- Internet toggle: "ON: [Agent] can reach websites. OFF: fully offline."
- Local vs Cloud: "Local: private, runs on your machine. Cloud: more powerful, sends data to a provider."
- Connection cards: "Your API key stays on your device and is never sent to Homeroom servers."

---

## Cross-Cutting Requirement E: Visual Hierarchy

The product hierarchy defines information priority and prevents competing attention:

| Tier | Screen | Role | Visual weight |
|------|--------|------|--------------|
| **1 — Command** | Front Desk | What's happening + what to do next | Highest — first thing users see, warm summary |
| **2 — First value** | Create Agent + Post-Create Flow | First success moment | Focused, minimal, celebratory |
| **3 — Control surface** | Agent Profile | Main editing workspace | Dense but organized, tabbed |
| **4 — Trust** | Trust Center + Safety Rails | Review and confidence | Calm, status-driven, green/amber/red |
| **5 — Atmosphere** | Office | Living visualization | Immersive, low-info-density, delightful |
| **6 — Extend** | Connections/Plugins | Add capabilities | Directory-style, badge-heavy |
| **7 — System** | Settings | Global configuration | Minimal, functional |

**Design rules from hierarchy:**
- Tier 1-2 screens: Large type, generous whitespace, single primary CTA per view
- Tier 3: Dense content OK, but must use clear tab/section separation
- Tier 4: Status colors dominate (green/amber/red), minimal decoration
- Tier 5: Visual richness allowed, sprites and animation
- Tier 6-7: Compact, utility-focused, minimal emotional design

---

## Batch 1: Front Desk Enhancement

Upgrade `FrontDeskPage.tsx` from a basic summary into the app's calm command center.

- Add a "What changed recently" section showing last 5 agent events across all agents
- Add "Ready to automate" cards for agents that could safely run in background
- Add a setup checklist component (Connect OpenClaw, Set up models, Review safety defaults, Create first agent, Run a test task) with progress tracking via localStorage
- Add "Suggested next action" buttons contextually (Add memory, Review rules, Run a test task, Make background-safe, Connect cloud models)
- Improve the welcome summary to feel conversational, not metric-heavy
- **State coverage:** All 9 states including first-run welcome vs returning user dashboard

## Batch 2: Rich Empty States + Microcopy

Touch every section in `AgentProfilePage.tsx` to add helpful empty states and inline explainers.

**Empty states with guidance:**
- Memory: "No memory yet — Add a few things this agent should remember, like your writing preferences or important facts." with quick-add chips (User preference, Important fact, Standing context)
- Rules: "No rules yet — Add rules to keep this agent predictable and safe." with quick-add chips (Safety rule, Preference, Hard limit)
- Activity/Runs: "No recent runs — Run this agent once to see what it can do." with a Run Now button
- Tools: "No tools configured — Set up guardrails to control what this agent can do." with a Safe Defaults button

**Microcopy from Requirement D applied to all sections.**

## Batch 3: Sticky Safety Summary + Visual Grouping

Make safety and identity visible at all times on the agent profile.

- Persistent Safety Summary rail in sidebar
- "Recommended" / "Safe default" / "Advanced" badges on all config options
- Safe vs Advanced section divider with "Most people won't need this" note
- Trust language inline: "Stored locally", "Cloud-backed", "Needs review", "No exposed secrets"

## Batch 4: Tactile Memory + Rules

Make Memory and Rules sections feel like organizing cards.

- Category icons (heart, lightbulb, bookmark, sticky-note)
- Pinned memories float to top
- Quick-add chips pre-fill category and placeholder
- Rules: ordered, grouped by priority with colored borders
- Quick-add rule chips: "Never do...", "Always ask before...", "Prefer..."

## Batch 5: Run Detail + Templates + List Polish + Post-Create Flow

- **Run detail drawer** with full lifecycle view
- **Template chooser** with outcome descriptions and "Good for" tags
- **Agent list** with filters, sort, inline actions, per-filter empty states
- **Post-create success flow** (Requirement B) implemented here

## Batch 6: Onboarding + Trust Center + State Coverage + Connections

- **Onboarding** with setup checklist and connection state detection
- **Trust Center** with overall status badge, per-agent safety cards, severity levels
- **Connections hub** fully scoped per Requirement C
- **Global state coverage** audit — verify all screens against Requirement A matrix
- **Loading skeletons**, error states with retry, unsaved changes indicators, destructive confirmation dialogs

---

## Files Impacted

| File | Changes |
|------|---------|
| `src/pages/FrontDeskPage.tsx` | Major rewrite — checklist, recent changes, suggested actions, all 9 states |
| `src/pages/AgentProfilePage.tsx` | Heavy — empty states, microcopy, safety rail, memory/rules, badges, divider |
| `src/types/agent.ts` | Add `pinned` to MemoryItem, `order` to RuleItem |
| `src/components/RunDetailDrawer.tsx` | New — sheet-based run detail view |
| `src/components/PostCreateFlow.tsx` | New — post-creation success loop |
| `src/pages/AgentsPage.tsx` | Filters, sort, inline actions, empty states |
| `src/pages/TemplatesPage.tsx` | Outcome descriptions, "Good for" tags |
| `src/pages/OnboardingPage.tsx` | Setup states, checklist, connection detection |
| `src/pages/TrustCenterPage.tsx` | Overall badge, severity colors, agent cards |
| `src/pages/PluginsPage.tsx` | Full connections hub with safety tiers, docs links |
| `src/services/mockApi.ts` | Extend with recent events query |
| `src/components/StateCoverage.tsx` | New — reusable loading/empty/error/disconnected wrappers |

---

## Execution Order

1. Batch 2 (empty states + microcopy) — highest UX impact, lowest risk
2. Batch 3 (safety summary + recommended badges) — builds confidence
3. Batch 4 (tactile memory + rules) — makes core editing satisfying
4. Batch 1 (Front Desk upgrade) — command center
5. Batch 5 (run detail + templates + list + post-create flow) — depth
6. Batch 6 (onboarding + trust + state coverage audit + connections) — polish

Cross-cutting requirements A–E are applied continuously across all batches, not as separate work items.
