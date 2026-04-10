

# Homeroom UX Polish — Making It Feel Calm and Confident

This is a broad UX enhancement pass across the entire app. The work groups into 6 implementation batches.

---

## Batch 1: Front Desk Enhancement

Upgrade `FrontDeskPage.tsx` from a basic summary into the app's calm command center.

- Add a "What changed recently" section showing last 5 agent events across all agents
- Add "Ready to automate" cards for agents that could safely run in background
- Add a setup checklist component (Connect OpenClaw, Set up models, Review safety defaults, Create first agent, Run a test task) with progress tracking via localStorage
- Add "Suggested next action" buttons contextually (Add memory, Review rules, Run a test task, Make background-safe, Connect cloud models)
- Improve the welcome summary to feel conversational, not metric-heavy

## Batch 2: Rich Empty States + Microcopy

Touch every section in `AgentProfilePage.tsx` to add helpful empty states and inline explainers.

**Empty states with guidance:**
- Memory: "No memory yet — Add a few things this agent should remember, like your writing preferences or important facts." with quick-add chips (User preference, Important fact, Standing context)
- Rules: "No rules yet — Add rules to keep this agent predictable and safe." with quick-add chips (Safety rule, Preference, Hard limit)
- Activity/Runs: "No recent runs — Run this agent once to see what it can do." with a Run Now button
- Tools: "No tools configured — Set up guardrails to control what this agent can do." with a Safe Defaults button

**Microcopy ("What does this mean?") added to:**
- Intelligence level selector: "Higher settings can handle harder tasks, but may cost more or feel slower."
- Background toggle: "This lets the agent keep working without you reopening Homeroom."
- Internet access toggle: "Allows this agent to reach websites and external services."
- Schedule presets: plain-English consequences for each option
- Local vs Cloud runtime: "Local: runs on your machine, fully private. Cloud: uses an online AI provider, more powerful."

## Batch 3: Sticky Safety Summary + Visual Grouping

Make safety and identity visible at all times on the agent profile.

- Add a persistent **Safety Summary rail** to the left sidebar of `AgentProfilePage.tsx` (below the section nav, above actions). Shows: local/cloud, manual/background, internet access, approval required, trust level — always visible regardless of active tab
- Add **"Recommended" / "Safe default" / "Advanced"** badges on:
  - Model selection (smartness level)
  - Schedule presets
  - Permission presets (add Safe / Balanced / Advanced presets to Tools section)
  - Background mode
- Add a visible **"Safe vs Advanced"** divider: sections Overview through Rules labeled as "Essentials", Schedule through Advanced labeled with a subtle "Advanced" header and "Most people won't need this" note
- Add trust language inline: "Stored locally", "Cloud-backed", "Needs review before background use", "No exposed secrets detected" as small badges/tags on relevant fields

## Batch 4: Tactile Memory + Rules

Make Memory and Rules sections feel like organizing cards.

**Memory enhancements:**
- Add icons per category (heart for preference, lightbulb for fact, bookmark for context, sticky-note for note)
- Add `pinned` field to `MemoryItem` type; pinned items float to top with a pin icon
- Quick-add chips below the add form: "User preference", "Important fact", "Safety rule" — clicking pre-fills category and placeholder
- Richer card design with subtle left-border color by category

**Rules enhancements:**
- Add `order` field to `RuleItem`; up/down arrow buttons to reorder
- Group rules visually by priority: Safety rules first (green border), then Preferences (blue), then Hard Rules (red)
- Quick-add chips: "Never do...", "Always ask before...", "Prefer..."

## Batch 5: Run Detail + Templates + List Polish

**Run detail drawer** (`RunDetailDrawer.tsx` — new component using Sheet):
- What was asked (input)
- What happened (plain-English summary)
- What the agent returned (expandable output)
- Whether anything was blocked/redacted
- Whether approval was needed
- Model/runtime used
- Status lifecycle: Queued, Running, Succeeded, Failed, Cancelled
- Timestamps + duration
- Retry button
- Clickable from Activity section and AgentsPage

**Template chooser enhancement** in `TemplatesPage.tsx`:
- Add outcome-focused descriptions: "Research Assistant — Finds sources, compares options, and summarizes clearly"
- Add "Good for" tags on each template

**Agent list polish** in `AgentsPage.tsx`:
- Add filters: "Background", "Never run", "Not configured"
- Add sort dropdown: name, last run, status
- Add enable/disable toggle directly on cards
- Add "Run now" button on cards
- Add "why flagged" hint text on attention cards
- Empty states per filter: "No background agents", "No cloud agents"

## Batch 6: Onboarding + Trust Center + State Coverage

**Onboarding expansion** in `OnboardingPage.tsx`:
- Add setup checklist step with real state detection
- Add explicit connection states: demo mode, local-only, cloud configured
- Persist setup progress to localStorage

**Trust Center completion** in `TrustCenterPage.tsx`:
- Overall status badge: Safe / Needs review / At risk
- Per-agent safety summary cards (reuse SafetySummaryCard)
- Visual severity levels: informational (blue), review (amber), risky (red)
- Trust language: "No exposed secrets detected", "All agents use local models"

**Global state coverage:**
- Add loading skeleton component
- Add error state with retry for all data-fetching screens
- Add unsaved changes indicator to EditableField (already partially there)
- Add destructive confirmation dialog for agent deletion

---

## Files Impacted

| File | Changes |
|------|---------|
| `src/pages/FrontDeskPage.tsx` | Major rewrite — checklist, recent changes, suggested actions |
| `src/pages/AgentProfilePage.tsx` | Heavy — empty states, microcopy, safety rail, memory/rules enhancements, recommended badges, safe/advanced divider |
| `src/types/agent.ts` | Add `pinned` to MemoryItem, `order` to RuleItem |
| `src/components/RunDetailDrawer.tsx` | New — sheet-based run detail view |
| `src/pages/AgentsPage.tsx` | Filters, sort, inline actions, empty states |
| `src/pages/TemplatesPage.tsx` | Outcome descriptions, "Good for" tags |
| `src/pages/OnboardingPage.tsx` | Setup states, checklist |
| `src/pages/TrustCenterPage.tsx` | Overall badge, severity colors, agent cards |
| `src/services/mockApi.ts` | Extend with recent events query |

---

## Execution Order

1. Batch 2 (empty states + microcopy) — highest UX impact, lowest risk
2. Batch 3 (safety summary + recommended badges) — builds confidence
3. Batch 4 (tactile memory + rules) — makes core editing satisfying
4. Batch 1 (Front Desk upgrade) — command center
5. Batch 5 (run detail + templates + list) — depth
6. Batch 6 (onboarding + trust + state coverage) — polish

This is roughly 6 implementation sessions. Shall I start with Batch 2?

