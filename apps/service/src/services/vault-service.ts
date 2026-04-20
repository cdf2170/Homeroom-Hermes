/**
 * vault-service.ts
 *
 * Maintains a local Obsidian-compatible markdown vault that mirrors agent
 * configuration. Every agent gets a folder under <vaultRoot>/Agents/<slug>/
 * with one file per concern (AGENT.md, PROFILE.md, MEMORY.md, etc.).
 *
 * The backend is the single source of truth. The vault is a generated mirror,
 * not an authoritative write path. A hash + timestamp per agent tracks whether
 * the docs are in sync with backend state.
 */

import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { createHash } from "crypto";

import type { AgentProfile } from "@homeroom/domain";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemoryItem {
  id: string;
  content: string;
  category: string;
  pinned: boolean;
}

export interface RuleItem {
  id: string;
  content: string;
  priority: number | string;
  enabled: boolean;
}

export interface PermissionProfile {
  safetyLevel: string;
  networkAccess: boolean;
  networkAccessMode?: string;
  requiresApprovalFor: string[];
  backgroundAllowed: boolean;
  toolScopes: string[];
  dataScopes: string[];
}

export interface Schedule {
  enabled: boolean;
  preset?: string | null;
  plainEnglish?: string;
  backendExpression?: string | null;
  nextRunAt?: string | null;
}

export interface RunSummary {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  inputSummary: string;
  outputSummary?: string | null;
  errorSummary?: string | null;
}

interface SyncRecord {
  hash: string;
  syncedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function fmDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  } catch {
    return iso;
  }
}

// ── Markdown generators ───────────────────────────────────────────────────────

function renderAgentMd(p: AgentProfile): string {
  return `---
id: ${p.id}
name: ${p.name}
role: ${p.role ?? ""}
archetype: ${p.archetype ?? ""}
vibe: ${p.vibe ?? ""}
status: ${p.status ?? "offline"}
enabled: ${p.enabled}
runtime_mode: ${p.runtimeMode ?? ""}
smartness_level: ${p.smartnessLevel ?? ""}
model_ref: ${p.modelRef ?? ""}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# ${p.name}

**Role:** ${p.role ?? "—"}
**Purpose:** ${p.purpose ?? "—"}
**Archetype:** ${p.archetype ?? "—"}  **Vibe:** ${p.vibe ?? "—"}
**Runtime:** ${p.runtimeMode ?? "—"}  **Smartness:** ${p.smartnessLevel ?? "—"}
**Model:** ${p.modelRef ?? "default"}
**Status:** ${p.status ?? "offline"}  **Enabled:** ${p.enabled ? "yes" : "no"}
`;
}

function renderProfileMd(p: AgentProfile): string {
  return `---
agent_id: ${p.id}
agent_name: ${p.name}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Profile: ${p.name}

## Instructions

${p.instructions || "_No instructions set._"}

## Audience Notes

${p.audienceNotes || "_Not set._"}

## Environment Notes

${p.environmentNotes || "_Not set._"}

## Memory Notes

${p.memoryNotes || "_Not set._"}

## Behavior Settings

| Setting | Value |
|---------|-------|
| Check-in frequency | ${p.checkInFrequency ?? "—"} |
| Escalation behavior | ${p.escalationBehavior ?? "—"} |
| Task style | ${p.taskStyle ?? "—"} |
| Notify on complete | ${p.notifyOnComplete ? "yes" : "no"} |
| Notify on error | ${p.notifyOnError ? "yes" : "no"} |
| Background enabled | ${p.backgroundEnabled ? "yes" : "no"} |
`;
}

function renderMemoryMd(p: AgentProfile, items: MemoryItem[]): string {
  const rows = items.length === 0
    ? "_No memory items._"
    : items.map(m =>
        `- ${m.pinned ? "**[pinned]** " : ""}[${m.category}] ${m.content}`
      ).join("\n");

  return `---
agent_id: ${p.id}
agent_name: ${p.name}
item_count: ${items.length}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Memory: ${p.name}

${p.memoryNotes ? `> ${p.memoryNotes}\n\n` : ""}${rows}
`;
}

function renderRulesMd(p: AgentProfile, items: RuleItem[]): string {
  const rows = items.length === 0
    ? "_No rules set._"
    : items.map(r =>
        `- ${r.enabled ? "" : "~~"}[${r.priority}] ${r.content}${r.enabled ? "" : "~~"}`
      ).join("\n");

  return `---
agent_id: ${p.id}
agent_name: ${p.name}
rule_count: ${items.length}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Rules: ${p.name}

${rows}
`;
}

