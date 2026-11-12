import { useLingui } from '@lingui/react/macro';

import { notifyFailed } from '~/pages/board/format';
import { ShuttleKaosError, shuttleKaosErrorMessage, useSaveSession } from '~/shuttlekaos/queries';
import { ShuttleKaosProblem } from '~/shuttlekaos/store';

export const busyNamesOf = (error: unknown) =>
  error instanceof ShuttleKaosError && error.problem === ShuttleKaosProblem.enum.busy ? error.busyNames : null;

export const useSessionSave = () => {
  const { i18n } = useLingui();
  return useSaveSession({
    onError: (error) => {
      if (!busyNamesOf(error)) notifyFailed(i18n._(shuttleKaosErrorMessage(error)));
    },
  });
};
