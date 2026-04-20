import type { FastifyPluginAsync } from "fastify";
import type { RuntimeService } from "../services/runtime-service.js";

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  details?: { family?: string; parameter_size?: string; quantization_level?: string };
}

export function buildRuntimeRoutes(runtimeService: RuntimeService): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/runtime/health", async (_req, reply) => {
      const health = await runtimeService.health();
      return reply.send(health);
    });

    app.get("/api/runtime/models", async (_req, reply) => {
      const models = await runtimeService.listModels();
      return reply.send(models);
    });

    /** List locally available Ollama models. Returns [] if Ollama is not running. */
    app.get("/api/runtime/local-models", async (_req, reply) => {
      try {
        const res = await fetch("http://127.0.0.1:11434/api/tags", {
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return reply.send({ models: [], ollamaRunning: false });
        const data = await res.json() as { models?: OllamaModel[] };
        const models = (data.models ?? []).map(m => ({
          id: m.name,
          name: m.name.split(":")[0],
          tag: m.name.includes(":") ? m.name.split(":")[1] : "latest",
          sizeGB: +(m.size / 1e9).toFixed(1),
          family: m.details?.family ?? null,
          parameterSize: m.details?.parameter_size ?? null,
          quantization: m.details?.quantization_level ?? null,
        }));
        return reply.send({ models, ollamaRunning: true });
      } catch {
        return reply.send({ models: [], ollamaRunning: false });
      }
    });
  };
}
