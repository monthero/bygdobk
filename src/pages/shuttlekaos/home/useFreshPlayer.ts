import { useSessionUserId } from '~/components/auth/hooks';
import type { SessionSummary, SessionSummaryPage } from '~/shuttlekaos/model';
import { useMyActiveSessions, useMySessionHistory } from '~/shuttlekaos/queries';

const selectHasActive = (sessions: SessionSummary[]) => sessions.length > 0;
const selectHasHistory = (page: SessionSummaryPage) => page.total > 0;

export const useFreshPlayer = () => {
  const userId = useSessionUserId();
  const hasActive = useMyActiveSessions({ select: selectHasActive }).data;
  const hasHistory = useMySessionHistory(1, { select: selectHasHistory }).data;
  return !userId || (hasActive === false && hasHistory === false);
};
