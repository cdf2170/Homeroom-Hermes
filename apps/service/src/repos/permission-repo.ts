import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { permissionProfiles } from "../db/schema.js";
import type { PermissionProfile } from "@homeroom/schemas";
import { newId } from "../lib/ids.js";
import { now } from "../lib/time.js";

type Row = typeof permissionProfiles.$inferSelect;

function rowToProfile(row: Row): PermissionProfile {
  // Historical values for network_access_mode: 'none' | 'restricted' | 'open'.
  // Map to the v2 vocabulary: 'off' | 'limited' | 'open'.
  const rawMode = row.networkAccessMode ?? "none";
  const mode: PermissionProfile["networkAccessMode"] =
    rawMode === "none" ? "off"
    : rawMode === "restricted" ? "limited"
    : rawMode === "off" || rawMode === "limited" || rawMode === "open" ? rawMode
    : "off";

  return {
    id: row.id,
    agentId: row.agentId,
    safetyLevel: row.safetyLevel as PermissionProfile["safetyLevel"],
    toolScopes: JSON.parse(row.toolScopes) as string[],
    dataScopes: JSON.parse(row.dataScopes) as string[],
    networkAccess: row.networkAccess,
    networkAccessMode: mode,
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

      // Map v2 mode values to whatever the DB stores
      const modeForDb = data.networkAccessMode ? dbModeFor(data.networkAccessMode) : undefined;

      if (existing) {
        db.update(permissionProfiles)
          .set({
            ...data,
            toolScopes: data.toolScopes ? JSON.stringify(data.toolScopes) : existing.toolScopes,
            dataScopes: data.dataScopes ? JSON.stringify(data.dataScopes) : existing.dataScopes,
            requiresApprovalFor: data.requiresApprovalFor
              ? JSON.stringify(data.requiresApprovalFor)
              : existing.requiresApprovalFor,
            networkAccessMode: modeForDb ?? existing.networkAccessMode,
            // Keep the boolean in sync with the mode
            networkAccess: modeForDb ? modeForDb !== "off" : existing.networkAccess,
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
            networkAccess: modeForDb ? modeForDb !== "off" : (data.networkAccess ?? false),
            networkAccessMode: modeForDb ?? "off",
            // Only values this codebase actually enforces today:
            //   "schedule" | "background" | "autonomous" -- pre-dispatch gates
            //   for non-manual triggers. Any other string here is metadata
            //   only (displayed in the UI, exported in TOOLS.md, but not
            //   acted on at dispatch). Default empty: no implied enforcement.
            //
            // See ENFORCED_APPROVAL_KINDS and run-service.shouldGate.
            requiresApprovalFor: JSON.stringify(data.requiresApprovalFor ?? []),
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

/** Map v2 vocab ('off' | 'limited' | 'open') to whatever historical value the DB has stored. */
function dbModeFor(mode: "off" | "limited" | "open"): "off" | "limited" | "open" {
  // For now we store the v2 value directly; old rows with 'none'/'restricted'
  // are normalized on read by rowToProfile.
  return mode;
}
