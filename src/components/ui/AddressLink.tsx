import { useLingui } from '@lingui/react/macro';
import { Anchor } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { useClub } from '~/cms/siteData';
import { mapLink, placeText, type Place } from '~/utils/maps';

export const AddressLink: FC<{ place?: Place; children?: ReactNode }> = ({ place, children }) => {
  const { t } = useLingui();
  const home = useClub().venue;
  const shown = place ?? home;
  if (!shown) return null;
  return (
    <Anchor {...mapLink(shown)} inherit c="inherit" underline="always" title={t`Open in maps`}>
      {placeText(shown)}
      {children}
    </Anchor>
  );
};
