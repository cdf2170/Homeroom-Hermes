import { z } from "zod";
import {
  SkinTone,
  HairStyle,
  HairColor,
  OutfitStyle,
  OutfitColor,
  GlassesStyle,
  AccessoryType,
  BadgeStyle,
} from "./enums.js";

export const SpriteConfig = z.object({
  frameWidth: z.number().int().default(32),
  frameHeight: z.number().int().default(48),
  scale: z.number().default(2),
  animationSpeed: z.number().default(0.15),
});
export type SpriteConfig = z.infer<typeof SpriteConfig>;

export const AgentAppearanceSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  skinTone: SkinTone.default("medium"),
  hairStyle: HairStyle.default("short"),
  hairColor: HairColor.default("brown"),
  outfitStyle: OutfitStyle.default("casual"),
  outfitColor: OutfitColor.default("blue"),
  glasses: GlassesStyle.default("none"),
  accessories: z.array(AccessoryType).default([]),
  badge: BadgeStyle.default("none"),
  spriteConfig: SpriteConfig.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AgentAppearance = z.infer<typeof AgentAppearanceSchema>;

export const CreateAppearanceInput = AgentAppearanceSchema.omit({
  id: true,
  agentId: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateAppearanceInput = z.infer<typeof CreateAppearanceInput>;
