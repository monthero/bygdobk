import { Trans } from '@lingui/react/macro';
import { Anchor, Button, Group, Stack, Text, useMatches, type MantineSize } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC, Ref } from 'react';

import { ArrowRight, Shuttle, UserPlus } from '~/components/ui';
import { DROPIN, DROPIN_VISIT, kr, SEASON_FROM, TRIAL, TRIAL_SEARCH, TRY_SEARCH } from '~/pages/join/offers';

type Props = {
  size?: MantineSize;
  joinRef?: Ref<HTMLAnchorElement>;
  joinClassName?: string;
  textClassName?: string;
};

export const HeroActions: FC<Props> = ({ size = 'lg', joinRef, joinClassName, textClassName }) => {
  const buttonSize = useMatches({ base: 'md', xs: size });
  return (
    <Stack gap="sm">
      <Group gap="sm">
        <Button
          ref={joinRef}
          component={Link}
          to="/medlemskap/bli-medlem"
          size={buttonSize}
          leftSection={<UserPlus />}
          className={joinClassName}
        >
          <Trans>Join the club</Trans>
        </Button>
        <Button
          size={buttonSize}
          variant="default"
          leftSection={<Shuttle />}
          renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" search={TRY_SEARCH} />}
        >
          <Trans>Try a session</Trans>
        </Button>
      </Group>
      <Stack gap={2} className={textClassName}>
        <Text size="sm" className="tabular">
          <Trans>
            Drop-in {kr(DROPIN_VISIT)} (+ {kr(DROPIN.membership)} membership) · Season from {kr(SEASON_FROM)}
          </Trans>
        </Text>
        <Anchor
          size="sm"
          fw={600}
          w="fit-content"
          className="tabular"
          renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" search={TRIAL_SEARCH} />}
        >
          <Trans>Kids 7–12: try half a season for {kr(TRIAL.membership)}</Trans> <ArrowRight />
        </Anchor>
      </Stack>
    </Stack>
  );
};
