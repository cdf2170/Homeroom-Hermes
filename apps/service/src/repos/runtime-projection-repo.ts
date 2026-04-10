import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { runtimeProjections } from "../db/schema.js";
import type { RuntimeProjection } from "@homeroom/domain";

type Row = typeof runtimeProjections.$inferSelect;

function rowToProjection(row: Row): RuntimeProjection {
  return {
    agentId: row.agentId,
    backendRef: row.backendRef ?? null,
    modelRef: row.modelRef ?? null,
    providerRef: row.providerRef ?? null,
    state: row.state as RuntimeProjection["state"],
    currentRunId: row.currentRunId ?? null,
    schedulerState: row.schedulerState as RuntimeProjection["schedulerState"],
    workspacePath: row.workspacePath ?? null,
    lastSyncedAt: row.lastSyncedAt ?? null,
  };
}

export function createRuntimeProjectionRepo(db: Db) {
  return {
    findByAgentId(agentId: string): RuntimeProjection | null {
      const row = db.select().from(runtimeProjections).where(eq(runtimeProjections.agentId, agentId)).get();
      return row ? rowToProjection(row) : null;
    },

    upsert(agentId: string, patch: Partial<Omit<RuntimeProjection, "agentId">>): RuntimeProjection {
      const existing = db.select().from(runtimeProjections).where(eq(runtimeProjections.agentId, agentId)).get();
      if (existing) {
        db.update(runtimeProjections).set(patch).where(eq(runtimeProjections.agentId, agentId)).run();
      } else {
        db.insert(runtimeProjections).values({
          agentId,
          state: "unknown",
          schedulerState: "inactive",
          ...patch,
        }).run();
      }
      return this.findByAgentId(agentId)!;
    },

    deleteByAgentId(agentId: string): void {
      db.delete(runtimeProjections).where(eq(runtimeProjections.agentId, agentId)).run();
    },
  };
}

export type RuntimeProjectionRepo = ReturnType<typeof createRuntimeProjectionRepo>;
