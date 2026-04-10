import { z } from "zod";

export const RuleItemSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  content: z.string().min(1).max(500),
  priority: z.number().int().min(0).max(100).default(50),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RuleItem = z.infer<typeof RuleItemSchema>;

export const CreateRuleItemInput = RuleItemSchema.pick({
  content: true,
  priority: true,
  enabled: true,
});
export type CreateRuleItemInput = z.infer<typeof CreateRuleItemInput>;

export const UpdateRuleItemInput = CreateRuleItemInput.partial();
export type UpdateRuleItemInput = z.infer<typeof UpdateRuleItemInput>;
