/**
 * run-step-repo.ts
 *
 * Step-level trace of a run. Each step is thought | tool_call | tool_result |
 * message | error with a monotonic seq within the run. Rendered in the
 * Run Trajectory view.
 */

import { eq, asc } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { runSteps } from "../db/schema.js";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";

export type RunStepKind = "thought" | "tool_call" | "tool_result" | "message" | "error";

export interface RunStep {
  id: string;
  runId: string;
  seq: number;
  kind: RunStepKind;
  content: string;
  createdAt: string;
}

export function createRunStepRepo(db: Db) {
  return {
    findByRunId(runId: string): RunStep[] {
      return db
        .select()
        .from(runSteps)
        .where(eq(runSteps.runId, runId))
        .orderBy(asc(runSteps.seq))
        .all()
        .map(rowToStep);
    },

    append(runId: string, kind: RunStepKind, content: string): RunStep {
      const existing = this.findByRunId(runId);
      const nextSeq = existing.length > 0 ? existing[existing.length - 1]!.seq + 1 : 1;
      const id = newId();
      const createdAt = now();
      db.insert(runSteps).values({ id, runId, seq: nextSeq, kind, content, createdAt }).run();
      return { id, runId, seq: nextSeq, kind, content, createdAt };
    },

    deleteByRunId(runId: string): void {
      db.delete(runSteps).where(eq(runSteps.runId, runId)).run();
    },
  };
}

function rowToStep(row: typeof runSteps.$inferSelect): RunStep {
  return {
    id: row.id,
    runId: row.runId,
    seq: row.seq,
    kind: row.kind as RunStepKind,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export type RunStepRepo = ReturnType<typeof createRunStepRepo>;