function renderScheduleMd(p: AgentProfile, schedule: Schedule | null): string {
  if (!schedule) {
    return `---
agent_id: ${p.id}
agent_name: ${p.name}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Schedule: ${p.name}

_No schedule configured._
`;
  }

  return `---
agent_id: ${p.id}
agent_name: ${p.name}
schedule_enabled: ${schedule.enabled}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Schedule: ${p.name}

| Field | Value |
|-------|-------|
| Enabled | ${schedule.enabled ? "yes" : "no"} |
| Preset | ${schedule.preset ?? "—"} |
| Description | ${schedule.plainEnglish ?? "—"} |
| Expression | ${schedule.backendExpression ?? "—"} |
| Next run | ${fmDate(schedule.nextRunAt)} |
`;
}

function renderToolsMd(p: AgentProfile, perm: PermissionProfile | null): string {
  if (!perm) {
    return `---
agent_id: ${p.id}
agent_name: ${p.name}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Tools & Permissions: ${p.name}

_No permission profile configured._
`;
  }

  const tools = perm.toolScopes?.length ? perm.toolScopes.map(t => `- ${t}`).join("\n") : "_None_";
  const data  = perm.dataScopes?.length  ? perm.dataScopes.map(d => `- ${d}`).join("\n")  : "_None_";
  const gates = perm.requiresApprovalFor?.length
    ? perm.requiresApprovalFor.map(g => `- ${g}`).join("\n")
    : "_None_";

  return `---
agent_id: ${p.id}
agent_name: ${p.name}
safety_level: ${perm.safetyLevel}
network_access: ${perm.networkAccess}
background_allowed: ${perm.backgroundAllowed}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Tools & Permissions: ${p.name}

**Safety level:** ${perm.safetyLevel}
**Network access:** ${perm.networkAccess ? "yes" : "no"}
**Background allowed:** ${perm.backgroundAllowed ? "yes" : "no"}

## Tool scopes

${tools}

## Data scopes

${data}

## Requires approval for

${gates}
`;
}

function renderRunsMd(p: AgentProfile, runs: RunSummary[]): string {
  const rows = runs.length === 0
    ? "_No runs yet._"
    : runs.slice(0, 20).map(r =>
        `| ${fmDate(r.startedAt)} | ${r.status} | ${r.trigger} | ${r.inputSummary.slice(0, 80)} |`
      ).join("\n");

  return `---
agent_id: ${p.id}
agent_name: ${p.name}
run_count: ${runs.length}
last_synced: ${new Date().toISOString().slice(0, 16)} UTC
---

# Runs: ${p.name}

${runs.length > 0 ? `| Started | Status | Trigger | Input |\n|---------|--------|---------|-------|\n${rows}` : "_No runs yet._"}
`;
}

// ── Service ───────────────────────────────────────────────────────────────────

