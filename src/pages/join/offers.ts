import { useMemo } from 'react';
import { z } from 'zod';

import { useSiteContent, type Plan } from '~/cms/content';
import { Group, GROUP_SLUGS, PlanAudience, PriceKind } from '~/data/club';
import { numberFormat } from '~/i18n/current';

export const Joiner = z.enum(['me', 'child']);
export type Joiner = z.infer<typeof Joiner>;

export const JOIN_SEARCH = z.object({
  gruppe: GROUP_SLUGS.schema,
  pris: z.string().min(1).optional().catch(undefined),
  for: Joiner.optional().catch(undefined),
});

export const kr = (n: number) => `kr ${numberFormat().format(n)}`;

export const planTotal = (plan: Plan) => plan.membership + plan.training;

const JOINER_AUDIENCE: Record<Joiner, PlanAudience> = {
  [Joiner.enum.me]: PlanAudience.enum.adult,
  [Joiner.enum.child]: PlanAudience.enum.child,
};

const AUDIENCE_JOINER: Partial<Record<PlanAudience, Joiner>> = {
  [PlanAudience.enum.adult]: Joiner.enum.me,
  [PlanAudience.enum.child]: Joiner.enum.child,
};

export const joinerOfPlan = (plan: Plan | undefined) => (plan ? AUDIENCE_JOINER[plan.audience] : undefined);

export const fitsJoiner = (plan: Plan, joiner: Joiner | undefined) =>
  !joiner || plan.audience === PlanAudience.enum.all || plan.audience === JOINER_AUDIENCE[joiner];

export const groupOfPlan = (plan: Plan): Group | undefined => {
  if (plan.kind === PriceKind.enum.trial) return Group.enum.rekrutt;
  return plan.kind === PriceKind.enum.season ? plan.group : undefined;
};

export const planForGroup = (plans: readonly Plan[], group: Group | undefined) =>
  group ? plans.find((p) => p.kind === PriceKind.enum.season && p.group === group) : undefined;

const offersOf = (plans: readonly Plan[]) => {
  const dropin = plans.find((p) => p.kind === PriceKind.enum.dropin);
  const trial = plans.find((p) => p.kind === PriceKind.enum.trial);
  const seasonTotals = plans
    .values()
    .filter((p) => p.kind === PriceKind.enum.season)
    .map(planTotal)
    .toArray();
  return {
    dropin,
    trial,
    seasonFrom: seasonTotals.length > 0 ? Math.min(...seasonTotals) : undefined,
    trySearch: { pris: dropin?.id, for: Joiner.enum.me },
    trialSearch: { pris: trial?.id, for: Joiner.enum.child },
  };
};

export const useOffers = () => {
  const { plans } = useSiteContent();
  return useMemo(() => offersOf(plans), [plans]);
};
