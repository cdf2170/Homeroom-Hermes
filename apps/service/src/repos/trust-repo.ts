import { eq, and } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { trustFindings } from "../db/schema.js";
import type { TrustFinding } from "@homeroom/domain";

type Row = typeof trustFindings.$inferSelect;

function rowToFinding(row: Row): TrustFinding {
  return {
    id: row.id,
    scope: row.scope as TrustFinding["scope"],
    targetId: row.targetId ?? null,
    level: row.level as TrustFinding["level"],
    code: row.code,
    title: row.title,
    detail: row.detail,
    recommendedAction: row.recommendedAction,
    createdAt: row.createdAt,
  };
}

export function createTrustRepo(db: Db) {
  return {
    findAll(): TrustFinding[] {
      return db.select().from(trustFindings).all().map(rowToFinding);
    },

    findByTarget(scope: string, targetId: string): TrustFinding[] {
      return db
        .select()
        .from(trustFindings)
        .where(and(eq(trustFindings.scope, scope), eq(trustFindings.targetId, targetId)))
        .all()
        .map(rowToFinding);
    },

    /** Replace all findings for a (scope, targetId) pair atomically. */
    replaceForTarget(scope: string, targetId: string | null, findings: Omit<TrustFinding, "createdAt">[]): TrustFinding[] {
      if (targetId) {
        db.delete(trustFindings)
          .where(and(eq(trustFindings.scope, scope), eq(trustFindings.targetId, targetId)))
          .run();
      } else {
        db.delete(trustFindings).where(eq(trustFindings.scope, scope)).run();
      }
      if (findings.length === 0) return [];
      const ts = new Date().toISOString();
      for (const f of findings) {
        db.insert(trustFindings).values({ ...f, targetId: targetId ?? null, createdAt: ts }).run();
      }
      return targetId
        ? this.findByTarget(scope, targetId)
        : db.select().from(trustFindings).where(eq(trustFindings.scope, scope)).all().map(rowToFinding);
    },

    deleteByAgentId(agentId: string): void {
      db.delete(trustFindings)
        .where(and(eq(trustFindings.scope, "agent"), eq(trustFindings.targetId, agentId)))
        .run();
    },
  };
}

export type TrustRepo = ReturnType<typeof createTrustRepo>;
