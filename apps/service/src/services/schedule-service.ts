import type { ScheduleRepo } from "../repos/schedule-repo.js";
import type { AgentRepo } from "../repos/agent-repo.js";
import type { UpdateScheduleRequest } from "@homeroom/contracts";
import type { Schedule } from "@homeroom/schemas";

const PRESET_CRON: Record<string, string | null> = {
  manual_only: null,
  every_hour: "0 * * * *",
  every_4_hours: "0 */4 * * *",
  twice_daily: "0 9,21 * * *",
  daily: "0 9 * * *",
  weekdays: "0 9 * * 1-5",
  custom: null,
};

const PRESET_PLAIN: Record<string, string> = {
  manual_only: "Manual only",
  every_hour: "Every hour",
  every_4_hours: "Every 4 hours",
  twice_daily: "Twice daily (9 AM & 9 PM)",
  daily: "Daily at 9 AM",
  weekdays: "Weekdays at 9 AM",
  custom: "Custom schedule",
};

export function createScheduleService(scheduleRepo: ScheduleRepo, agentRepo: AgentRepo) {
  return {
    getForAgent(agentId: string): Schedule | null {
      agentRepo.findById(agentId); // throws if not found
      return scheduleRepo.findByAgentId(agentId);
    },

    upsert(agentId: string, req: UpdateScheduleRequest): Schedule {
      agentRepo.findById(agentId); // throws if not found
      const cron = req.preset === "custom" ? req.customCronExpression : PRESET_CRON[req.preset];
      const plain = PRESET_PLAIN[req.preset] ?? "Custom";

      const schedule = scheduleRepo.upsert(agentId, {
        enabled: req.enabled,
        preset: req.preset,
        plainEnglish: plain,
        backendExpression: cron ?? null,
        timezone: req.timezone,
        nextRunAt: null, // TODO(phase-3): derive from adapter scheduler
      });

      // Sync the summary back onto the agent row
      agentRepo.update(agentId, { scheduleSummary: schedule.enabled ? plain : null });

      return schedule;
    },
  };
}

export type ScheduleService = ReturnType<typeof createScheduleService>;
