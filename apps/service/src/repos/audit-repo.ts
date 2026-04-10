import { eq, and, desc } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { auditEvents } from "../db/schema.js";
import type { AuditEvent } from "@homeroom/schemas";
import { newId } from "../lib/ids.js";

type Row = typeof auditEvents.$inferSelect;

function rowToEvent(row: Row): AuditEvent {
  return {
    id: row.id,
    actor: row.actor,
    sourceMode: row.sourceMode as AuditEvent["sourceMode"],
    eventType: row.eventType as AuditEvent["eventType"],
    targetType: row.targetType as AuditEvent["targetType"],
    targetId: row.targetId,
    timestamp: row.timestamp,
    summary: row.summary,
    permissionContext: row.permissionContext ? JSON.parse(row.permissionContext) : null,
    runId: row.runId ?? null,
  };
}

export function createAuditRepo(db: Db) {
  return {
    append(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
      const id = newId();
      const timestamp = new Date().toISOString();
      db.insert(auditEvents)
        .values({
          id,
          ...event,
          timestamp,
          permissionContext: event.permissionContext
            ? JSON.stringify(event.permissionContext)
            : null,
          runId: event.runId ?? null,
        })
        .run();
      const row = db.select().from(auditEvents).where(eq(auditEvents.id, id)).get()!;
      return rowToEvent(row);
    },

    findByTarget(targetType: string, targetId: string, limit = 50): AuditEvent[] {
      return db
        .select()
        .from(auditEvents)
        .where(
          and(eq(auditEvents.targetType, targetType), eq(auditEvents.targetId, targetId)),
        )
        .orderBy(desc(auditEvents.timestamp))
        .limit(limit)
        .all()
        .map(rowToEvent);
    },

    findAll(limit = 100): AuditEvent[] {
      return db
        .select()
        .from(auditEvents)
        .orderBy(desc(auditEvents.timestamp))
        .limit(limit)
        .all()
        .map(rowToEvent);
    },
  };
}

export type AuditRepo = ReturnType<typeof createAuditRepo>;
