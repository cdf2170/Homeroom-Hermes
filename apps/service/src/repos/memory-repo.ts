import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { memoryItems } from "../db/schema.js";
import type { MemoryItem } from "@homeroom/domain";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";
import { NotFoundError } from "../lib/errors.js";

type Row = typeof memoryItems.$inferSelect;

function rowToItem(row: Row): MemoryItem {
  return {
    id: row.id,
    agentId: row.agentId,
    content: row.content,
    category: row.category as MemoryItem["category"],
    pinned: row.pinned,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createMemoryRepo(db: Db) {
  return {
    findByAgentId(agentId: string): MemoryItem[] {
      return db.select().from(memoryItems).where(eq(memoryItems.agentId, agentId)).all().map(rowToItem);
    },

    findById(id: string): MemoryItem {
      const row = db.select().from(memoryItems).where(eq(memoryItems.id, id)).get();
      if (!row) throw new NotFoundError(`MemoryItem(${id})`);
      return rowToItem(row);
    },

    insert(agentId: string, data: Omit<MemoryItem, "id" | "agentId" | "createdAt" | "updatedAt">): MemoryItem {
      const id = newId();
      const ts = now();
      db.insert(memoryItems).values({ id, agentId, ...data, createdAt: ts, updatedAt: ts }).run();
      return this.findById(id);
    },

    update(id: string, patch: Partial<Pick<MemoryItem, "content" | "category" | "pinned">>): MemoryItem {
      this.findById(id);
      db.update(memoryItems).set({ ...patch, updatedAt: now() }).where(eq(memoryItems.id, id)).run();
      return this.findById(id);
    },

    delete(id: string): void {
      this.findById(id);
      db.delete(memoryItems).where(eq(memoryItems.id, id)).run();
    },

    deleteByAgentId(agentId: string): void {
      db.delete(memoryItems).where(eq(memoryItems.agentId, agentId)).run();
    },
  };
}

export type MemoryRepo = ReturnType<typeof createMemoryRepo>;