export function createVaultService(vaultRoot: string) {
  const syncMap = new Map<string, SyncRecord>();
  const syncIndexPath = join(vaultRoot, ".sync-index.json");

  // Load persisted sync index on boot
  function loadSyncIndex() {
    try {
      if (existsSync(syncIndexPath)) {
        const data = JSON.parse(readFileSync(syncIndexPath, "utf8"));
        for (const [k, v] of Object.entries(data)) {
          syncMap.set(k, v as SyncRecord);
        }
      }
    } catch {
      // corrupt index — start fresh
    }
  }

  function saveSyncIndex() {
    const obj: Record<string, SyncRecord> = {};
    syncMap.forEach((v, k) => { obj[k] = v; });
    writeFileSync(syncIndexPath, JSON.stringify(obj, null, 2));
  }

  function agentDir(slug: string): string {
    return join(vaultRoot, "Agents", slug);
  }

  function write(dir: string, filename: string, content: string) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, filename), content, "utf8");
  }

  loadSyncIndex();

  // Ensure vault root and top-level README exist
  mkdirSync(join(vaultRoot, "Agents"), { recursive: true });
  if (!existsSync(join(vaultRoot, "README.md"))) {
    writeFileSync(join(vaultRoot, "README.md"),
      `# Homeroom Vault\n\nThis folder is auto-generated by the Homeroom backend.\nEach agent's configuration is mirrored here as Obsidian-compatible markdown.\n\nDo not edit these files manually — changes will be overwritten on the next sync.\n`
    );
  }

  return {
    vaultRoot,

    /** Write or update all markdown files for one agent. */
    syncAgent(
      profile: AgentProfile,
      memoryItems: MemoryItem[],
      ruleItems: RuleItem[],
      permissionProfile: PermissionProfile | null,
      schedule: Schedule | null,
      runs: RunSummary[] = [],
    ): void {
      const slug = slugify(profile.name) || profile.id;
      const dir  = agentDir(slug);

      const files: Record<string, string> = {
        "AGENT.md":    renderAgentMd(profile),
        "PROFILE.md":  renderProfileMd(profile),
        "MEMORY.md":   renderMemoryMd(profile, memoryItems),
        "RULES.md":    renderRulesMd(profile, ruleItems),
        "SCHEDULE.md": renderScheduleMd(profile, schedule),
        "TOOLS.md":    renderToolsMd(profile, permissionProfile),
        "RUNS.md":     renderRunsMd(profile, runs),
      };

      const combined = Object.values(files).join("\n");
      const currentHash = hash(combined);
      const existing = syncMap.get(profile.id);
      if (existing?.hash === currentHash) return; // nothing changed

      for (const [name, content] of Object.entries(files)) {
        write(dir, name, content);
      }

      syncMap.set(profile.id, { hash: currentHash, syncedAt: new Date().toISOString() });
      saveSyncIndex();
    },

    /** Remove a deleted agent's vault folder. */
    deleteAgent(agentId: string, agentName: string): void {
      const slug = slugify(agentName) || agentId;
      const dir  = agentDir(slug);
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch { /* ignore */ }
      syncMap.delete(agentId);
      saveSyncIndex();
    },

    /** Get sync status for a single agent. */
    getStatus(agentId: string): { synced: boolean; syncedAt: string | null; hash: string | null } {
      const rec = syncMap.get(agentId);
      return {
        synced:   !!rec,
        syncedAt: rec?.syncedAt ?? null,
        hash:     rec?.hash ?? null,
      };
    },

    /** Get sync status for all tracked agents. */
    getAllStatuses(): Record<string, { synced: boolean; syncedAt: string | null; hash: string | null }> {
      const result: Record<string, { synced: boolean; syncedAt: string | null; hash: string | null }> = {};
      syncMap.forEach((rec, id) => {
        result[id] = { synced: true, syncedAt: rec.syncedAt, hash: rec.hash };
      });
      return result;
    },

    /** Force-clear hash so the next syncAgent call will rewrite all files. */
    invalidate(agentId: string): void {
      syncMap.delete(agentId);
    },

    /** Compute expected hash from current backend state (without writing). */
    computeHash(
      profile: AgentProfile,
      memoryItems: MemoryItem[],
      ruleItems: RuleItem[],
      permissionProfile: PermissionProfile | null,
      schedule: Schedule | null,
      runs: RunSummary[] = [],
    ): string {
      const content = [
        renderAgentMd(profile),
        renderProfileMd(profile),
        renderMemoryMd(profile, memoryItems),
        renderRulesMd(profile, ruleItems),
        renderScheduleMd(profile, schedule),
        renderToolsMd(profile, permissionProfile),
        renderRunsMd(profile, runs),
      ].join("\n");
      return hash(content);
    },

    /**
     * Read the actual on-disk vault files for an agent and compute their hash.
     * Returns null if the vault folder or any expected file is missing.
     * This enables true drift detection: compare diskHash vs expectedHash
     * to see if someone edited the files manually.
     */
    readDiskHash(agentName: string, agentId: string): string | null {
      const slug = slugify(agentName) || agentId;
      const dir = agentDir(slug);
      const fileNames = [
        "AGENT.md", "PROFILE.md", "MEMORY.md", "RULES.md",
        "SCHEDULE.md", "TOOLS.md", "RUNS.md",
      ];
      try {
        const contents: string[] = [];
        for (const name of fileNames) {
          const filePath = join(dir, name);
          if (!existsSync(filePath)) return null; // missing file = not synced
          contents.push(readFileSync(filePath, "utf8"));
        }
        return hash(contents.join("\n"));
      } catch {
        return null;
      }
    },

    /**
     * Full drift report for an agent. Compares three states:
     * - lastWrittenHash: hash recorded when we last wrote the files
     * - expectedHash: hash of what the backend would generate right now
     * - diskHash: hash of what is actually on disk
     *
     * Status interpretation:
     * - "in-sync": all three match — files are up to date
     * - "backend-ahead": backend state changed but files haven't been rewritten yet
     * - "disk-modified": on-disk files were manually edited (disk != lastWritten)
     * - "not-written": vault folder doesn't exist for this agent yet
     * - "diverged": both backend state and disk files changed independently
     */
    getDriftStatus(
      agentName: string,
      agentId: string,
      expectedHash: string,
    ): {
      status: "in-sync" | "backend-ahead" | "disk-modified" | "not-written" | "diverged";
      lastWrittenHash: string | null;
      expectedHash: string;
      diskHash: string | null;
    } {
      const rec = syncMap.get(agentId);
      const lastWrittenHash = rec?.hash ?? null;
      const diskHash = this.readDiskHash(agentName, agentId);

      if (diskHash === null) {
        return { status: "not-written", lastWrittenHash, expectedHash, diskHash };
      }

      const backendChanged = lastWrittenHash !== expectedHash;
      const diskChanged = diskHash !== lastWrittenHash;

      let status: "in-sync" | "backend-ahead" | "disk-modified" | "diverged";
      if (!backendChanged && !diskChanged) {
        status = "in-sync";
      } else if (backendChanged && !diskChanged) {
        status = "backend-ahead";
      } else if (!backendChanged && diskChanged) {
        status = "disk-modified";
      } else {
        status = "diverged";
      }

      return { status, lastWrittenHash, expectedHash, diskHash };
    },
  };
}

export type VaultService = ReturnType<typeof createVaultService>;
