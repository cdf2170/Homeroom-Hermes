import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { schedules } from "../db/schema.js";
import type { Schedule } from "@homeroom/schemas";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";

type Row = typeof schedules.$inferSelect;

function rowToSchedule(row: Row): Schedule {
  return {
    id: row.id,
    agentId: row.agentId,
    enabled: row.enabled,
    preset: row.preset as Schedule["preset"],
    plainEnglish: row.plainEnglish,
    backendExpression: row.backendExpression ?? null,
    nextRunAt: row.nextRunAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createScheduleRepo(db: Db) {
  return {
    findByAgentId(agentId: string): Schedule | null {
      const row = db.select().from(schedules).where(eq(schedules.agentId, agentId)).get();
      return row ? rowToSchedule(row) : null;
    },

    upsert(
      agentId: string,
      data: {
        enabled: boolean;
        preset: Schedule["preset"];
        plainEnglish: string;
        backendExpression: string | null;
        timezone: string;
        nextRunAt: string | null;
      },
    ): Schedule {
      const existing = db.select().from(schedules).where(eq(schedules.agentId, agentId)).get();
      const ts = now();

      if (existing) {
        db.update(schedules).set({ ...data, updatedAt: ts }).where(eq(schedules.agentId, agentId)).run();
      } else {
        db.insert(schedules).values({ id: newId(), agentId, ...data, createdAt: ts, updatedAt: ts }).run();
      }

      return this.findByAgentId(agentId)!;
    },

    /** Find all enabled schedules with a cron expression. */
    findEnabled(): Schedule[] {
      return db.select().from(schedules)
        .where(eq(schedules.enabled, true))
        .all()
        .filter(row => row.backendExpression)
        .map(rowToSchedule);
    },

    /** Update the nextRunAt timestamp for a schedule. */
    updateNextRunAt(agentId: string, nextRunAt: string): void {
      db.update(schedules).set({ nextRunAt, updatedAt: now() }).where(eq(schedules.agentId, agentId)).run();
    },

    deleteByAgentId(agentId: string): void {
      db.delete(schedules).where(eq(schedules.agentId, agentId)).run();
    },
  };
}

export type ScheduleRepo = ReturnType<typeof createScheduleRepo>;
