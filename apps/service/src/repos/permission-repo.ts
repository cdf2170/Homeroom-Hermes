import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { permissionProfiles } from "../db/schema.js";
import type { PermissionProfile } from "@homeroom/schemas";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";

type Row = typeof permissionProfiles.$inferSelect;

function rowToProfile(row: Row): PermissionProfile {
  return {
    id: row.id,
    agentId: row.agentId,
    safetyLevel: row.safetyLevel as PermissionProfile["safetyLevel"],
    toolScopes: JSON.parse(row.toolScopes) as string[],
    dataScopes: JSON.parse(row.dataScopes) as string[],
    networkAccess: row.networkAccess,
    requiresApprovalFor: JSON.parse(row.requiresApprovalFor) as string[],
    backgroundAllowed: row.backgroundAllowed,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPermissionRepo(db: Db) {
  return {
    findByAgentId(agentId: string): PermissionProfile | null {
      const row = db
        .select()
        .from(permissionProfiles)
        .where(eq(permissionProfiles.agentId, agentId))
        .get();
      return row ? rowToProfile(row) : null;
    },

    upsert(agentId: string, data: Partial<Omit<PermissionProfile, "id" | "agentId" | "createdAt" | "updatedAt">>): PermissionProfile {
      const existing = db
        .select()
        .from(permissionProfiles)
        .where(eq(permissionProfiles.agentId, agentId))
        .get();

      const ts = now();

      if (existing) {
        db.update(permissionProfiles)
          .set({
            ...data,
            toolScopes: data.toolScopes ? JSON.stringify(data.toolScopes) : existing.toolScopes,
            dataScopes: data.dataScopes ? JSON.stringify(data.dataScopes) : existing.dataScopes,
            requiresApprovalFor: data.requiresApprovalFor
              ? JSON.stringify(data.requiresApprovalFor)
              : existing.requiresApprovalFor,
            updatedAt: ts,
          })
          .where(eq(permissionProfiles.agentId, agentId))
          .run();
      } else {
        db.insert(permissionProfiles)
          .values({
            id: newId(),
            agentId,
            safetyLevel: data.safetyLevel ?? "strict",
            toolScopes: JSON.stringify(data.toolScopes ?? []),
            dataScopes: JSON.stringify(data.dataScopes ?? []),
            networkAccess: data.networkAccess ?? false,
            networkAccessMode: "none",
            requiresApprovalFor: JSON.stringify(
              data.requiresApprovalFor ?? ["file:write", "shell:exec"],
            ),
            backgroundAllowed: data.backgroundAllowed ?? false,
            createdAt: ts,
            updatedAt: ts,
          })
          .run();
      }

      return this.findByAgentId(agentId)!;
    },

    deleteByAgentId(agentId: string): void {
      db.delete(permissionProfiles).where(eq(permissionProfiles.agentId, agentId)).run();
    },
  };
}

export type PermissionRepo = ReturnType<typeof createPermissionRepo>;
