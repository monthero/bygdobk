import { Trans } from '@lingui/react/macro';
import { Anchor, Button, Group, Stack, Text, useMatches, type MantineSize } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC, Ref } from 'react';

import { ArrowRight, Shuttle, UserPlus } from '~/components/ui';
import { kr, useOffers } from '~/pages/join/offers';

type Props = {
  size?: MantineSize;
  joinRef?: Ref<HTMLAnchorElement>;
  joinClassName?: string;
  textClassName?: string;
};

export const HeroActions: FC<Props> = ({ size = 'lg', joinRef, joinClassName, textClassName }) => {
  const buttonSize = useMatches({ base: 'md', xs: size });
  const { dropin, trial, seasonFrom, trySearch, trialSearch } = useOffers();
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
          renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" search={trySearch} />}
        >
          <Trans>Try a session</Trans>
        </Button>
      </Group>
      <Stack gap={2} className={textClassName}>
        {dropin?.perVisit !== undefined && seasonFrom !== undefined && (
          <Text size="sm" className="tabular">
            <Trans>
              Drop-in {kr(dropin.perVisit)} (+ {kr(dropin.membership)} membership) · Season from {kr(seasonFrom)}
            </Trans>
          </Text>
        )}
        {trial && (
          <Anchor
            size="sm"
            fw={600}
            w="fit-content"
            className="tabular"
            renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" search={trialSearch} />}
          >
            <Trans>Kids 7–12: try half a season for {kr(trial.membership)}</Trans> <ArrowRight />
          </Anchor>
        )}
      </Stack>
    </Stack>
  );
};
