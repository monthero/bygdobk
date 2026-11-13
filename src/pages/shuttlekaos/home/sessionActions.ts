import { useCallback, useState } from 'react';
import { z } from 'zod';

import type { SessionSummary } from '~/shuttlekaos/model';

export const Action = z.enum(['leave', 'delete']);
export type Action = z.infer<typeof Action>;

export type AskedAction = { action: Action; summary: SessionSummary };

export const useSessionActions = () => {
  const [asked, setAsked] = useState<AskedAction | null>(null);
  const ask = useCallback((action: Action, summary: SessionSummary) => setAsked({ action, summary }), []);
  const close = useCallback(() => setAsked(null), []);
  return { asked, ask, close };
};
