import { z } from 'zod';

export const PerkIcon = z.enum(['tshirt', 'sneaker', 'truck', 'tag', 'percent', 'gift', 'racket', 'shuttle']);
export type PerkIcon = z.infer<typeof PerkIcon>;

export const PERK_ICON_NAMES: Record<PerkIcon, string> = {
  [PerkIcon.enum.tshirt]: 'T-shirt',
  [PerkIcon.enum.sneaker]: 'Shoe',
  [PerkIcon.enum.truck]: 'Delivery truck',
  [PerkIcon.enum.tag]: 'Price tag',
  [PerkIcon.enum.percent]: 'Percent',
  [PerkIcon.enum.gift]: 'Gift',
  [PerkIcon.enum.racket]: 'Racket',
  [PerkIcon.enum.shuttle]: 'Shuttle',
};
