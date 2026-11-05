import { z } from 'zod';

import { Group, GROUP_SLUGS, PriceKind, PRICES, seasonTotal, type Price } from '~/data/club';
import { numberFormat } from '~/i18n/current';

export const Joiner = z.enum(['me', 'child']);
export type Joiner = z.infer<typeof Joiner>;

const PRICE_IDS = new Set(PRICES.map((p) => p.id));
const GROUP_IDS = new Set<string>(Group.options);

export const JOIN_SEARCH = z.object({
  steg: z.number().int().min(1).max(4).optional().catch(undefined),
  gruppe: GROUP_SLUGS.schema,
  pris: z
    .string()
    .refine((id) => PRICE_IDS.has(id))
    .optional()
    .catch(undefined),
  for: Joiner.optional().catch(undefined),
});

export const kr = (n: number) => `kr\u00a0${numberFormat().format(n)}`;

const priceOfKind = (kind: PriceKind) => {
  const price = PRICES.find((p) => p.kind === kind);
  if (!price) throw new Error(`No ${kind} price`);
  return price;
};

export const DROPIN = priceOfKind(PriceKind.enum.dropin);
export const DROPIN_VISIT = DROPIN.perVisit ?? 0;
export const TRIAL = priceOfKind(PriceKind.enum.trial);
export const SEASON_FROM = Math.min(
  ...PRICES.values()
    .filter((p) => p.kind === PriceKind.enum.season)
    .map(seasonTotal),
);

export const TRY_SEARCH = { pris: DROPIN.id, for: Joiner.enum.me };
export const TRIAL_SEARCH = { pris: TRIAL.id, for: Joiner.enum.child };

export const groupOfPrice = (price: Price): Group | undefined => {
  if (price.kind === PriceKind.enum.trial) return Group.enum.rekrutt;
  if (price.kind === PriceKind.enum.season && GROUP_IDS.has(price.id)) return Group.parse(price.id);
  return undefined;
};

export const priceForGroup = (group: Group | undefined) =>
  group ? PRICES.find((p) => p.kind === PriceKind.enum.season && groupOfPrice(p) === group) : undefined;
