import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Badge, Group, Stack, Text, ThemeIcon, type MantineColor } from '@mantine/core';
import { memo, type FC, type ReactNode } from 'react';

import { Clock, Globe, LockSimple, PencilSimple } from '~/components/ui';
import { plannedRounds } from '~/shuttlekaos/engine';
import { EVERYONE_ONCE, Partners, PlayStyle, ScoreMode, type Pair, type Settings } from '~/shuttlekaos/model';

import { estimate } from './estimate';
import {
  durationText,
  FORMAT_LABELS,
  minutesText,
  STYLE_LABELS,
  SummaryPart,
  Visibility,
  VISIBILITY_LABELS,
} from './labels';
import { LevelsText } from './Levels';

import classes from './SettingsSummary.module.css';

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

type ChipProps = {
  part: SummaryPart;
  color: MantineColor;
  icon?: ReactNode;
  onPick?: (part: SummaryPart) => void;
  children: ReactNode;
};

const SummaryChip: FC<ChipProps> = ({ part, color, icon, onPick, children }) =>
  onPick ? (
    <Badge
      component="button"
      type="button"
      size="lg"
      variant="light"
      color={color}
      tt="none"
      leftSection={icon}
      rightSection={<PencilSimple />}
      className={classes.pick}
      onClick={() => onPick(part)}
    >
      {children}
    </Badge>
  ) : (
    <Badge variant="light" color={color} tt="none" leftSection={icon}>
      {children}
    </Badge>
  );

type Props = {
  settings: Settings;
  isPublic: boolean;
  playerCount: number;
  pairs: Pair[];
  onPick?: (part: SummaryPart) => void;
};

export const SettingsSummary = memo<Props>(({ settings, isPublic, playerCount, pairs, onPick }) => {
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

  const visibility = isPublic ? Visibility.enum.public : Visibility.enum.private;

  return (
    <Group gap={6}>
      <SummaryChip part={SummaryPart.enum.format} color="brand" onPick={onPick}>
        {i18n._(FORMAT_LABELS[settings.format].label)}
      </SummaryChip>
      <SummaryChip part={SummaryPart.enum.play} color="teal" onPick={onPick}>
        {play}
      </SummaryChip>
      <SummaryChip part={SummaryPart.enum.courts} color="blue" onPick={onPick}>
        <Plural value={courts} one="# court" other="# courts" />
      </SummaryChip>
      <SummaryChip part={SummaryPart.enum.scoring} color="teal" onPick={onPick}>
        {scoring}
      </SummaryChip>
      <SummaryChip part={SummaryPart.enum.rounds} color="blue" onPick={onPick}>
        {roundsText}
      </SummaryChip>
      <SummaryChip part={SummaryPart.enum.levels} color="grape" onPick={onPick}>
        <LevelsText levels={settings.levels} />
      </SummaryChip>
      <SummaryChip
        part={SummaryPart.enum.visibility}
        color={isPublic ? 'teal' : 'gray'}
        icon={isPublic ? <Globe /> : <LockSimple />}
        onPick={onPick}
      >
        {i18n._(VISIBILITY_LABELS[visibility].label)}
      </SummaryChip>
    </Group>
  );
});

export const SessionEstimate: FC<{ settings: Settings; playerCount: number; pairs: Pair[] }> = ({
  settings,
  playerCount,
  pairs,
}) => {
  const guess = estimate(settings, playerCount, pairs);
  let main: ReactNode = <Trans>Add players to see how long it takes.</Trans>;
  let detail: ReactNode = null;
  if (guess) {
    const perRound = minutesText(guess.roundMinutes);
    if (guess.totalMinutes === null || guess.rounds === null) {
      main = <Trans>About {perRound} per round</Trans>;
      detail = <Trans>Play as long as you like.</Trans>;
    } else {
      const total = durationText(guess.totalMinutes);
      main = <Trans>About {total}</Trans>;
      detail = (
        <Trans>
          <Plural value={guess.rounds} one="# round" other="# rounds" />, about {perRound} each
        </Trans>
      );
    }
  }
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" color="brand" radius="xl" size={40}>
        <Clock />
      </ThemeIcon>
      <Stack gap={0}>
        <Text fw={700} size={guess ? 'lg' : 'sm'} c={guess ? undefined : 'dimmed'}>
          {main}
        </Text>
        {detail && (
          <Text size="sm" c="dimmed">
            {detail}
          </Text>
        )}
      </Stack>
    </Group>
  );
};
