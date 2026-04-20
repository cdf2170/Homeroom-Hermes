/**
 * stream-event-repo.ts
 *
 * Durable append-only log of every StreamEvent emitted by the bus.
 * Used for SSE replay on reconnect and targeted gap recovery.
 */

import { eq, gt, desc, asc, and, lte } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { streamEvents } from "../db/schema.js";
import type { StreamEvent, EventType } from "../lib/event-bus.js";

export function createStreamEventRepo(db: Db) {
  return {
    /** Append an event. Sequence is set by the caller so the DB row matches the in-memory emission. */
    append(event: StreamEvent): void {
      db.insert(streamEvents)
        .values({
          sequence: event.sequence,
          type: event.type as string,
          createdAt: event.createdAt,
          payload: JSON.stringify(event.payload),
        })
        .run();
    },

    /** Get the highest sequence number currently persisted. Used on boot. */
    maxSequence(): number {
      const row = db
        .select({ sequence: streamEvents.sequence })
        .from(streamEvents)
        .orderBy(desc(streamEvents.sequence))
        .limit(1)
        .get();
      return row?.sequence ?? 0;
    },

    /** All events strictly after a given sequence, in order. For SSE replay. */
    findAfter(sequence: number, limit = 1000): StreamEvent[] {
      return db
        .select()
        .from(streamEvents)
        .where(gt(streamEvents.sequence, sequence))
        .orderBy(asc(streamEvents.sequence))
        .limit(limit)
        .all()
        .map(rowToEvent);
    },

    /** Events in an inclusive range. For targeted gap replay. */
    findRange(afterExclusive: number, throughInclusive: number): StreamEvent[] {
      return db
        .select()
        .from(streamEvents)
        .where(
          and(
            gt(streamEvents.sequence, afterExclusive),
            lte(streamEvents.sequence, throughInclusive),
          ),
        )
        .orderBy(asc(streamEvents.sequence))
        .all()
        .map(rowToEvent);
    },
  };
}

type Row = typeof streamEvents.$inferSelect;

function rowToEvent(row: Row): StreamEvent {
  return {
    sequence: row.sequence,
    type: row.type as EventType,
    createdAt: row.createdAt,
    payload: safeParse(row.payload),
  };
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); }
  catch { return null; }
}

export type StreamEventRepo = ReturnType<typeof createStreamEventRepo>;
