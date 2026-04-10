import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { ruleItems } from "../db/schema.js";
import type { RuleItem } from "@homeroom/domain";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";
import { NotFoundError } from "../lib/errors.js";

type Row = typeof ruleItems.$inferSelect;

function rowToItem(row: Row): RuleItem {
  return {
    id: row.id,
    agentId: row.agentId,
    content: row.content,
    priority: row.priority,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createRuleRepo(db: Db) {
  return {
    findByAgentId(agentId: string): RuleItem[] {
      return db.select().from(ruleItems).where(eq(ruleItems.agentId, agentId)).all().map(rowToItem);
    },

    findById(id: string): RuleItem {
      const row = db.select().from(ruleItems).where(eq(ruleItems.id, id)).get();
      if (!row) throw new NotFoundError(`RuleItem(${id})`);
      return rowToItem(row);
    },

    insert(agentId: string, data: Omit<RuleItem, "id" | "agentId" | "createdAt" | "updatedAt">): RuleItem {
      const id = newId();
      const ts = now();
      db.insert(ruleItems).values({ id, agentId, ...data, createdAt: ts, updatedAt: ts }).run();
      return this.findById(id);
    },

    update(id: string, patch: Partial<Pick<RuleItem, "content" | "priority" | "enabled">>): RuleItem {
      this.findById(id);
      db.update(ruleItems).set({ ...patch, updatedAt: now() }).where(eq(ruleItems.id, id)).run();
      return this.findById(id);
    },

    delete(id: string): void {
      this.findById(id);
      db.delete(ruleItems).where(eq(ruleItems.id, id)).run();
    },

    deleteByAgentId(agentId: string): void {
      db.delete(ruleItems).where(eq(ruleItems.agentId, agentId)).run();
    },
  };
}

export type RuleRepo = ReturnType<typeof createRuleRepo>;
