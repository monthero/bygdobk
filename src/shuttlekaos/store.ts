import dayjs from 'dayjs';
import { z } from 'zod';

import { Session, SessionStatus, SetupProblem, WeeksBetween } from './model.ts';

export const SESSION_IDLE_MINUTES = 60;
export const MAX_DAYS_AHEAD = 60;

type IdleClock = Pick<Session, 'status' | 'updatedAt' | 'scheduledAt'>;

export const idleSince = ({ status, updatedAt, scheduledAt }: IdleClock) => {
  if (status !== SessionStatus.enum.open || !scheduledAt) return updatedAt;
  return dayjs(scheduledAt).isAfter(updatedAt) ? scheduledAt : updatedAt;
};

export const isStale = (session: IdleClock) =>
  session.status !== SessionStatus.enum.finished && dayjs().diff(idleSince(session), 'minute') >= SESSION_IDLE_MINUTES;

export const canSchedule = (iso: string) => {
  const at = dayjs(iso);
  return at.isAfter(dayjs()) && !at.isAfter(dayjs().add(MAX_DAYS_AHEAD, 'day'));
};

export const ShuttleKaosProblem = z.enum([
  'offline',
  'loggedOut',
  'notAllowed',
  'notFound',
  'invalid',
  'busy',
  'locked',
  'full',
  'stale',
  'tooMany',
  'failed',
]);
export type ShuttleKaosProblem = z.infer<typeof ShuttleKaosProblem>;

export const ShareCode = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[2-9a-z]{10}$/);

export const NUDGE_EVENT = 'changed';

export const sessionTopic = (shareCode: string) => `shuttlekaos:${shareCode}`;

export const Nudge = z.union([
  z.object({ revision: z.number().int() }),
  z.object({ deleted: z.literal(true) }),
  z.object({ chat: z.literal(true) }),
]);
export type Nudge = z.infer<typeof Nudge>;

export const ShuttleKaosAction = z.enum(['create', 'save', 'start', 'join', 'leave', 'delete', 'link']);
export type ShuttleKaosAction = z.infer<typeof ShuttleKaosAction>;

export const SeriesPlan = z.object({ every: WeeksBetween, endsOn: z.iso.date().nullable() });
export type SeriesPlan = z.infer<typeof SeriesPlan>;

export const ShuttleKaosRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal(ShuttleKaosAction.enum.create), session: Session, series: SeriesPlan.nullish() }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.save), session: Session }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.start), code: ShareCode, revision: z.number().int().min(1) }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.join), code: ShareCode }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.leave), code: ShareCode }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.delete), code: ShareCode }),
  z.object({
    action: z.literal(ShuttleKaosAction.enum.link),
    code: ShareCode,
    playerId: z.string().min(1),
    profileId: z.uuid().nullable(),
  }),
]);
export type ShuttleKaosRequest = z.infer<typeof ShuttleKaosRequest>;

export const ShuttleKaosReply = z.object({ shareCode: z.string(), session: Session.nullable() });
export type ShuttleKaosReply = z.infer<typeof ShuttleKaosReply>;

export const ShuttleKaosFailure = z.object({
  error: ShuttleKaosProblem,
  names: z.array(z.string()).optional(),
  setup: SetupProblem.optional(),
  session: Session.optional(),
});
export type ShuttleKaosFailure = z.infer<typeof ShuttleKaosFailure>;
