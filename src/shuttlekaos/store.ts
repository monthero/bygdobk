import dayjs from 'dayjs';
import { z } from 'zod';

import { Session, SessionStatus, SetupProblem } from './model.ts';

export const SESSION_IDLE_MINUTES = 60;

export const isStale = (session: Pick<Session, 'status' | 'updatedAt'>) =>
  session.status !== SessionStatus.enum.finished && dayjs().diff(session.updatedAt, 'minute') >= SESSION_IDLE_MINUTES;

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

export const Nudge = z.union([z.object({ revision: z.number().int() }), z.object({ deleted: z.literal(true) })]);
export type Nudge = z.infer<typeof Nudge>;

export const ShuttleKaosAction = z.enum(['create', 'save', 'start', 'join', 'leave', 'delete']);
export type ShuttleKaosAction = z.infer<typeof ShuttleKaosAction>;

export const ShuttleKaosRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal(ShuttleKaosAction.enum.create), session: Session }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.save), session: Session }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.start), code: ShareCode, revision: z.number().int().min(1) }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.join), code: ShareCode }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.leave), code: ShareCode }),
  z.object({ action: z.literal(ShuttleKaosAction.enum.delete), code: ShareCode }),
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
