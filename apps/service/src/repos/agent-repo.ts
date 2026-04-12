import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { agents } from "../db/schema.js";
import type { AgentProfile } from "@homeroom/domain";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";
import { NotFoundError } from "../lib/errors.js";

type AgentRow = typeof agents.$inferSelect;

function rowToProfile(row: AgentRow): AgentProfile {
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    archetype: row.archetype as AgentProfile["archetype"],
    vibe: row.vibe as AgentProfile["vibe"],
    smartnessLevel: row.smartnessLevel as AgentProfile["smartnessLevel"],
    runtimeMode: row.runtimeMode as AgentProfile["runtimeMode"],
    runtimePreference: row.runtimePreference as AgentProfile["runtimePreference"],
    enabled: row.enabled,
    backgroundEnabled: row.backgroundEnabled,
    status: row.status as AgentProfile["status"],
    sceneRoomId: row.sceneRoomId as AgentProfile["sceneRoomId"],
    sceneState: row.sceneState,
    lastRunAt: row.lastRunAt ?? null,
    lastRunStatus: (row.lastRunStatus as AgentProfile["lastRunStatus"]) ?? null,
    scheduleSummary: row.scheduleSummary ?? null,
    permissionProfileId: row.permissionProfileId ?? null,
    appearanceId: row.appearanceId ?? null,
    role: row.role,
    instructions: row.instructions,
    audienceNotes: row.audienceNotes,
    environmentNotes: row.environmentNotes,
    memoryNotes: row.memoryNotes,
    checkInFrequency: row.checkInFrequency as AgentProfile["checkInFrequency"],
    escalationBehavior: row.escalationBehavior as AgentProfile["escalationBehavior"],
    taskStyle: row.taskStyle as AgentProfile["taskStyle"],
    notifyOnComplete: row.notifyOnComplete,
    notifyOnError: row.notifyOnError,
    modelRef: row.modelRef ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createAgentRepo(db: Db) {
  return {
    findAll(): AgentProfile[] {
      return db.select().from(agents).all().map(rowToProfile);
    },

    findById(id: string): AgentProfile {
      const row = db.select().from(agents).where(eq(agents.id, id)).get();
      if (!row) throw new NotFoundError(`Agent(${id})`);
      return rowToProfile(row);
    },

    insert(data: Omit<AgentProfile, "id" | "createdAt" | "updatedAt">): AgentProfile {
      const id = newId();
      const ts = now();
      db.insert(agents)
        .values({
          id,
          ...data,
          runtimePreference: data.runtimePreference ?? null,
          lastRunAt: data.lastRunAt ?? null,
          lastRunStatus: data.lastRunStatus ?? null,
          scheduleSummary: data.scheduleSummary ?? null,
          permissionProfileId: data.permissionProfileId ?? null,
          appearanceId: data.appearanceId ?? null,
          createdAt: ts,
          updatedAt: ts,
        })
        .run();
      return this.findById(id);
    },

    update(id: string, patch: Partial<AgentProfile>): AgentProfile {
      this.findById(id); // throws if not found
      db.update(agents)
        .set({ ...patch, updatedAt: now() })
        .where(eq(agents.id, id))
        .run();
      return this.findById(id);
    },

    delete(id: string): void {
      this.findById(id); // throws if not found
      db.delete(agents).where(eq(agents.id, id)).run();
    },
  };
}

export type AgentRepo = ReturnType<typeof createAgentRepo>;
