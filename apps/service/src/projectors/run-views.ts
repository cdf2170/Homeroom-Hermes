import type { RunRecord } from "@homeroom/schemas";
import type { RunView } from "@homeroom/contracts";

export function toRunView(record: RunRecord): RunView {
  return {
    id: record.id,
    agentId: record.agentId,
    trigger: record.trigger,
    status: record.status,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    inputSummary: record.inputSummary,
    outputSummary: record.outputSummary,
    errorSummary: record.errorSummary,
  };
}
