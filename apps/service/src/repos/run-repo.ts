import { eq, desc } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { runs } from "../db/schema.js";
import type { RunRecord } from "@homeroom/schemas";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";
import { NotFoundError } from "../lib/errors.js";

type Row = typeof runs.$inferSelect;

function rowToRecord(row: Row): RunRecord {
  return {
    id: row.id,
    agentId: row.agentId,
    trigger: row.trigger as RunRecord["trigger"],
    status: row.status as RunRecord["status"],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt ?? null,
    inputSummary: row.inputSummary,
    outputSummary: row.outputSummary,
    errorSummary: row.errorSummary ?? null,
    backendRef: row.backendRef ?? null,
  };
}

export function createRunRepo(db: Db) {
  return {
    findById(id: string): RunRecord {
      const row = db.select().from(runs).where(eq(runs.id, id)).get();
      if (!row) throw new NotFoundError(`Run(${id})`);
      return rowToRecord(row);
    },

    findByBackendRef(backendRef: string): RunRecord | null {
      const row = db.select().from(runs).where(eq(runs.backendRef, backendRef)).get();
      return row ? rowToRecord(row) : null;
    },

    findByAgentId(agentId: string, limit = 50): RunRecord[] {
      return db
        .select()
        .from(runs)
        .where(eq(runs.agentId, agentId))
        .orderBy(desc(runs.startedAt))
        .limit(limit)
        .all()
        .map(rowToRecord);
    },

    insert(data: Omit<RunRecord, "id" | "startedAt">): RunRecord {
      const id = newId();
      const ts = now();
      db.insert(runs)
        .values({
          id,
          ...data,
          finishedAt: data.finishedAt ?? null,
          errorSummary: data.errorSummary ?? null,
          backendRef: data.backendRef ?? null,
          startedAt: ts,
        })
        .run();
      return this.findById(id);
    },

    update(id: string, patch: Partial<Pick<RunRecord, "status" | "finishedAt" | "outputSummary" | "errorSummary">>): RunRecord {
      this.findById(id);
      db.update(runs).set(patch).where(eq(runs.id, id)).run();
      return this.findById(id);
    },
  };
}

export type RunRepo = ReturnType<typeof createRunRepo>;
