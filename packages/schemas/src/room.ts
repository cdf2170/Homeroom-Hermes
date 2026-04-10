import { z } from "zod";
import { RoomId } from "./enums.js";

export const RoomDefinition = z.object({
  id: RoomId,
  label: z.string(),
  description: z.string(),
  maxOccupants: z.number().int().positive(),
  defaultForArchetypes: z.array(z.string()),
  background: z.string(),
});
export type RoomDefinition = z.infer<typeof RoomDefinition>;
