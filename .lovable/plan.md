

# Homeroom Frontend — Full Build Plan

The frontend (`apps/web`) does not exist yet. There are zero `.tsx` files in this repo. The backend API and all shared type packages (schemas, domain, contracts) are fully built. This plan creates the entire React frontend from scratch, following the user's refinement priorities.

---

## Architecture

- **Framework**: React 18 + Vite 5 + TypeScript + Tailwind CSS v3
- **Routing**: React Router v6
- **State**: Zustand for global state (agents, settings, connections)
- **API layer**: Thin fetch wrapper consuming the existing Fastify endpoints (`/api/agents`, `/api/frontdesk/summary`, `/api/trust/findings`, `/api/settings`, `/api/audit`, `/api/runtime/health`, `/api/events/stream`)
- **UI components**: shadcn/ui (already in tailwind config tokens)
- **Mock mode**: All API calls go through a service layer that can return mock data when the backend is unreachable, so the UI works standalone in preview

---

## Execution Order (8 phases)

### Phase 1: App Shell + Navigation

**Files created:**
- `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/index.html`
- `src/main.tsx`, `src/App.tsx`
- `src/components/ui/` — shadcn primitives (button, card, input, sheet, badge, tooltip, sidebar, dialog, select, switch, tabs, separator, progress, skeleton)
- `src/components/NavLink.tsx`
- `src/components/AppSidebar.tsx` — expanded labels by default, collapsible to icons. Nav: Home, Create Agent (primary CTA), Agents, Live Office, Activity, Safety, Connections, Settings. Badge dots for attention states.
- `src/components/AppLayout.tsx` — SidebarProvider + main content area + SidebarTrigger in header

