

# Homeroom Plugins / Connections — Implementation Plan

Build a full Plugins page with browsable cards, detail drawers, and setup flows — styled to feel like inviting tools into your office, not configuring integrations.

---

## New Files

### 1. `src/data/plugins.ts` — Plugin content data

Contains all 15 plugins as a typed array with fields: id, name, category, description, agentCapabilities, accessDescription, type (local/cloud), safetyLabel (Safe/Review recommended/Advanced), setupMethod, docsUrl, setupGuideLabel, onboardingMicrocopy, icon (lucide icon name). Also exports category groupings, beginner-safe list, and advanced list.

### 2. `src/types/plugin.ts` — Plugin types

```text
PluginSafetyLabel = 'Safe' | 'Review recommended' | 'Advanced'
PluginType = 'local' | 'cloud' | 'local-or-cloud'
PluginSetupMethod = 'api-key' | 'oauth' | 'local-connection' | 'bot-token' | 'built-in' | 'oauth-or-token'
PluginCategory = 'Models / AI Providers' | 'Productivity' | 'Communication' | 'Developer Tools' | 'Files & Storage' | 'Home / Automation' | 'Research' | 'Core System'

interface Plugin {
  id, name, category, description, agentCapabilities, accessDescription,
  type, safetyLabel, setupMethod, docsUrl, setupGuideLabel, onboardingMicrocopy, icon
}

interface PluginConnection {
  pluginId, status: 'connected' | 'disconnected', connectedAt?, config?
}
```

### 3. `src/pages/PluginsPage.tsx` — Main plugins page

**Layout:**
- Hero section: "Plugins & Connections" with subtitle "Invite useful tools into your office"
- "Most people start with..." row highlighting 4 beginner-safe plugins (OpenClaw, Local Files, Google Calendar, OpenRouter) with a green "Recommended" badge
- Category-grouped grid of plugin cards
- Filter bar: All / Connected / Local / Cloud
- Search input

**Plugin card design:**
- Icon + name + one-sentence description
- Safety badge: green (Safe), amber (Review recommended), red (Advanced)
- Local/Cloud pill badge
- Setup method hint (e.g., "API key" / "Sign in with Google")
- Connected status indicator if connected
- Click opens detail drawer

### 4. `src/components/plugins/PluginDetailDrawer.tsx` — Detail sheet

Uses the existing Sheet component. Contains:
- Plugin icon + name + category
- Safety badge (colored)
- Description paragraph
- "What agents can do with this" section (card with capability text)
- "What access this gives" section (card with access text, read vs write called out)
- Local vs Cloud explainer inline ("Local: runs on your machine, fully private" / "Cloud: sends data to an online service")
- Setup method explained in plain English:
  - API key: "You'll paste a key from [Provider]. It's stored locally on your device."
  - OAuth: "You'll sign in with your [Provider] account. Homeroom only gets the access you approve."
  - Local connection: "Connects to software already running on your machine."
  - Bot token: "You'll create a bot in [Provider] and paste its token here."
  - Built-in: "This works out of the box — no setup needed."
- "Official docs" link (external, with ExternalLink icon)
- Onboarding microcopy paragraph
- Setup / Connect button (opens setup flow)
- If connected: status indicator, disconnect button

### 5. `src/components/plugins/PluginSetupFlow.tsx` — Setup flow component

Inline setup within the drawer (not a separate page):
- API key method: masked input field + "Where do I find this?" link to docs + Save button
- OAuth method: "Sign in with [Provider]" button (mock/placeholder) + scope explanation
- Local connection: "Connect to [runtime]" button + status check indicator
- Bot token: input + docs link
- Built-in: "Already enabled" confirmation

All flows show: "Stored locally on your device" trust language for API keys, "You control what access to give" for OAuth.

---

## Modified Files

### 6. `src/App.tsx`
- Add route: `/plugins` -> `PluginsPage`

### 7. `src/components/AppSidebar.tsx`
- Add nav item: Plug icon, "Plugins", `/plugins` — placed between Templates and Settings

---

## Design Details

**Safety badge colors** (reuse existing status token patterns):
- Safe: `bg-status-working/15 text-status-working` (green)
- Review recommended: `bg-status-waiting/15 text-status-waiting` (amber)
- Advanced: `bg-destructive/15 text-destructive` (red)

**Card hover:** subtle border-primary/40 + shadow, matching TemplatesPage pattern

**Empty connected state:** "No plugins connected yet — start with one of our recommendations above"

**Trust language sprinkled throughout:**
- "Keys are stored locally on your device"
- "Your data stays on your machine"
- "Approval required before agents can act"
- "Read-only unless you allow writing"

---

## File Summary

| File | Action |
|------|--------|
| `src/types/plugin.ts` | Create |
| `src/data/plugins.ts` | Create |
| `src/pages/PluginsPage.tsx` | Create |
| `src/components/plugins/PluginDetailDrawer.tsx` | Create |
| `src/components/plugins/PluginSetupFlow.tsx` | Create |
| `src/App.tsx` | Add route |
| `src/components/AppSidebar.tsx` | Add nav item |

