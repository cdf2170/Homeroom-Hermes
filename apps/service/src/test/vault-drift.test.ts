import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createVaultService } from "../services/vault-service.js";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type { AgentProfile } from "@homeroom/domain";

const TEST_DIR = join("/tmp", `homeroom-vault-test-${Date.now()}`);

function makeProfile(overrides: Partial<AgentProfile> = {}): AgentProfile {
  return {
    id: randomUUID(),
    name: "TestAgent",
    role: "tester",
    purpose: "test",
    archetype: "helper",
    vibe: "calm",
    status: "idle",
    enabled: true,
    runtimeMode: "local",
    smartnessLevel: "standard",
    modelRef: null,
    instructions: "do stuff",
    audienceNotes: "",
    environmentNotes: "",
    memoryNotes: "",
    checkInFrequency: "daily",
    escalationBehavior: "pause-and-wait",
    taskStyle: "step-by-step",
    notifyOnComplete: true,
    notifyOnError: true,
    backgroundEnabled: false,
    ...overrides,
  } as AgentProfile;
}

describe("Vault drift detection", () => {
  let vault: ReturnType<typeof createVaultService>;

  beforeEach(() => {
    vault = createVaultService(TEST_DIR);
  });

  afterEach(() => {
    try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch {}
  });

  it("reports 'not-written' when vault files don't exist", () => {
    const profile = makeProfile();
    const expectedHash = vault.computeHash(profile, [], [], null, null, []);
    const drift = vault.getDriftStatus(profile.name, profile.id, expectedHash);
    expect(drift.status).toBe("not-written");
    expect(drift.diskHash).toBeNull();
  });

  it("reports 'in-sync' after writing and no changes", () => {
    const profile = makeProfile();
    vault.syncAgent(profile, [], [], null, null, []);
    const expectedHash = vault.computeHash(profile, [], [], null, null, []);
    const drift = vault.getDriftStatus(profile.name, profile.id, expectedHash);
    expect(drift.status).toBe("in-sync");
    expect(drift.diskHash).toBe(drift.expectedHash);
  });

  it("reports 'backend-ahead' when backend state changes but files unchanged", () => {
    const profile = makeProfile();
    vault.syncAgent(profile, [], [], null, null, []);

    // Compute a new expected hash with changed state (different instructions)
    const updated = { ...profile, instructions: "updated instructions" } as AgentProfile;
    const newExpectedHash = vault.computeHash(updated, [], [], null, null, []);
    const drift = vault.getDriftStatus(profile.name, profile.id, newExpectedHash);
    expect(drift.status).toBe("backend-ahead");
  });

  it("reports 'disk-modified' when on-disk files are edited manually", () => {
    const profile = makeProfile();
    vault.syncAgent(profile, [], [], null, null, []);

    // Manually modify a file on disk
    const slug = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const agentMdPath = join(TEST_DIR, "Agents", slug, "AGENT.md");
    writeFileSync(agentMdPath, "# Modified externally\n", "utf8");

    const expectedHash = vault.computeHash(profile, [], [], null, null, []);
    const drift = vault.getDriftStatus(profile.name, profile.id, expectedHash);
    expect(drift.status).toBe("disk-modified");
    expect(drift.diskHash).not.toBe(drift.lastWrittenHash);
  });

  it("reports 'diverged' when both backend and disk changed", () => {
    const profile = makeProfile();
    vault.syncAgent(profile, [], [], null, null, []);

    // Manually modify a file on disk
    const slug = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const agentMdPath = join(TEST_DIR, "Agents", slug, "AGENT.md");
    writeFileSync(agentMdPath, "# Modified externally\n", "utf8");

    // Also change backend state
    const updated = { ...profile, instructions: "different now" } as AgentProfile;
    const newExpectedHash = vault.computeHash(updated, [], [], null, null, []);
    const drift = vault.getDriftStatus(profile.name, profile.id, newExpectedHash);
    expect(drift.status).toBe("diverged");
  });

  it("readDiskHash returns null when files are missing", () => {
    const profile = makeProfile();
    const hash = vault.readDiskHash(profile.name, profile.id);
    expect(hash).toBeNull();
  });

  it("readDiskHash returns matching hash after sync", () => {
    const profile = makeProfile();
    vault.syncAgent(profile, [], [], null, null, []);
    const diskHash = vault.readDiskHash(profile.name, profile.id);
    const expectedHash = vault.computeHash(profile, [], [], null, null, []);
    expect(diskHash).toBe(expectedHash);
  });
});
