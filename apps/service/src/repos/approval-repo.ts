/**
 * approval-repo.ts
 *
 * Approval gates. A run is held in `awaiting_approval` until an associated
 * approval row resolves, at which point the run either proceeds (approve)
 * or is cancelled (deny).
 *
 * Kinds and what they mean in this codebase today:
 *
 *   pre_dispatch -- real. Fires before the adapter is invoked. Wired for
 *                   autonomous triggers (schedule / background / event)
 *                   when the agent's requiresApprovalFor includes one of
 *                   "schedule" | "background" | "autonomous".
 *
 *   send         -- reserved for mid-run approval of outbound actions
 *                   (e.g., sending an email). NOT YET ENFORCED. The backend
 *                   does not intercept outbound tool calls today. Kept in
 *                   the schema so existing DB rows remain valid and so the
 *                   contract does not need to break when we wire this.
 *
 *   network      -- reserved for mid-run approval of a network request.
 *                   NOT YET ENFORCED. Same reasoning as `send`.
 *
 * See apps/service/src/services/run-service.ts:shouldGate for the only
 * gate that actually fires at dispatch.
 */

import { eq, desc, isNull, and } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { approvals } from "../db/schema.js";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";
import { NotFoundError } from "../lib/errors.js";

/** All kinds the schema accepts. Only `pre_dispatch` is enforced today. */
export type ApprovalKind = "pre_dispatch" | "send" | "network";

/** Kinds that actually gate a run at this moment. */
export const ENFORCED_APPROVAL_KINDS: readonly ApprovalKind[] = ["pre_dispatch"] as const;

export type ApprovalResolution = "approve" | "deny" | null;

export type ApprovalPreview =
  | { kind: "text"; body: string }
  | { kind: "structured"; fields: Record<string, string> }
  | { kind: "diff"; before: string; after: string };

export interface Approval {
  id: string;
  runId: string;
  agentId: string;
  kind: ApprovalKind;
  reason: string;
  preview: ApprovalPreview | null;
  createdAt: string;
  resolvedAt: string | null;
  resolution: ApprovalResolution;
}

export function createApprovalRepo(db: Db) {
  return {
    findById(id: string): Approval {
      const row = db.select().from(approvals).where(eq(approvals.id, id)).get();
      if (!row) throw new NotFoundError(`Approval(${id})`);
      return rowToApproval(row);
    },

    findByRunId(runId: string): Approval | null {
      const row = db.select().from(approvals).where(eq(approvals.runId, runId)).get();
      return row ? rowToApproval(row) : null;
    },

    listPending(): Approval[] {
      return db
        .select()
        .from(approvals)
        .where(isNull(approvals.resolution))
        .orderBy(desc(approvals.createdAt))
        .all()
        .map(rowToApproval);
    },

    listForAgent(agentId: string): Approval[] {
      return db
        .select()
        .from(approvals)
        .where(eq(approvals.agentId, agentId))
        .orderBy(desc(approvals.createdAt))
        .all()
        .map(rowToApproval);
    },

    insert(data: {
      runId: string;
      agentId: string;
      kind: ApprovalKind;
      reason: string;
      preview: ApprovalPreview | null;
    }): Approval {
      const id = newId();
      const createdAt = now();
      db.insert(approvals)
        .values({
          id,
          runId: data.runId,
          agentId: data.agentId,
          kind: data.kind,
          reason: data.reason,
          preview: data.preview ? JSON.stringify(data.preview) : null,
          createdAt,
          resolvedAt: null,
          resolution: null,
        })
        .run();
      return this.findById(id);
    },

    resolve(id: string, resolution: "approve" | "deny"): Approval {
      this.findById(id); // throws if not found
      db.update(approvals)
        .set({ resolution, resolvedAt: now() })
        .where(and(eq(approvals.id, id), isNull(approvals.resolution)))
        .run();
      return this.findById(id);
    },
  };
}

function rowToApproval(row: typeof approvals.$inferSelect): Approval {
  return {
    id: row.id,
    runId: row.runId,
    agentId: row.agentId,
    kind: row.kind as ApprovalKind,
    reason: row.reason,
    preview: row.preview ? (safeParse(row.preview) as ApprovalPreview) : null,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    resolution: (row.resolution as ApprovalResolution) ?? null,
  };
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); }
  catch { return null; }
}

export type ApprovalRepo = ReturnType<typeof createApprovalRepo>;