**Fix:** Remove `packages/scene`, `packages/ui`, `apps/web` from root `tsconfig.json` references (they don't exist yet; `apps/web` will be re-added after creation)

### Phase 2: API Layer + Mock Data + Store

**Files created:**
- `src/services/api.ts` — fetch wrapper with base URL config
- `src/services/mock-data.ts` — realistic mock agents, runs, findings, settings matching backend contract types
- `src/services/agent-service.ts` — CRUD + runs + schedule + trust
- `src/services/frontdesk-service.ts` — summary endpoint
- `src/services/settings-service.ts` — settings + providers
- `src/services/trust-service.ts` — findings
- `src/services/audit-service.ts` — audit log
- `src/store/agent-store.ts` — Zustand store for agents list, selected agent, connection status
- `src/store/onboarding-store.ts` — localStorage-backed onboarding state (`homeroom_onboarding_v1_complete`)
- `src/types/` — re-export or mirror contract types for frontend use, plus Plugin types and PluginConnection

### Phase 3: Onboarding Flow (once-only)

**Files created:**
- `src/components/OnboardingFlow.tsx` — 5-step modal dialog:
  1. Welcome to Homeroom (warm intro, office metaphor)
  2. What are agents? (plain language)
  3. Local vs Cloud (two-column comparison)
  4. Safe defaults (reassurance)
  5. Create your first agent (CTA)
- Progress dots, "Skip for now", "Show me around later"
- Gated by `homeroom_onboarding_v1_complete` in localStorage
- Returning users go straight to Home

### Phase 4: Home Page (Front Desk)

**Files created:**
- `src/pages/HomePage.tsx` — the daily landing page with:
  - Conversational greeting banner
  - Setup checklist (for new users, localStorage-tracked): Connect OpenClaw, Set up models, Review safety, Create first agent, Run a test task
  - "What needs attention" cards (agents with warnings, agents never run)
  - "What's happening" section (active agents, recent runs)
  - "Suggested next actions" contextual buttons
  - Quick stats row (agent count, active, last run)

### Phase 5: Create Agent Flow

**Files created:**
- `src/pages/CreateAgentPage.tsx` — stepped wizard:
  1. Name + Purpose (2 fields, with small character preview placeholder showing what the agent will look like)
  2. Role/template (cards with outcome descriptions: "Research Assistant — Finds sources, compares options, summarizes clearly")
  3. Intelligence + Runtime (SmartLevel with "Recommended" badge on standard, RuntimeMode with plain Local/Cloud explainer)
  4. Safe defaults (background toggle, approval toggle, plain-English explanations)
  5. Success screen with next steps: Run test task, Add memory, Add rules, Customize appearance, Open profile
- `src/components/agent/AvatarPreview.tsx` — small character preview (SVG sprite based on archetype/vibe defaults)

### Phase 6: Agent List + Agent Profile

**Files created:**
- `src/pages/AgentsPage.tsx` — grid of agent cards with: avatar, name, status badge, trust posture, last run. Filter bar (All/Background/Cloud/Needs attention). Sort dropdown. Inline enable/disable toggle and "Run now" button.
- `src/pages/AgentProfilePage.tsx` — the centerpiece screen:
  - Header: avatar (right side), name, purpose, status
  - Persistent summary strip: local/cloud, manual/background, trust level, internet access, approval status, last run, next scheduled run
  - 9-section tabbed navigation: Overview, Instructions, Personality, Memory, Rules, Tools, Schedule, Activity, Advanced
  - Section-specific components with rich empty states, microcopy, helper text
- `src/components/agent/SafetySummaryStrip.tsx`
- `src/components/agent/MemorySection.tsx` — cards with category icons, pinning, quick-add chips
- `src/components/agent/RulesSection.tsx` — cards with priority labels, enable/disable, ordering
- `src/components/agent/ActivitySection.tsx` — run timeline with detail drawer
- `src/components/agent/RunDetailDrawer.tsx` — Sheet showing input, output, status, duration, trigger, blocked/redacted info, retry
- `src/components/agent/PersonalitySection.tsx` — appearance customization (archetype, vibe, sprite config)
- `src/components/agent/ToolsSection.tsx` — permission profile display with empty state
- `src/components/agent/ScheduleSection.tsx` — schedule presets with plain-English labels
- `src/components/agent/InstructionsSection.tsx`
- `src/components/agent/AdvancedSection.tsx` — with "Most people won't need this" note

### Phase 7: Safety + Office + Activity + Connections + Settings

**Files created:**
- `src/pages/SafetyPage.tsx` — renamed from Trust Center. Overall posture badge ("All Clear" / "Needs Review" / "At Risk"). Per-agent safety cards with recommendations. Careful language: "Based on your current settings", "No issues detected in Homeroom"
- `src/pages/OfficePage.tsx` — isometric/grid office view with rooms, agent sprites by room assignment. Room legend overlay. Quick actions: Create Agent, Review flagged, Open Safety
- `src/pages/ActivityPage.tsx` — global audit log timeline with filters
- `src/pages/ConnectionsPage.tsx` — plugin library with 15 plugins (OpenClaw, OpenRouter, OpenAI, Anthropic, Google Calendar, Gmail, Slack, Discord, Telegram, GitHub, Notion, Google Drive, Local Files, Home Assistant, Web Browser). Detail drawer + setup flows. Safety badges. "Most people start with..." recommendations
- `src/pages/SettingsPage.tsx` — OpenClaw connection status, runtime status, model setup, provider key management (masked), test connection buttons, safety defaults, background defaults
- `src/data/plugins.ts` — plugin content data
- `src/types/plugin.ts` — plugin types
- `src/components/plugins/PluginDetailDrawer.tsx`
- `src/components/plugins/PluginSetupFlow.tsx`

### Phase 8: State Coverage + Microcopy Pass

- Loading skeletons on all data-fetching pages
- Error boundaries with retry
- Empty states following pattern: explain + suggest + reassure
- Unsaved changes indicator on editable fields
- Destructive confirmation dialog for agent deletion
- All labels audited for beginner-friendliness
- "What does this mean?" tooltips on complex settings

---

## Files Summary

| Location | Count | Description |
|----------|-------|-------------|
| `apps/web/` config | 4 | package.json, tsconfig, vite config, index.html |
| `src/` entry | 2 | main.tsx, App.tsx |
| `src/components/ui/` | ~15 | shadcn primitives |
| `src/components/` | ~15 | AppSidebar, AppLayout, NavLink, OnboardingFlow, agent sections, plugin components |
| `src/pages/` | 8 | Home, CreateAgent, Agents, AgentProfile, Safety, Office, Activity, Connections, Settings |
| `src/services/` | 6 | API wrapper, mock data, domain services |
| `src/store/` | 2 | Zustand stores |
| `src/types/` | 2 | Plugin types, frontend type helpers |
| `src/data/` | 1 | Plugin content data |
| Root | 1 | tsconfig.json fix |

---

## Key Design Decisions

- **Mock-first**: UI works immediately in preview with realistic mock data; real API calls activate when backend is reachable
- **HomePage stays HomePage**: Front Desk is a section within it, not a rename
- **Character preview in create flow**: Small avatar preview visible during creation, but deep customization deferred to profile
- **Onboarding versioned key**: `homeroom_onboarding_v1_complete` so future onboarding updates don't re-trigger for existing users
- **Safety language is careful**: "Based on your current settings", "Review recommended", "No issues detected in Homeroom" — no overclaiming
- **Hierarchy is clear**: Home = what's going on, Create = first win, Profile = shape behavior, Safety = am I okay, Office = alive visualization

