import { z } from "zod";

export const MemoryItemSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  category: z
    .enum(["fact", "preference", "context", "instruction", "history"])
    .default("fact"),
  pinned: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MemoryItem = z.infer<typeof MemoryItemSchema>;

export const CreateMemoryItemInput = MemoryItemSchema.pick({
  content: true,
  category: true,
  pinned: true,
});
export type CreateMemoryItemInput = z.infer<typeof CreateMemoryItemInput>;

export const UpdateMemoryItemInput = CreateMemoryItemInput.partial();
export type UpdateMemoryItemInput = z.infer<typeof UpdateMemoryItemInput>;
