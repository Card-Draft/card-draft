import { z } from 'zod'

export const M15FieldsSchema = z.object({
  name: z.string().default('New Card'),
  manaCost: z.string().default(''),
  color: z
    .enum(['white', 'blue', 'black', 'red', 'green', 'gold', 'colorless', 'land'])
    .default('colorless'),
  supertype: z.string().default(''),
  type: z.string().default('Instant'),
  subtype: z.string().default(''),
  art: z.string().optional(),
  artCropX: z.string().default('0'),
  artCropY: z.string().default('0'),
  artCropWidth: z.string().default('1'),
  artCropHeight: z.string().default('1'),
  rulesText: z.string().default(''),
  flavorText: z.string().default(''),
  power: z.string().default(''),
  toughness: z.string().default(''),
  rarity: z.enum(['common', 'uncommon', 'rare', 'mythic']).default('common'),
  rarityIcon: z.string().optional(),
  artist: z.string().default(''),
  collectorNumber: z.string().default('1'),
})

export type M15Fields = z.infer<typeof M15FieldsSchema>
