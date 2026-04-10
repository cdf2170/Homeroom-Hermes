import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createTestApp } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("Agent CRUD", () => {
  let agentId: string;

  it("GET /api/agents returns 2 seeded mock agents", async () => {
    const res = await app.inject({ method: "GET", url: "/api/agents" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("trustPosture");
  });

  it("POST /api/agents creates an agent and emits 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/agents",
      payload: {
        name: "Test Agent",
        purpose: "Testing the backend",
        archetype: "builder",
        vibe: "precise",
        smartnessLevel: "advanced",
        runtimeMode: "local",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe("Test Agent");
    expect(body.archetype).toBe("builder");
    expect(Array.isArray(body.memoryItems)).toBe(true);
    expect(Array.isArray(body.ruleItems)).toBe(true);
    expect(body.permissionProfile).not.toBeNull();
    agentId = body.id;
  });

  it("GET /api/agents/:id returns the created agent", async () => {
    const res = await app.inject({ method: "GET", url: `/api/agents/${agentId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(agentId);
    expect(body.name).toBe("Test Agent");
  });

  it("PATCH /api/agents/:id updates the agent", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/agents/${agentId}`,
      payload: { purpose: "Updated purpose" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().purpose).toBe("Updated purpose");
  });

  it("PATCH enabling agent with active schedule creates trust finding", async () => {
    // First set up a schedule
    await app.inject({
      method: "PUT",
      url: `/api/agents/${agentId}/schedule`,
      payload: { enabled: true, preset: "daily", timezone: "UTC" },
    });
    // Then disable the agent (agent starts disabled)
    const res = await app.inject({
      method: "PATCH",
      url: `/api/agents/${agentId}`,
      payload: { enabled: false },
    });
    expect(res.statusCode).toBe(200);

    // Trust findings should include SCHEDULE_AGENT_DISABLED
    const trustRes = await app.inject({
      method: "GET",
      url: `/api/agents/${agentId}/trust`,
    });
    const findings = trustRes.json();
    expect(Array.isArray(findings)).toBe(true);
    const codes = findings.map((f: { code: string }) => f.code);
    expect(codes).toContain("SCHEDULE_AGENT_DISABLED");
  });

  it("GET /api/agents/:id/activity returns audit events", async () => {
    const res = await app.inject({ method: "GET", url: `/api/agents/${agentId}/activity` });
    expect(res.statusCode).toBe(200);
    const events = res.json();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("eventType");
  });

  it("POST /api/agents/:id/run starts a run", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/agents/${agentId}/run`,
      payload: { input: "Hello agent" },
    });
    expect(res.statusCode).toBe(202);
    const run = res.json();
    expect(run).toHaveProperty("id");
    expect(["running", "pending", "completed"]).toContain(run.status);
  });

  it("GET /api/agents/:id/runs returns run history", async () => {
    const res = await app.inject({ method: "GET", url: `/api/agents/${agentId}/runs` });
    expect(res.statusCode).toBe(200);
    const runs = res.json();
    expect(Array.isArray(runs)).toBe(true);
    expect(runs.length).toBeGreaterThanOrEqual(1);
  });

  it("DELETE /api/agents/:id returns 204", async () => {
    const res = await app.inject({ method: "DELETE", url: `/api/agents/${agentId}` });
    expect(res.statusCode).toBe(204);
  });

  it("GET /api/agents/:id after delete returns 404", async () => {
    const res = await app.inject({ method: "GET", url: `/api/agents/${agentId}` });
    expect(res.statusCode).toBe(404);
  });
});

describe("Trust center", () => {
  it("GET /api/trust/findings returns trust center view", async () => {
    const res = await app.inject({ method: "GET", url: "/api/trust/findings" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("overallPosture");
    expect(body).toHaveProperty("findings");
    expect(Array.isArray(body.findings)).toBe(true);
  });
});
