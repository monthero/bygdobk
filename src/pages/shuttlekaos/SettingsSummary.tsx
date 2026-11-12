import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Badge, Group } from '@mantine/core';
import { memo, type FC, type ReactNode } from 'react';

import { Globe, LockSimple } from '~/components/ui';
import { plannedRounds } from '~/shuttlekaos/engine';
import { EVERYONE_ONCE, Partners, PlayStyle, ScoreMode, type Pair, type Settings } from '~/shuttlekaos/model';

import { FORMAT_LABELS, STYLE_LABELS, Visibility, VISIBILITY_LABELS } from './labels';
import { LevelsText } from './Levels';

export const VisibilityBadge: FC<{ isPublic: boolean }> = ({ isPublic }) => {
  const { i18n } = useLingui();
  const visibility = isPublic ? Visibility.enum.public : Visibility.enum.private;
  return (
    <Badge
      variant="light"
      color={isPublic ? 'teal' : 'gray'}
      leftSection={isPublic ? <Globe /> : <LockSimple />}
      tt="none"
    >
      {i18n._(VISIBILITY_LABELS[visibility].label)}
    </Badge>
  );
};

type Props = { settings: Settings; isPublic: boolean; playerCount: number; pairs: Pair[] };

export const SettingsSummary = memo<Props>(({ settings, isPublic, playerCount, pairs }) => {
  const { i18n } = useLingui();
  const { courts, points, rounds } = settings;
  let play: ReactNode = i18n._(STYLE_LABELS[settings.style]);
  if (settings.style === PlayStyle.enum.doubles) {
    play =
      settings.partners === Partners.enum.fixed ? (
        <Trans>Doubles, fixed partners</Trans>
      ) : (
        <Trans>Doubles, rotating partners</Trans>
      );
  }

  const planned = plannedRounds(settings, playerCount, pairs) ?? 0;
  let roundsText: ReactNode = <Trans>Until we stop</Trans>;
  if (rounds === EVERYONE_ONCE) {
    roundsText =
      planned > 0 ? (
        <Trans comment="Rounds until everyone has played together, e.g. Everyone together, ~9 rounds">
          Everyone together, ~{planned} rounds
        </Trans>
      ) : (
        <Trans>Until everyone has played together</Trans>
      );
  } else if (rounds !== null) roundsText = <Plural value={rounds} one="# round" other="# rounds" />;

  let scoring;
  if (settings.scoreMode === ScoreMode.enum.total) scoring = <Trans>{points} points per match</Trans>;
  else if (settings.sets === 3) scoring = <Trans>Best of 3 to {points}</Trans>;
  else scoring = <Trans>First to {points}</Trans>;

  return (
    <Group gap={6}>
      <Badge variant="light" tt="none">
        {i18n._(FORMAT_LABELS[settings.format].label)}
      </Badge>
      <Badge variant="default" tt="none">
        {play}
      </Badge>
      <Badge variant="default" tt="none">
        <Plural value={courts} one="# court" other="# courts" />
      </Badge>
      <Badge variant="default" tt="none">
        {scoring}
      </Badge>
      <Badge variant="default" tt="none">
        {roundsText}
      </Badge>
      <Badge variant="default" tt="none">
        <LevelsText levels={settings.levels} />
      </Badge>
      <VisibilityBadge isPublic={isPublic} />
    </Group>
  );
});
