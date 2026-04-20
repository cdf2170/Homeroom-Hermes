/**
 * scheduler-service.ts
 *
 * Real cron-based scheduler that triggers agent runs on their configured schedules.
 * Uses node-cron for job registration and cron-parser for nextRunAt computation.
 *
 * Lifecycle:
 *   boot()     — load all enabled schedules, register cron jobs
 *   register() — create/replace a cron job for an agent
 *   unregister() — stop and remove a cron job
 *   shutdown()  — stop all jobs (called on SIGTERM/SIGINT)
 */

import cron, { type ScheduledTask } from "node-cron";
import { CronExpressionParser } from "cron-parser";
import type { ScheduleRepo } from "../repos/schedule-repo.js";
import type { AgentRepo } from "../repos/agent-repo.js";
import type { RunService } from "./run-service.js";
import { emit } from "../lib/event-bus.js";

export interface SchedulerService {
  boot(): void;
  register(agentId: string, cronExpression: string, task: string): void;
  unregister(agentId: string): void;
  computeNextRunAt(cronExpression: string): string | null;
  shutdown(): void;
}

export function createSchedulerService(
  scheduleRepo: ScheduleRepo,
  agentRepo: AgentRepo,
  runService: RunService,
): SchedulerService {
  const jobs = new Map<string, ScheduledTask>();

  return {
    boot() {
      const schedules = scheduleRepo.findEnabled();
      let registered = 0;
      for (const schedule of schedules) {
        if (!schedule.backendExpression) continue;
        try {
          const agent = agentRepo.findById(schedule.agentId);
          if (!agent.enabled) continue;

          this.register(
            schedule.agentId,
            schedule.backendExpression,
            schedule.plainEnglish ?? "Scheduled run",
          );
          registered++;
        } catch {
          // Agent may have been deleted — skip
        }
      }
      if (registered > 0) {
        console.log(`Scheduler: registered ${registered} cron job${registered !== 1 ? "s" : ""}`);
      }
    },

    register(agentId: string, cronExpression: string, task: string) {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        console.warn(`Scheduler: invalid cron expression "${cronExpression}" for agent ${agentId}`);
        return;
      }

      // Remove existing job if any
      const existing = jobs.get(agentId);
      if (existing) {
        existing.stop();
        jobs.delete(agentId);
      }

      const job = cron.schedule(cronExpression, async () => {
        try {
          // Verify agent is still enabled before running
          const agent = agentRepo.findById(agentId);
          if (!agent.enabled) {
            this.unregister(agentId);
            return;
          }

          emit("schedule.fired", { agentId, scheduleId: agentId });
          await runService.start(agentId, task, "schedule");

          // Update nextRunAt after firing
          const nextRunAt = this.computeNextRunAt(cronExpression);
          if (nextRunAt) {
            scheduleRepo.updateNextRunAt(agentId, nextRunAt);
          }
        } catch (err) {
          console.error(`Scheduler: failed to run agent ${agentId}:`, err);
        }
      });

      jobs.set(agentId, job);
    },

    unregister(agentId: string) {
      const job = jobs.get(agentId);
      if (job) {
        job.stop();
        jobs.delete(agentId);
      }
    },

    computeNextRunAt(cronExpression: string): string | null {
      try {
        const expr = CronExpressionParser.parse(cronExpression);
        return expr.next().toISOString();
      } catch {
        return null;
      }
    },

    shutdown() {
      for (const [id, job] of jobs) {
        job.stop();
      }
      jobs.clear();
      console.log("Scheduler: all jobs stopped");
    },
  };
}
